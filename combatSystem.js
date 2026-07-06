export const MAX_HP = 100;

export function fireShot(weapon) {
  const hit = Math.random() < weapon.accuracy;

  if (!hit) {
    return { hit: false, damage: 0, isCrit: false, isInstaKill: false };
  }

  if (weapon.instaKill) {
    return { hit: true, damage: MAX_HP, isCrit: false, isInstaKill: true };
  }

  const isCrit = Math.random() < weapon.critChance;
  const baseDamage = randomInt(weapon.dmgMin, weapon.dmgMax);
  const damage = Math.round(isCrit ? baseDamage * weapon.critMult : baseDamage);

  return { hit: true, damage, isCrit, isInstaKill: false };
}

export function applyDamage(currentHp, damage) {
  return Math.max(0, currentHp - damage);
}

export function isDefeated(hp) {
  return hp <= 0;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}