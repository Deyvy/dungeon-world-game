export type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type StandardArray = [16, 15, 13, 12, 9, 8];

export type WizardErrorCategory =
  | "validation"
  | "not_found"
  | "network"
  | "operation";

export type WizardError = {
  category: WizardErrorCategory;
  message: string;
  status?: number;
  operation?: string;
  field?: string;
  details?: unknown;
};

export type ClassSummary = {
  id: number;
  name: string;
};

export type ClassContent = {
  id: number;
  title: string;
  description?: string;
  content?: string;
  metadata?: unknown;
};

export type ContentElementType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "BOOLEAN"
  | "CHECKBOX_GROUP"
  | "RADIO_GROUP"
  | "SELECT";

export type ContentElementOption = {
  id: number;
  label: string;
  description?: string;
  sortOrder?: number;
};

export type ContentElement = {
  id: number;
  type: ContentElementType;
  label: string;
  description?: string;
  sortOrder: number;
  minSelect?: number;
  maxSelect?: number;
  options?: ContentElementOption[];
};

export type MoveContent = ClassContent & {
  contentElements?: ContentElement[];
};

export type ClassDetail = {
  id: number;
  name: string;
  description?: string;
  appearance?: string;
  hitPoints: number;
  baseLoad: number;
  damageDice: number;
  alignments: ClassContent[];
  races: ClassContent[];
  equipment: ClassContent[];
  initialMoves: MoveContent[];
  advancedMoves: ClassContent[];
};

export type EquipmentItem = {
  id: number;
  name: string;
  description?: string;
  weight: number;
  tags: string[];
  category?: string;
  usesPerUnit?: number;
};

export type CreateCharacterRequest = {
  name: string;
  classId: number;
  appearance?: string[];
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type MoveElementPayload = {
  elementId: number;
  value?: string;
  optionIds?: number[];
};

export type ElementAnswer =
  | { kind: "text"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "choice"; optionIds: number[] };

export type WizardAlignment =
  | { kind: "standard"; contentId: number }
  | { kind: "custom"; name: string; description: string };

export type WizardBond = {
  templateId: string;
  text: string;
  complete: boolean;
};

export const ABILITIES: Ability[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const STANDARD_ARRAY: StandardArray = [16, 15, 13, 12, 9, 8];

export const ABILITY_LABELS: Record<Ability, string> = {
  strength: "Fuerza (FUE)",
  dexterity: "Destreza (DES)",
  constitution: "Constitución (CON)",
  intelligence: "Inteligencia (INT)",
  wisdom: "Sabiduría (SAB)",
  charisma: "Carisma (CAR)",
};

export function isWizardError(value: unknown): value is WizardError {
  return (
    typeof value === "object" &&
    value !== null &&
    "category" in value &&
    typeof (value as WizardError).category === "string" &&
    "message" in value &&
    typeof (value as WizardError).message === "string"
  );
}
