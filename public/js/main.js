navigator.geolocation.getCurrentPosition(function(position) {
  let location = [position.coords.longitude, position.coords.latitude];
  let currentGeoHashes = [];
  let source = new mapboxgl.GeoJSONSource({
    data: {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": location
        }
      }]
    }
  });
  let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/averagemarcus/ciqtrpz6c0012c6m0r52j4pth',
    center: location,
    zoom: 20,
    minZoom: 18,
    maxZoom: 20,
    dragPan: false
  });

  function createSprite(data) {
    var monsterIcon = new Image();
    monsterIcon.src = data.sprite;
    monsterIcon.height = 50;
    monsterIcon.width = 50;
    monsterIcon.dataset.expires = data.expires;
    monsterIcon.dataset.pokemon = data.id;
    monsterIcon.dataset.name = data.name[0].toUpperCase() + data.name.substring(1);
    monsterIcon.dataset.hp = data.hp;
    monsterIcon.dataset.types = data.types.join(', ');
    monsterIcon.classList.add('sprite');
    monsterIcon.classList.add('pokemon');
    return monsterIcon;
  }

  function isInMapBounds(lngLat) {
    let lng = parseFloat(lngLat[0]);
    let lat = parseFloat(lngLat[1]);
    let mapBounds = map.getBounds();
    if(lng > mapBounds.getWest() && lng < mapBounds.getEast() && lat < mapBounds.getNorth() && lat > mapBounds.getSouth()) {
      return true;
    }
    return false;
  }

  function encounter(data) {
    var marker = new mapboxgl.Marker(createSprite(data))
      .setLngLat(data.coordinates)
      .addTo(map);

    // If encounter is within visible map
    if(isInMapBounds(data.coordinates)) {
      console.log('Encounter!');
      navigator.vibrate(1000);
    } else {
      // TODO: Show arrow indicators
    }
  }

  function update() {
    map.resize().setMaxBounds();
    source.setData({
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": location
        }
      }]
    });
    map.flyTo({ center: location });

    let mapBounds = map.getBounds();
    let geoHashes = ngeohash.bboxes(mapBounds._sw.lat, mapBounds._sw.lng, mapBounds._ne.lat, mapBounds._ne.lng, 6);
    currentGeoHashes.forEach(geohash => {
      if(!geoHashes.includes(geohash)) {
        // Unsubscribe from any hash we've moved out of
        pusher.unsubscribe(geohash);
      }
    });
    currentGeoHashes = currentGeoHashes.filter(geohash => geoHashes.includes(geohash));
    geoHashes.forEach(geohash => {
      if(!currentGeoHashes.includes(geohash)) {
        // Subscribe to any new hashes we've moved into
        currentGeoHashes.push(geohash);
        pusher.subscribe(geohash).bind('encounter', encounter);
      }
    });
  }

  // Update map and pin as user moves
  navigator.geolocation.watchPosition(function(position) {
    location = [position.coords.longitude, position.coords.latitude];
    update();
  });

  map.on('zoomend', update);
  map.on('rotateend', update);
  map.on('load', function () {
    map.addSource('me', source);
    map.addLayer({
        "id": "me",
        "type": "symbol",
        "source": "me",
        "layout": {
            "icon-image": "circle-15"
        }
    });
    update();
    hideLoading();
  });

  // Remove all expired sprites
  (function removeExpired() {
    let now = (new Date()).getTime();
    let allSprites = document.querySelectorAll('[data-expires]');
    for(let sprite of allSprites) {
      if(sprite.dataset.expires < now) {
        sprite.remove();
      }
    }
    requestAnimationFrame(removeExpired);
  }());

}, ()=>{}, { enableHighAccuracy: true });
