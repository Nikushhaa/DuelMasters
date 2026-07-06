// src/main.js
// Application entry point. Wires the game engine's events to the UI
// renderers, and DOM controls back to engine actions. This is the only
// file that should import both core and ui modules.

import { gameEngine, PHASES } from './core/gameEngine.js';
import { initBattleUI, renderBattle, renderFullLog, appendLogLines, playHitAnimation } from './ui/battleUI.js';
import { initShopUI, renderShop } from './ui/shopUI.js';

function renderAll(state) {
  renderBattle(state);
  renderShop(state);
}

function init() {
  initBattleUI();
  initShopUI({
    onBuy: (playerKey, weaponId) => gameEngine.buyWeapon(playerKey, weaponId),
    onStartRound: () => gameEngine.startRound(),
    onNextRound: () => gameEngine.nextRound(),
    onReset: () => {
      if (confirm('Reset match and clear saved progress?')) {
        gameEngine.resetMatch();
      }
    },
    onKnifeToggle: (checked) => gameEngine.toggleKnifeRound(checked),
  });

  gameEngine.on('stateChanged', (state) => renderAll(state));
  gameEngine.on('roundStarted', (state) => renderFullLog(state.log));
  gameEngine.on('shotFired', (event) => {
    playHitAnimation(event);
    appendLogLines([gameEngine.getState().log[gameEngine.getState().log.length - 1]]);
  });
  gameEngine.on('roundEnded', () => {
    appendLogLines([gameEngine.getState().log[gameEngine.getState().log.length - 1]]);
  });
  gameEngine.on('matchEnded', ({ winner }) => {
    appendLogLines([gameEngine.getState().log[gameEngine.getState().log.length - 1]]);
    setTimeout(() => {
      alert(`${winner === 'p1' ? 'Player 1' : 'Player 2'} wins the match! Click "Reset Match" to play again.`);
    }, 50);
  });

  document.getElementById('p1-fire-btn').addEventListener('click', () => gameEngine.fire('p1'));
  document.getElementById('p2-fire-btn').addEventListener('click', () => gameEngine.fire('p2'));

  // Keyboard shortcuts: F for player 1, J for player 2 (classic duel feel)
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key.toLowerCase() === 'f') gameEngine.fire('p1');
    if (e.key.toLowerCase() === 'j') gameEngine.fire('p2');
  });

  gameEngine.init({ maxRounds: 5 });
  renderFullLog(gameEngine.getState().log);
  renderAll(gameEngine.getState());
}

document.addEventListener('DOMContentLoaded', init);