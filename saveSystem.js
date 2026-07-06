// Stub localStorage for node testing
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = String(val); },
    removeItem(key) { delete this._data[key]; },
  };
}

const SAVE_KEY = 'duelGame_save_v1';

const DEFAULT_SAVE = {
  player1: {
    money: null,
    weaponId: 'glock18',
    streak: 0,
    stats: { wins: 0, losses: 0, shotsFired: 0, shotsHit: 0 },
  },
  player2: {
    money: null,
    weaponId: 'usps',
    streak: 0,
    stats: { wins: 0, losses: 0, shotsFired: 0, shotsHit: 0 },
  },
  round: 1,
  matchWins: { p1: 0, p2: 0 },
};

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn('Save data corrupted, ignoring.', err);
    return null;
  }
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Could not save game.', err);
    return false;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function getDefaultSave() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}