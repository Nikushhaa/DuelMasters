import { gameEngine, PHASES } from './src/core/gameEngine.js';

gameEngine.on('stateChanged', () => {});

console.log('--- FRESH INIT ---');
gameEngine.init({ maxRounds: 5 });
let s = gameEngine.getState();
console.log('money p1/p2:', s.player1.money, s.player2.money, 'phase:', s.phase);

console.log('--- BUY WEAPON WHILE SHOPPING ---');
console.log(gameEngine.buyWeapon('p1', 'deagle')); // deagle doesn't exist in trimmed weapons.js but glock/usps/knife/zeus do
console.log(gameEngine.buyWeapon('p1', 'zeus'));
s = gameEngine.getState();
console.log('p1 money after buying zeus:', s.player1.money, 'weapon:', s.player1.weaponId);

console.log('--- START ROUND ---');
gameEngine.startRound();
s = gameEngine.getState();
console.log('phase:', s.phase, 'turn:', s.turn);

console.log('--- FIRE UNTIL ROUND ENDS ---');
let guard = 0;
while (gameEngine.getState().phase === PHASES.BATTLE && guard < 100) {
  const turn = gameEngine.getState().turn;
  gameEngine.fire(turn);
  guard++;
}
s = gameEngine.getState();
console.log('after round, phase:', s.phase, 'matchWins:', s.matchWins, 'p1hp:', s.player1.hp, 'p2hp:', s.player2.hp, 'guard iterations:', guard);

console.log('--- SIMULATE FULL MATCH ---');
gameEngine.init({ forceNew: true, maxRounds: 5 });
let rounds = 0;
while (gameEngine.getState().phase !== PHASES.MATCH_END && rounds < 20) {
  if (gameEngine.getState().phase === PHASES.SHOPPING) {
    gameEngine.startRound();
  }
  let g2 = 0;
  while (gameEngine.getState().phase === PHASES.BATTLE && g2 < 50) {
    gameEngine.fire(gameEngine.getState().turn);
    g2++;
  }
  if (gameEngine.getState().phase === PHASES.ROUND_END) {
    gameEngine.nextRound();
  }
  rounds++;
}
s = gameEngine.getState();
console.log('Match finished after', rounds, 'loop-rounds. phase:', s.phase, 'matchWins:', s.matchWins, 'round counter:', s.round);

console.log('--- RELOAD PAGE SIMULATION (no reset, match already ended) ---');
gameEngine.init({ maxRounds: 5 }); // simulates page refresh: loads from "localStorage" (saved at match end)
s = gameEngine.getState();
console.log('after reload phase:', s.phase, 'matchWins:', s.matchWins, '(note: matchWins already satisfied target, but phase forced back to SHOPPING)');
console.log('target needed:', Math.ceil(s.maxRounds / 2));
