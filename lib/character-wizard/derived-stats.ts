import type { Ability, EquipmentItem } from "@/lib/api/types";

export type ModifierResult =
  | { kind: "valid"; value: number }
  | { kind: "invalid"; score: number };

/**
 * Calculate the official Dungeon World ability modifier for a score.
 * Supported range is 1–18. Out-of-range scores return an invalid result
 * instead of a misleading modifier.
 */
export function modifier(score: number): ModifierResult {
  if (score >= 1 && score <= 3) return { kind: "valid", value: -3 };
  if (score >= 4 && score <= 5) return { kind: "valid", value: -2 };
  if (score >= 6 && score <= 8) return { kind: "valid", value: -1 };
  if (score >= 9 && score <= 12) return { kind: "valid", value: 0 };
  if (score >= 13 && score <= 15) return { kind: "valid", value: 1 };
  if (score >= 16 && score <= 17) return { kind: "valid", value: 2 };
  if (score === 18) return { kind: "valid", value: 3 };
  return { kind: "invalid", score };
}

/**
 * Maximum hit points use the class base plus the raw Constitution score.
 */
export function maxHitPoints(baseHitPoints: number, constitution: number): number {
  return baseHitPoints + constitution;
}

/**
 * Maximum load uses the class base plus the raw Strength score.
 */
export function maxLoad(baseLoad: number, strength: number): number {
  return baseLoad + strength;
}

const ARMOR_TAG_PATTERN = /^(?:armadura|armor)\s+(\d+)$/i;

/**
 * Parse a single equipment tag for an armor value.
 * Supports "armadura N" and "armor N" case-insensitively.
 *
 * Apply-time note (Phase 5): the backend stores equipment metadata as a JSON
 * string in `equipment.metadata`; the canonical tags are inside
 * `metadata.tags`. The seed data was not directly inspectable from the
 * workspace, so the parser keeps both Spanish and English spellings. Any tag
 * that does not match either pattern contributes 0 armor.
 */
export function parseArmorTag(tag: string): number {
  const match = tag.trim().match(ARMOR_TAG_PATTERN);
  if (match === null) return 0;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Sum armor values from all supported tags on equipped items.
 */
export function totalArmor(tags: string[]): number {
  return tags.reduce((sum, tag) => sum + parseArmorTag(tag), 0);
}

type LoadEntry = {
  weight: number;
  quantity: number;
};

/**
 * Calculate carried load from equipment weights and quantities.
 */
export function carriedLoad(entries: LoadEntry[]): number {
  return entries.reduce((sum, entry) => {
    const weight = Number.isFinite(entry.weight) ? entry.weight : 0;
    const quantity = Number.isFinite(entry.quantity) && entry.quantity > 0 ? entry.quantity : 0;
    return sum + weight * quantity;
  }, 0);
}

/**
 * Determine whether the current carried load exceeds maximum load.
 * Equal load is not impeded.
 */
export function isEncumbered(carriedLoad: number, maxLoad: number): boolean {
  return carriedLoad > maxLoad;
}

/**
 * Convenience overload for equipment items: compute carried load from a list
 * of selected equipment items. Assumes quantity 1 per selected item.
 */
export function carriedLoadFromItems(items: EquipmentItem[]): number {
  return carriedLoad(items.map((item) => ({ weight: item.weight, quantity: 1 })));
}

/**
 * Format a modifier for display, e.g. +2 or -1.
 */
export function formatModifier(modifierValue: number): string {
  return modifierValue >= 0 ? `+${modifierValue}` : String(modifierValue);
}

/**
 * Spanish ability label used in derived stat displays.
 */
export function abilityLabel(ability: Ability): string {
  const labels: Record<Ability, string> = {
    strength: "FUE",
    dexterity: "DES",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "SAB",
    charisma: "CAR",
  };
  return labels[ability];
}
