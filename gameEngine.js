import { fireShot, applyDamage, isDefeated, MAX_HP } from './combatSystem.js';
import { ECONOMY_CONFIG, calculateRoundReward, applyReward, canAfford } from '../systems/economy.js';
import { updateStreak, getStreakMultiplier } from '../systems/streaks.js';
import { getWeapon, DEFAULT_PISTOLS } from '../systems/weapons.js';
import { loadGame, saveGame, clearSave, getDefaultSave } from '../systems/saveSystem.js';

export const PHASES = {
  SHOPPING: 'shopping',
  BATTLE: 'battle',
  ROUND_END: 'roundEnd',
  MATCH_END: 'matchEnd',
};

class GameEngine {
  constructor() {
    this.listeners = {};
    this.state = null;
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(callback);
  }

  emit(eventName, payload) {
    (this.listeners[eventName] || []).forEach((cb) => cb(payload));
  }

  init(options = {}) {
    const saved = options.forceNew ? null : loadGame();
    const base = getDefaultSave();

    if (saved) {
      this.state = {
        ...base,
        ...saved,
        player1: { ...base.player1, ...saved.player1 },
        player2: { ...base.player2, ...saved.player2 },
      };
    } else {
      base.player1.money = ECONOMY_CONFIG.startingMoney;
      base.player2.money = ECONOMY_CONFIG.startingMoney;
      this.state = base;
    }

    this.state.maxRounds = options.maxRounds || this.state.maxRounds || 5;
    this.state.mode = options.mode || 'bo' + this.state.maxRounds;
    this.state.phase = PHASES.SHOPPING;
    this.state.log = [];
    this.state.player1.hp = MAX_HP;
    this.state.player2.hp = MAX_HP;
    this.state.turn = 'p1';
    this.state.lastRoundLoser = null;
    this.state.knifeRound = false;

    this._pushLog('Match ready. Buy weapons and start the round.');
    this.emit('stateChanged', this.state);
  }

  resetMatch() {
    clearSave();
    this.init({ forceNew: true, maxRounds: this.state.maxRounds });
  }

  buyWeapon(playerKey, weaponId) {
    const player = this._player(playerKey);
    const weapon = getWeapon(weaponId);
    if (!weapon) return { ok: false, reason: 'Unknown weapon' };
    if (this.state.phase !== PHASES.SHOPPING) return { ok: false, reason: 'Shop closed' };
    if (!canAfford(player.money, weapon.price)) return { ok: false, reason: 'Not enough money' };

    player.money -= weapon.price;
    player.weaponId = weaponId;
    this._pushLog(`${this._name(playerKey)} equipped ${weapon.name}.`);
    this.emit('stateChanged', this.state);
    return { ok: true };
  }

  toggleKnifeRound(value) {
    this.state.knifeRound = value;
    this.emit('stateChanged', this.state);
  }

  startRound() {
    if (this.state.phase !== PHASES.SHOPPING) return;
    this.state.player1.hp = MAX_HP;
    this.state.player2.hp = MAX_HP;
    this.state.phase = PHASES.BATTLE;

    this.state.turn = this.state.lastRoundLoser || 'p1';

    this._pushLog(
      `--- Round ${this.state.round} start${this.state.knifeRound ? ' (KNIFE ROUND)' : ''} ---`
    );
    this.emit('stateChanged', this.state);
    this.emit('roundStarted', this.state);
  }

  fire(playerKey) {
    if (this.state.phase !== PHASES.BATTLE) return null;
    if (this.state.turn !== playerKey) return null;

    const opponentKey = playerKey === 'p1' ? 'p2' : 'p1';
    const attacker = this._player(playerKey);
    const defender = this._player(opponentKey);

    const weaponId = this.state.knifeRound ? 'knife' : attacker.weaponId;
    const weapon = getWeapon(weaponId);

    attacker.stats.shotsFired += 1;
    const result = fireShot(weapon);

    let logLine;
    if (!result.hit) {
      logLine = `${this._name(playerKey)} fires ${weapon.name} and MISSES.`;
    } else {
      attacker.stats.shotsHit += 1;
      defender.hp = applyDamage(defender.hp, result.damage);
      const critText = result.isCrit ? ' CRITICAL HIT!' : '';
      const instaText = result.isInstaKill ? ' INSTANT KILL!' : '';
      logLine = `${this._name(playerKey)} hits ${this._name(opponentKey)} with ${weapon.name} for ${result.damage} dmg.${critText}${instaText}`;
    }
    this._pushLog(logLine);

    const event = {
      attackerKey: playerKey,
      defenderKey: opponentKey,
      ...result,
    };
    this.emit('shotFired', event);

    if (isDefeated(defender.hp)) {
      this._endRound(playerKey, opponentKey);
    } else {
      this.state.turn = opponentKey;
    }

    this.emit('stateChanged', this.state);
    return event;
  }

  _endRound(winnerKey, loserKey) {
    const winner = this._player(winnerKey);
    const loser = this._player(loserKey);

    winner.streak = updateStreak(winner.streak, true);
    loser.streak = updateStreak(loser.streak, false);

    const winnerMultiplier = getStreakMultiplier(winner.streak);
    const winnerReward = calculateRoundReward(true, winnerMultiplier);
    const loserReward = calculateRoundReward(false, 1);

    winner.money = applyReward(winner.money, winnerReward);
    loser.money = applyReward(loser.money, loserReward);

    winner.stats.wins += 1;
    loser.stats.losses += 1;

    this.state.matchWins[winnerKey === 'p1' ? 'p1' : 'p2'] += 1;
    this.state.lastRoundLoser = loserKey;

    this._pushLog(
      `${this._name(winnerKey)} wins round ${this.state.round}! +$${winnerReward}. ${this._name(loserKey)} gets +$${loserReward}.`
    );

    const target = Math.ceil(this.state.maxRounds / 2);
    if (this.state.matchWins.p1 >= target || this.state.matchWins.p2 >= target) {
      this.state.phase = PHASES.MATCH_END;
      const matchWinner = this.state.matchWins.p1 >= target ? 'p1' : 'p2';
      this._pushLog(`*** ${this._name(matchWinner)} WINS THE MATCH! ***`);
      this.emit('matchEnded', { winner: matchWinner });
    } else {
      this.state.phase = PHASES.ROUND_END;
      this.emit('roundEnded', { winner: winnerKey, loser: loserKey });
    }

    this.save();
  }

  nextRound() {
    if (this.state.phase !== PHASES.ROUND_END) return;
    this.state.round += 1;
    this.state.phase = PHASES.SHOPPING;
    this._pushLog('Shop is open. Prepare for the next round.');
    this.emit('stateChanged', this.state);
  }

  _name(key) {
    return key === 'p1' ? 'Player 1' : 'Player 2';
  }

  _player(key) {
    return this.state[key === 'p1' ? 'player1' : 'player2'];
  }

  _pushLog(line) {
    this.state.log.push(line);
    if (this.state.log.length > 100) this.state.log.shift();
  }

  save() {
    saveGame(this.state);
  }

  getState() {
    return this.state;
  }
}

export const gameEngine = new GameEngine();