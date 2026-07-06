import { fireShot, applyDamage, isDefeated, MAX_HP } from "./combatSystem.js";
import {
  ECONOMY_CONFIG,
  calculateRoundReward,
  applyReward,
  canAfford,
} from "../systems/economy.js";
import { updateStreak, getStreakMultiplier } from "../systems/streaks.js";
import { getWeapon } from "../systems/weapons.js";
import {
  loadGame,
  saveGame,
  clearSave,
  getDefaultSave,
} from "../systems/saveSystem.js";

export const PHASES = {
  SHOPPING: "shopping",
  BATTLE: "battle",
  ROUND_END: "roundEnd",
  MATCH_END: "matchEnd",
};

class GameEngine {
  constructor() {
    this.listeners = {};
    this.state = null;
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }

  init(options = {}) {
    const saved = options.forceNew ? null : loadGame();
    const base = getDefaultSave();

    this.state = saved
      ? {
          ...base,
          ...saved,
          player1: { ...base.player1, ...saved.player1 },
          player2: { ...base.player2, ...saved.player2 },
        }
      : base;

    this.state.player1.money = this.state.player1.money ?? ECONOMY_CONFIG.startingMoney;
    this.state.player2.money = this.state.player2.money ?? ECONOMY_CONFIG.startingMoney;

    this.state.maxRounds = options.maxRounds || 5;
    this.state.round = this.state.round || 1;

    this.state.phase = PHASES.SHOPPING;
    this.state.turn = "p1";
    this.state.lastRoundLoser = null;
    this.state.knifeRound = false;

    this.state.matchWins = this.state.matchWins || { p1: 0, p2: 0 };
    this.state.log = this.state.log || [];

    this._pushLog("Match ready.");

    this.emit("stateChanged", this.state);

    // 🔥 IMPORTANT: auto start first round
    this.startRound();
  }

  resetMatch() {
    clearSave();
    this.init({ forceNew: true });
  }

  buyWeapon(playerKey, weaponId) {
    if (this.state.phase !== PHASES.SHOPPING) return;

    const player = this._player(playerKey);
    const weapon = getWeapon(weaponId);

    if (!weapon) return;

    if (!canAfford(player.money, weapon.price)) return;

    player.money -= weapon.price;
    player.weaponId = weaponId;

    this._pushLog(`${this._name(playerKey)} bought ${weapon.name}`);
    this.emit("stateChanged", this.state);
  }

  startRound() {
    if (this.state.phase !== PHASES.SHOPPING) return;

    this.state.player1.hp = MAX_HP;
    this.state.player2.hp = MAX_HP;

    this.state.phase = PHASES.BATTLE;

    this.state.turn = this.state.lastRoundLoser || "p1";

    this._pushLog(`Round ${this.state.round} started`);

    this.emit("roundStarted", this.state);
    this.emit("stateChanged", this.state);
  }

  fire(playerKey) {
    if (this.state.phase !== PHASES.BATTLE) return null;
    if (this.state.turn !== playerKey) return null;

    const opponentKey = playerKey === "p1" ? "p2" : "p1";

    const attacker = this._player(playerKey);
    const defender = this._player(opponentKey);

    const weapon = getWeapon(attacker.weaponId || "pistol");

    attacker.stats = attacker.stats || { shotsFired: 0, shotsHit: 0, wins: 0, losses: 0 };
    defender.stats = defender.stats || { shotsFired: 0, shotsHit: 0, wins: 0, losses: 0 };

    attacker.stats.shotsFired++;

    const result = fireShot(weapon);

    if (result.hit) {
      attacker.stats.shotsHit++;
      defender.hp = applyDamage(defender.hp, result.damage);
    }

    this._pushLog(
      `${this._name(playerKey)} ${result.hit ? "hit" : "missed"} ${this._name(opponentKey)}`
    );

    if (isDefeated(defender.hp)) {
      this._endRound(playerKey, opponentKey);
    } else {
      this.state.turn = opponentKey;
    }

    this.emit("stateChanged", this.state);

    return result;
  }

  _endRound(winnerKey, loserKey) {
    const winner = this._player(winnerKey);
    const loser = this._player(loserKey);

    winner.streak = updateStreak(winner.streak, true);
    loser.streak = updateStreak(loser.streak, false);

    const reward = calculateRoundReward(true, getStreakMultiplier(winner.streak));

    winner.money = applyReward(winner.money, reward);

    winner.stats.wins++;
    loser.stats.losses++;

    this.state.matchWins[winnerKey]++;
    this.state.lastRoundLoser = loserKey;

    this._pushLog(`${this._name(winnerKey)} wins round ${this.state.round}`);

    const target = Math.ceil(this.state.maxRounds / 2);

    if (
      this.state.matchWins.p1 >= target ||
      this.state.matchWins.p2 >= target
    ) {
      this.state.phase = PHASES.MATCH_END;
      this._pushLog(`${this._name(winnerKey)} wins MATCH!`);
      this.emit("matchEnded", { winner: winnerKey });
    } else {
      this.state.phase = PHASES.ROUND_END;
      this.emit("roundEnded", { winner: winnerKey });
    }

    this.save();
    this.emit("stateChanged", this.state);
  }

  nextRound() {
    if (this.state.phase !== PHASES.ROUND_END) return;

    this.state.round++;
    this.state.phase = PHASES.SHOPPING;

    this._pushLog("Shop phase");

    this.save();
    this.emit("stateChanged", this.state);

    // 🔥 IMPORTANT: start next round immediately
    this.startRound();
  }

  _player(key) {
    return this.state[key === "p1" ? "player1" : "player2"];
  }

  _name(key) {
    return key === "p1" ? "Player 1" : "Player 2";
  }

  _pushLog(text) {
    if (!this.state.log) this.state.log = [];
    this.state.log.push(text);
    if (this.state.log.length > 50) this.state.log.shift();
  }

  save() {
    saveGame(this.state);
  }

  getState() {
    return this.state;
  }
}

export const gameEngine = new GameEngine();