import {
  Ability,
  ABILITIES,
  ClassDetail,
  ElementAnswer,
  STANDARD_ARRAY,
  WizardAlignment,
  WizardBond,
} from "@/lib/api/types";

type AbilityStats = Record<Ability, number | null>;

export type AppearanceDraft = {
  gaze: string;
  hair: string;
  clothing: string;
  body: string;
  extra: string[];
};

export type WizardDraft = {
  classId: number | null;
  classDetail: ClassDetail | null;
  raceContentId: number | null;
  raceMechanic: string;
  name: string;
  appearance: AppearanceDraft;
  stats: AbilityStats;
  alignment: WizardAlignment | null;
  moveAnswers: Record<number, Record<number, ElementAnswer>>;
  spellIds: number[];
  equipmentIds: number[];
  bonds: WizardBond[];
};

export const initialStats: AbilityStats = {
  strength: null,
  dexterity: null,
  constitution: null,
  intelligence: null,
  wisdom: null,
  charisma: null,
};

export const initialAppearance: AppearanceDraft = {
  gaze: "",
  hair: "",
  clothing: "",
  body: "",
  extra: [],
};

export const initialWizardDraft: WizardDraft = {
  classId: null,
  classDetail: null,
  raceContentId: null,
  raceMechanic: "",
  name: "",
  appearance: { ...initialAppearance },
  stats: { ...initialStats },
  alignment: null,
  moveAnswers: {},
  spellIds: [],
  equipmentIds: [],
  bonds: [],
};

export type WizardAction =
  | { type: "selectClass"; classId: number }
  | { type: "setClassDetail"; classDetail: ClassDetail }
  | { type: "selectRace"; raceContentId: number; raceMechanic: string }
  | { type: "setIdentity"; name: string; appearance: AppearanceDraft }
  | { type: "assignStats"; stats: AbilityStats }
  | { type: "setAlignment"; alignment: WizardAlignment | null }
  | {
      type: "setMoveAnswer";
      moveId: number;
      elementId: number;
      answer: ElementAnswer | null;
    }
  | { type: "setSpellIds"; spellIds: number[] }
  | { type: "toggleEquipment"; equipmentId: number }
  | { type: "setBondText"; templateId: string; text: string }
  | { type: "reset" }
  | { type: "classChange"; classId: number };

function clearDependentChoices(draft: WizardDraft): WizardDraft {
  return {
    ...draft,
    raceContentId: null,
    raceMechanic: "",
    alignment: null,
    moveAnswers: {},
    spellIds: [],
    equipmentIds: [],
    bonds: [],
  };
}

export function wizardReducer(
  draft: WizardDraft,
  action: WizardAction
): WizardDraft {
  switch (action.type) {
    case "selectClass":
      if (draft.classId === action.classId) {
        return draft;
      }
      return clearDependentChoices({
        ...draft,
        classId: action.classId,
        classDetail: null,
      });

    case "setClassDetail":
      return {
        ...draft,
        classDetail: action.classDetail,
      };

    case "selectRace":
      return {
        ...draft,
        raceContentId: action.raceContentId,
        raceMechanic: action.raceMechanic,
      };

    case "setIdentity":
      return {
        ...draft,
        name: action.name,
        appearance: action.appearance,
      };

    case "assignStats":
      return {
        ...draft,
        stats: action.stats,
      };

    case "setAlignment":
      return {
        ...draft,
        alignment: action.alignment,
      };

    case "setMoveAnswer": {
      const moveAnswers = { ...draft.moveAnswers };
      const moveMap = { ...(moveAnswers[action.moveId] ?? {}) };

      if (action.answer === null) {
        delete moveMap[action.elementId];
      } else {
        moveMap[action.elementId] = action.answer;
      }

      moveAnswers[action.moveId] = moveMap;
      return {
        ...draft,
        moveAnswers,
      };
    }

    case "setSpellIds":
      return {
        ...draft,
        spellIds: action.spellIds,
      };

    case "toggleEquipment": {
      const current = new Set(draft.equipmentIds);
      if (current.has(action.equipmentId)) {
        current.delete(action.equipmentId);
      } else {
        current.add(action.equipmentId);
      }
      return {
        ...draft,
        equipmentIds: Array.from(current),
      };
    }

    case "setBondText": {
      const bonds = draft.bonds.map((bond) =>
        bond.templateId === action.templateId
          ? { ...bond, text: action.text, complete: !action.text.includes("_____") }
          : bond
      );
      return {
        ...draft,
        bonds,
      };
    }

    case "reset":
      return { ...initialWizardDraft };

    case "classChange":
      return clearDependentChoices({
        ...draft,
        classId: action.classId,
        classDetail: null,
      });

    default:
      return draft;
  }
}

export function isStandardArrayComplete(stats: AbilityStats): boolean {
  const values = ABILITIES.map((ability) => stats[ability]).filter(
    (value): value is number => value !== null
  );

  if (values.length !== STANDARD_ARRAY.length) {
    return false;
  }

  const sortedDraft = [...values].sort((a, b) => a - b);
  const sortedStandard = [...STANDARD_ARRAY].sort((a, b) => a - b);

  return sortedDraft.every((value, index) => value === sortedStandard[index]);
}

export function getAssignedScores(stats: AbilityStats): number[] {
  return ABILITIES.map((ability) => stats[ability]).filter(
    (value): value is number => value !== null
  );
}

export function getUnassignedScores(stats: AbilityStats): number[] {
  const assigned = new Set(getAssignedScores(stats));
  return STANDARD_ARRAY.filter((score) => !assigned.has(score));
}
