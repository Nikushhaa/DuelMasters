export const WEAPONS = {
  glock18:      { id: 'glock18',      name: 'Glock-18',       category: 'pistol', price: 200,  dmgMin: 18, dmgMax: 26, accuracy: 0.78, critChance: 0.10, critMult: 1.5 },
  usps:         { id: 'usps',         name: 'USP-S',          category: 'pistol', price: 200,  dmgMin: 20, dmgMax: 30, accuracy: 0.82, critChance: 0.12, critMult: 1.5 },
  knife: { id: 'knife', name: 'Knife',    category: 'equipment', price: 0,   dmgMin: 15, dmgMax: 40, accuracy: 0.60, critChance: 0.25, critMult: 2.5 },
  zeus:  { id: 'zeus',  name: 'Zeus x27', category: 'equipment', price: 200, dmgMin: 100, dmgMax: 100, accuracy: 0.50, critChance: 0, critMult: 1, instaKill: true },
};

export const CATEGORY_ORDER = ['pistol', 'smg', 'rifle', 'sniper', 'heavy', 'equipment'];

export const CATEGORY_LABELS = {
  pistol: 'Pistols',
  smg: 'SMGs',
  rifle: 'Rifles',
  sniper: 'Snipers',
  heavy: 'Heavy',
  equipment: 'Equipment',
};

export const DEFAULT_PISTOLS = ['glock18', 'usps'];

export function getWeaponsByCategory(category) {
  return Object.values(WEAPONS).filter((w) => w.category === category);
}

export function getWeapon(id) {
  return WEAPONS[id];
}