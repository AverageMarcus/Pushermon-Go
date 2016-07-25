"use strict";
(function() {
  const modal = document.getElementById('modal');
  const hpColours = {
    high: '#39e239',
    medium: '#e2c139',
    low: '#b50e1a'
  }
  let currentSprite;
  let hitImage;

  function init() {
    hitImage = new Image();
    hitImage.src = '/images/hit.png';
    hitImage.hight = 40;
    hitImage.width = 40;
    hitImage.style.position = 'fixed';

    // Hook up event listeners
    document.querySelector('body').addEventListener('click', show);
    modal.querySelector('.modal-close a').addEventListener('click', hide);
    modal.querySelector('.modal-attack').addEventListener('click', attack);
  }

  function show(event) {
    if(event.target.classList.contains('pokemon')) {
      currentSprite = event.target;
      currentSprite.dataset.currenthp = currentSprite.dataset.hp;

      modal.querySelector('.modal-image').src = event.target.src;
      modal.querySelector('.modal-name').innerHTML = event.target.dataset.name;
      modal.querySelector('.modal-current-hp').style.width = '100%';
      modal.querySelector('.modal-current-hp').style.backgroundColor = '#39e239';
      modal.querySelector('.modal-attack').innerText = 'ATTACK!!!';
      modal.querySelector('.types').innerText = currentSprite.dataset.types;
      modal.classList.remove('hide');
    }
  }

  function hide(event) {
    currentSprite.remove();
    modal.classList.add('hide');
  }

  function displayHit() {
    let boundingBox = modal.querySelector('.modal-image').getBoundingClientRect();
    hitImage.style.top = Math.floor((Math.random() * ((boundingBox.bottom + 10) - boundingBox.top - 10)) + boundingBox.top - 10) + 'px';
    hitImage.style.left = Math.floor((Math.random() * ((boundingBox.left + 10) - boundingBox.right - 10)) + boundingBox.right - 10) + 'px';
    modal.querySelector('.modal-image-container').appendChild(hitImage);

    // Hit movement
    let actions = ['moveback','spinleft','spinright'];
    actions.sort(function() { return 0.5 - Math.random() }); // Shuffle
    modal.querySelector('.modal-image').classList.add(actions.pop());

    setTimeout(() => {
      hitImage.remove();
      modal.querySelector('.modal-image').classList.remove('moveback');
      modal.querySelector('.modal-image').classList.remove('spinleft');
      modal.querySelector('.modal-image').classList.remove('spinright');
    }, 400);
  }

  function getHpColour(current, max) {
    if(current >= max / 2) {
      return hpColours.high;
    } else if(current < max / 2 && current >= max / 4) {
      return hpColours.medium;
    } else if(current < max / 4) {
      return hpColours.low;
    }
  }

  function attack(event) {
    if(currentSprite.dataset.currenthp <= 0 && !currentSprite.dataset.caught) {
      let caught = new Image();
      caught.src = currentSprite.src;
      document.body.querySelector('.caught').appendChild(caught);
      modal.querySelector('.modal-attack').innerText = 'CAUGHT ✅';
      currentSprite.dataset.caught = true;
    } else {
      // Reduce HP bar
      let containerWidth = parseInt(window.getComputedStyle(modal.querySelector('.modal-hp'), null).getPropertyValue('width'));
      let maxWidth = currentSprite.dataset.hp;
      let hpWidth = (--currentSprite.dataset.currenthp / maxWidth)  * containerWidth;
      modal.querySelector('.modal-current-hp').style.width = hpWidth + 'px';
      modal.querySelector('.modal-current-hp').style.backgroundColor = getHpColour(hpWidth, containerWidth);

      if(currentSprite.dataset.currenthp > 0) {
        displayHit();
      }
    }
  }

  init();
}());
