// src/ui/shopUI.js
// Renders the bottom shop panel: weapon grid grouped by category for
// whichever player tab is active, plus round-control buttons.

import { CATEGORY_ORDER, CATEGORY_LABELS, getWeaponsByCategory } from '../systems/weapons.js';
import { PHASES } from '../core/gameEngine.js';

const els = {};
let activeShopPlayer = 'p1';
let onBuy = () => {};
let onStartRound = () => {};
let onNextRound = () => {};
let onReset = () => {};
let onKnifeToggle = () => {};

export function initShopUI(handlers) {
  onBuy = handlers.onBuy;
  onStartRound = handlers.onStartRound;
  onNextRound = handlers.onNextRound;
  onReset = handlers.onReset;
  onKnifeToggle = handlers.onKnifeToggle;

  els.tabP1 = document.getElementById('shop-tab-p1');
  els.tabP2 = document.getElementById('shop-tab-p2');
  els.grid = document.getElementById('shop-grid');
  els.startRoundBtn = document.getElementById('start-round-btn');
  els.nextRoundBtn = document.getElementById('next-round-btn');
  els.resetBtn = document.getElementById('reset-btn');
  els.knifeToggle = document.getElementById('knife-toggle');

  els.tabP1.addEventListener('click', () => setActiveTab('p1'));
  els.tabP2.addEventListener('click', () => setActiveTab('p2'));
  els.startRoundBtn.addEventListener('click', onStartRound);
  els.nextRoundBtn.addEventListener('click', onNextRound);
  els.resetBtn.addEventListener('click', onReset);
  els.knifeToggle.addEventListener('change', (e) => onKnifeToggle(e.target.checked));
}

function setActiveTab(key) {
  activeShopPlayer = key;
  els.tabP1.classList.toggle('active', key === 'p1');
  els.tabP2.classList.toggle('active', key === 'p2');
  renderShopGrid(window.__lastState);
}

export function renderShop(state) {
  window.__lastState = state;
  renderShopGrid(state);

  const canShop = state.phase === PHASES.SHOPPING;
  els.startRoundBtn.style.display = canShop ? 'inline-block' : 'none';
  els.nextRoundBtn.style.display = state.phase === PHASES.ROUND_END ? 'inline-block' : 'none';
  els.knifeToggle.disabled = !canShop;
  els.knifeToggle.checked = state.knifeRound;

  document.getElementById('shop-panel').classList.toggle('disabled', !canShop);
}

function renderShopGrid(state) {
  if (!state) return;
  els.grid.innerHTML = '';
  const player = state[activeShopPlayer];
  const canShop = state.phase === PHASES.SHOPPING;

  CATEGORY_ORDER.forEach((category) => {
    const weapons = getWeaponsByCategory(category);
    if (!weapons.length) return;

    const section = document.createElement('div');
    section.className = 'shop-category';

    const heading = document.createElement('h4');
    heading.textContent = CATEGORY_LABELS[category];
    section.appendChild(heading);

    const cardWrap = document.createElement('div');
    cardWrap.className = 'shop-cards';

    weapons.forEach((weapon) => {
      const card = document.createElement('div');
      card.className = 'weapon-card';
      if (player.weaponId === weapon.id) card.classList.add('equipped');

      const affordable = player.money >= weapon.price;
      if (!affordable) card.classList.add('disabled-card');

      card.innerHTML = `
        <div class="weapon-name">${weapon.name}</div>
        <div class="weapon-stats">
          DMG ${weapon.dmgMin}-${weapon.dmgMax} &middot; ACC ${Math.round(weapon.accuracy * 100)}%
        </div>
        <div class="weapon-price">${weapon.price === 0 ? 'FREE' : '$' + weapon.price}</div>
      `;

      if (canShop && affordable) {
        card.addEventListener('click', () => onBuy(activeShopPlayer, weapon.id));
      }

      cardWrap.appendChild(card);
    });

    section.appendChild(cardWrap);
    els.grid.appendChild(section);
  });
}