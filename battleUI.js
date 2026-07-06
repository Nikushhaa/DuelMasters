// src/ui/battleUI.js
// Renders everything above the shop: the two duelists standing on
// opposite sides of the arena (Bowmasters-style), HP bars, money,
// streak badges, the fight log, and the fire buttons. Also fires the
// bullet-travel animation and hit/recoil effects.

import { getWeapon } from '../systems/weapons.js';
import { getStreakLabel } from '../systems/streaks.js';
import { PHASES } from '../core/gameEngine.js';

const els = {};

export function initBattleUI() {
  els.p1Hp = document.getElementById('p1-hp-fill');
  els.p1HpText = document.getElementById('p1-hp-text');
  els.p1Money = document.getElementById('p1-money');
  els.p1Weapon = document.getElementById('p1-weapon');
  els.p1Streak = document.getElementById('p1-streak');
  els.p1Panel = document.getElementById('p1-panel');
  els.p1FireBtn = document.getElementById('p1-fire-btn');
  els.p1Wins = document.getElementById('p1-wins');
  els.p1Character = document.getElementById('p1-character');

  els.p2Hp = document.getElementById('p2-hp-fill');
  els.p2HpText = document.getElementById('p2-hp-text');
  els.p2Money = document.getElementById('p2-money');
  els.p2Weapon = document.getElementById('p2-weapon');
  els.p2Streak = document.getElementById('p2-streak');
  els.p2Panel = document.getElementById('p2-panel');
  els.p2FireBtn = document.getElementById('p2-fire-btn');
  els.p2Wins = document.getElementById('p2-wins');
  els.p2Character = document.getElementById('p2-character');

  els.roundLabel = document.getElementById('round-label');
  els.phaseLabel = document.getElementById('phase-label');
  els.log = document.getElementById('fight-log');
  els.arena = document.getElementById('arena');
}

export function renderBattle(state) {
  renderPlayer('p1', state.player1, state);
  renderPlayer('p2', state.player2, state);

  els.roundLabel.textContent = `Round ${state.round} — Best of ${state.maxRounds}`;
  els.phaseLabel.textContent = phaseText(state.phase);
  els.p1Wins.textContent = state.matchWins.p1;
  els.p2Wins.textContent = state.matchWins.p2;

  const inBattle = state.phase === PHASES.BATTLE;
  els.p1FireBtn.disabled = !(inBattle && state.turn === 'p1');
  els.p2FireBtn.disabled = !(inBattle && state.turn === 'p2');

  els.p1Panel.classList.toggle('active-turn', inBattle && state.turn === 'p1');
  els.p2Panel.classList.toggle('active-turn', inBattle && state.turn === 'p2');
  els.p1Character.classList.toggle('active-turn', inBattle && state.turn === 'p1');
  els.p2Character.classList.toggle('active-turn', inBattle && state.turn === 'p2');

  els.p1Character.classList.toggle('ko', state.player1.hp <= 0);
  els.p2Character.classList.toggle('ko', state.player2.hp <= 0);
}

function renderPlayer(key, player, state) {
  const hpEl = key === 'p1' ? els.p1Hp : els.p2Hp;
  const hpTextEl = key === 'p1' ? els.p1HpText : els.p2HpText;
  const moneyEl = key === 'p1' ? els.p1Money : els.p2Money;
  const weaponEl = key === 'p1' ? els.p1Weapon : els.p2Weapon;
  const streakEl = key === 'p1' ? els.p1Streak : els.p2Streak;

  hpEl.style.width = `${player.hp}%`;
  hpEl.classList.toggle('low', player.hp <= 30);
  hpTextEl.textContent = `${player.hp} HP`;
  moneyEl.textContent = `$${player.money}`;

  const weaponName = state.knifeRound ? 'Knife (forced)' : getWeapon(player.weaponId).name;
  weaponEl.textContent = weaponName;

  const streakLabel = getStreakLabel(player.streak);
  streakEl.textContent = streakLabel || '';
  streakEl.style.display = streakLabel ? 'inline-block' : 'none';
}

export function appendLogLines(lines) {
  lines.forEach((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    els.log.appendChild(p);
  });
  els.log.scrollTop = els.log.scrollHeight;
}

export function renderFullLog(log) {
  els.log.innerHTML = '';
  appendLogLines(log);
}

/**
 * Full duel animation on a shot: the attacker's character recoils and
 * flashes a muzzle, a bullet travels across the arena, and the
 * defender's character reacts (hit-flash/shake, or a dodge-flinch on a
 * miss).
 */
export function playHitAnimation({ attackerKey, defenderKey, hit }) {
  const attackerChar = attackerKey === 'p1' ? els.p1Character : els.p2Character;
  const defenderChar = defenderKey === 'p1' ? els.p1Character : els.p2Character;
  const defenderPanel = defenderKey === 'p1' ? els.p1Panel : els.p2Panel;

  // Muzzle flash + recoil on the shooter
  attackerChar.classList.add('recoil', 'muzzle-flash');
  setTimeout(() => attackerChar.classList.remove('recoil', 'muzzle-flash'), 220);

  fireBullet(attackerKey, defenderKey, hit);

  if (hit) {
    defenderChar.classList.add('char-hit');
    defenderPanel.classList.add('hit-flash', 'hit-shake');
    setTimeout(() => {
      defenderChar.classList.remove('char-hit');
      defenderPanel.classList.remove('hit-flash', 'hit-shake');
    }, 320);
  } else {
    defenderChar.classList.add('char-dodge');
    defenderPanel.classList.add('miss-flash');
    setTimeout(() => {
      defenderChar.classList.remove('char-dodge');
      defenderPanel.classList.remove('miss-flash');
    }, 320);
  }
}

/** Spawns a small bullet element that travels across the arena from
 * the attacker's side to the defender's side, then removes itself. */
function fireBullet(attackerKey, defenderKey, hit) {
  if (!els.arena) return;
  const bullet = document.createElement('div');
  bullet.className = 'bullet';

  const startLeft = attackerKey === 'p1';
  bullet.style.left = startLeft ? '18%' : '82%';
  bullet.style.top = '48%';
  bullet.style.setProperty('--travel', startLeft ? '1' : '-1');

  els.arena.appendChild(bullet);

  // Trigger the travel animation on next frame so the transition applies.
  requestAnimationFrame(() => {
    bullet.classList.add('bullet-fly');
  });

  setTimeout(() => bullet.remove(), 260);
}

function phaseText(phase) {
  switch (phase) {
    case PHASES.SHOPPING: return 'Shopping phase — buy weapons below';
    case PHASES.BATTLE: return 'Battle in progress';
    case PHASES.ROUND_END: return 'Round over — continue to shop';
    case PHASES.MATCH_END: return 'Match over';
    default: return '';
  }
}