/**
 * TEMPORARY: isolated spell catalog for the character creation wizard.
 *
 * The backend does not expose a usable pre-character spell list:
 * - `GET /api/spells` returns the literal string `"This action returns all spells"`
 *   and no spell objects.
 * - `GET /api/characters/:id/spells/available` requires a created character id,
 *   so it cannot be used while the user is still drafting.
 * - As of the seeded DB inspection (2026-09-27), only Guerrero (id 1) and Mago
 *   (id 2) are seeded, and Mago has no initial moves, spells, or equipment
 *   configured.
 *
 * This module provides deterministic level-0 cantrips/prayers and level-1+
 * options so the wizard can still collect Mage/Cleric spell choices in the
 * draft, but the ids are FALLBACK PLACEHOLDERS. They are deliberately kept in
 * isolated numeric ranges and are not expected to exist in the backend
 * `spells` table. Finalize for a spellcasting class will fail on `POST
 * /characters/:id/spells` until these placeholders are replaced with real
 * seeded ids.
 *
 * This module is intentionally NOT imported by the general API client. It is
 * only consumed by wizard draft UI and commit logic.
 */

export type SpellStub = {
  id: number;
  name: string;
  spellLevel: number;
  description: string;
  classId: number | null;
  className: string;
};

/**
 * Deterministic fallback id ranges. Any id inside these ranges is a
 * placeholder produced by this temporary module; it is not expected to match a
 * row in the backend `spells` table and therefore cannot be persisted.
 */
const FALLBACK_ID_RANGES = [
  { min: 9000, max: 9099 }, // Mage fallback ids
  { min: 9100, max: 9199 }, // Cleric fallback ids
];

const MAGE_SPELLS: SpellStub[] = [
  // Level 0 cantrips
  {
    id: 9001,
    name: "Luz mágica",
    spellLevel: 0,
    description: "Un objeto cercano emite luz como una antorcha.",
    classId: 2,
    className: "Mago",
  },
  {
    id: 9002,
    name: "Prestidigitación",
    spellLevel: 0,
    description: "Realizas pequeños trucos mágicos inofensivos.",
    classId: 2,
    className: "Mago",
  },
  {
    id: 9003,
    name: "Chispa",
    spellLevel: 0,
    description: "Conjuras una llama o chispa que puede encender materiales.",
    classId: 2,
    className: "Mago",
  },
  // Level 1 spells
  {
    id: 9011,
    name: "Bola de fuego (nivel 1)",
    spellLevel: 1,
    description: "Lanzas una esfera ardiente que causa daño a un enemigo.",
    classId: 2,
    className: "Mago",
  },
  {
    id: 9012,
    name: "Escudo mágico",
    spellLevel: 1,
    description: "Un escudo invisible absorbe parte del daño recibido.",
    classId: 2,
    className: "Mago",
  },
  {
    id: 9013,
    name: "Dormir",
    spellLevel: 1,
    description: "Intentas hacer caer en sueño a criaturas cercanas.",
    classId: 2,
    className: "Mago",
  },
  {
    id: 9014,
    name: "Encantar persona",
    spellLevel: 1,
    description: "Haces que un humanoide te considere amistoso.",
    classId: 2,
    className: "Mago",
  },
];

const CLERIC_SPELLS: SpellStub[] = [
  // Level 0 prayers
  {
    id: 9101,
    name: "Luz",
    spellLevel: 0,
    description: "Invocas una luz divina que ilumina como una antorcha.",
    classId: null,
    className: "Clérigo",
  },
  {
    id: 9102,
    name: "Orientación divina",
    spellLevel: 0,
    description: "Tu deidad te guía con una pista breve.",
    classId: null,
    className: "Clérigo",
  },
  // Level 1 spells
  {
    id: 9111,
    name: "Curar heridas leves",
    spellLevel: 1,
    description: "Sanas 1d8 PG a una criatura que toques.",
    classId: null,
    className: "Clérigo",
  },
  {
    id: 9112,
    name: "Infligir heridas",
    spellLevel: 1,
    description: "Tu toque inflige daño necrótico a un enemigo.",
    classId: null,
    className: "Clérigo",
  },
  {
    id: 9113,
    name: "Bendición",
    spellLevel: 1,
    description: "Bendices a tus aliados para que tiren con ventaja.",
    classId: null,
    className: "Clérigo",
  },
];

/**
 * Class ids are not guaranteed to match the official ordering because the
 * backend seeds them in an unknown order. Use the class name as the stable
 * fallback key.
 */
const TEMPORARY_SPELLS_BY_CLASS_NAME: Record<string, SpellStub[]> = {
  Mago: MAGE_SPELLS,
  "Clérigo": CLERIC_SPELLS,
};

/**
 * Best-effort lookup by class id; falls back to class name.
 */
export function getTemporarySpellsForClass(
  classId: number,
  className: string
): SpellStub[] {
  const byName = TEMPORARY_SPELLS_BY_CLASS_NAME[className];
  if (byName !== undefined) {
    return byName;
  }

  for (const spells of Object.values(TEMPORARY_SPELLS_BY_CLASS_NAME)) {
    const matched = spells.filter((spell) => spell.classId === classId);
    if (matched.length > 0) {
      return matched;
    }
  }

  return [];
}

export function getTemporarySpellById(id: number): SpellStub | undefined {
  for (const spells of Object.values(TEMPORARY_SPELLS_BY_CLASS_NAME)) {
    const found = spells.find((spell) => spell.id === id);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

export function isTemporarySpellcastingClass(className: string): boolean {
  return className in TEMPORARY_SPELLS_BY_CLASS_NAME;
}

/**
 * Returns true for ids generated by this fallback module. These ids are not
 * real `spells` table rows and must be replaced before finalize is exercised
 * for a spellcasting class.
 */
export function isFallbackSpellId(id: number): boolean {
  return FALLBACK_ID_RANGES.some(
    (range) => id >= range.min && id <= range.max
  );
}

/**
 * Return only the spells whose total level fits the backend cap for a level-1
 * character: `sum(spellLevel) <= level + 1` (i.e. <= 2). The result excludes
 * level-0 cantrips unless they are needed to make the array non-empty, because
 * the backend already injects class cantrips on `GET :id/spells`.
 *
 * If the chosen spells exceed the cap, the function drops higher-level spells
 * until the cap is satisfied and returns the largest non-empty subset it can.
 * If no level-1+ spells fit, returns an empty array so the caller can skip
 * `POST /spells` entirely.
 */
export function filterPersistableSpellIds(
  spellIds: number[],
  lookup: (id: number) => { spellLevel: number } | undefined,
  characterLevel = 1
): number[] {
  const spells = spellIds
    .map((id) => ({ id, spell: lookup(id) }))
    .filter((item): item is { id: number; spell: { spellLevel: number } } =>
      item.spell !== undefined
    );

  const cap = characterLevel + 1;

  // Prefer level-1+ spells; drop level-0 because the backend injects them.
  const leveled = spells.filter((item) => item.spell.spellLevel > 0);
  const sorted = [...leveled].sort(
    (a, b) => a.spell.spellLevel - b.spell.spellLevel
  );

  const result: number[] = [];
  let total = 0;
  for (const item of sorted) {
    const nextTotal = total + item.spell.spellLevel;
    if (nextTotal <= cap) {
      result.push(item.id);
      total = nextTotal;
    }
  }

  return result;
}
