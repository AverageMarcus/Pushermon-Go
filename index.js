'use strict';
const Hapi = require('hapi');
const server = new Hapi.Server();
const fetch = require('node-fetch');
const ngeohash = require('ngeohash');
const utils = require('./utils');
const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET_KEY,
  cluster: process.env.PUSHER_CLUSTER,
  encrypted: true
});

// List of channels that have users subscribed to
let channels = new Set();

server.connection({
    port: process.env.PORT || 8000
});

server.register([require('inert'), require('vision')], (err) => {
  if (err) {
    throw err;
  }

  server.views({
    engines: {
      html: require('handlebars')
    },
    context: {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
      pusherAccessToken: process.env.PUSHER_APP_KEY,
      pusherCluster: process.env.PUSHER_CLUSTER
    },
    relativeTo: __dirname,
    path: 'templates'
  });

  server.route({
    method: 'POST',
    path:'/channelhook',
    handler: function (request, reply) {
      const webhook = pusher.webhook({
        rawBody: JSON.stringify(request.payload),
        headers: request.headers
      });

      if(!webhook.isValid()) {
        console.log('Invalid webhook')
        return reply(400);
      } else {
        reply(200);
      }

      webhook.getEvents().forEach( e => {
        if(e.name == 'channel_occupied') {
          channels.add(e.channel)
        }
        if(e.name == 'channel_vacated') {
          channels.delete(e.channel)
        }
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.view('index');
    }
  });

  // Static resources
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public'
      }
    }
  });

});

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);

  function nextEncounter() {
    const channelArray = Array.from(channels);
    const bounds = channelArray[Math.floor(Math.random()*channelArray.length)];
    if(bounds) {
      const boundingBox = ngeohash.decode_bbox(bounds);
      const lngMin = boundingBox[1];
      const lngMax = boundingBox[3];
      const latMin = boundingBox[0];
      const latMax = boundingBox[2];

      const lng = utils.randomNumber(lngMin, lngMax).toFixed(10);
      const lat = utils.randomNumber(latMin, latMax).toFixed(10);
      const duration = utils.randomNumber(30, 300) * 1000;

      const pokemonId = parseInt(utils.randomNumber(1, 250), 10);

      fetch(`http://pokeapi.co/api/v2/pokemon/${pokemonId}/`)
        .then(res => {
          return res.json();
        })
        .then(pokemon => {
          const data = {
            id: pokemonId,
            name: pokemon.name,
            sprite: `https://pokeapi.co/media/sprites/pokemon/${pokemonId}.png`,
            coordinates: [lng, lat],
            expires: parseInt((new Date()).getTime() + duration, 10),
            hp: pokemon.stats.find(stat => stat.stat.name === 'hp').base_stat,
            types: pokemon.types.map(type => type.type.name[0] + type.type.name.substring(1))
          }

          pusher.trigger(bounds, 'encounter', data);
        });
    }
    setTimeout(nextEncounter, 5000);
  }

  nextEncounter();
});
