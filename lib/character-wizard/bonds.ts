export type BondTemplate = {
  id: string;
  text: string;
};

/**
 * Frontend-owned bond templates for the official Dungeon World classes.
 *
 * These are translated into neutral Spanish and contain `_____` placeholders
 * that the player replaces with another PC's name. The backend only stores the
 * completed free-text strings.
 *
 * The wording is a best-effort rendering of the official playbook bonds; it
 * should be reviewed against the licensed Spanish edition when available.
 */
const BOND_TEMPLATES_BY_CLASS: Record<string, BondTemplate[]> = {
  Bardo: [
    {
      id: "bard-1",
      text: "_____ es mi público favorito; siempre sabe apreciar una buena actuación.",
    },
    {
      id: "bard-2",
      text: "He compuesto una canción sobre las hazañas de _____.",
    },
    {
      id: "bard-3",
      text: "_____ confunde demasiado a menudo el valor con la suerte; tendré que enseñarle.",
    },
  ],
  "Clérigo": [
    {
      id: "cleric-1",
      text: "_____ es una alma digna de ser guiada por mi deidad.",
    },
    {
      id: "cleric-2",
      text: "He prometido a mi orden proteger a _____.",
    },
    {
      id: "cleric-3",
      text: "_____ duda de la fe; rezaré por su conversión.",
    },
  ],
  Druida: [
    {
      id: "druid-1",
      text: "_____ huele a ciudad; debo enseñarle a respetar la naturaleza.",
    },
    {
      id: "druid-2",
      text: "Los espíritus me han dicho que vigile a _____.",
    },
    {
      id: "druid-3",
      text: "_____ no entiende el equilibrio; debo guiarle antes de que lo rompa.",
    },
  ],
  Explorador: [
    {
      id: "ranger-1",
      text: "_____ es casi tan sigiloso como yo; confío en que cubra mi espalda.",
    },
    {
      id: "ranger-2",
      text: "He guiado a _____ por terrenos peligrosos y espero que recuerde la lección.",
    },
    {
      id: "ranger-3",
      text: "_____ no debería hacer tanto ruido en la naturaleza.",
    },
  ],
  Guerrero: [
    {
      id: "fighter-1",
      text: "_____ me debe una bebida por salvarle la vida.",
    },
    {
      id: "fighter-2",
      text: "He luchado junto a _____ y respeto su coraje.",
    },
    {
      id: "fighter-3",
      text: "_____ necesita aprender a blandir un arma correctamente; se lo enseñaré.",
    },
  ],
  Ladrón: [
    {
      id: "thief-1",
      text: "_____ siempre lleva encima algo valioso; lo vigilaré por si acaso.",
    },
    {
      id: "thief-2",
      text: "Le debo una a _____, aunque prefiera que no lo recuerde.",
    },
    {
      id: "thief-3",
      text: "_____ es demasiado honesto para este mundo; le vigilaré las espaldas.",
    },
  ],
  Mago: [
    {
      id: "mage-1",
      text: "_____ tiene talento para la magia; quizás le enseñe un truco.",
    },
    {
      id: "mage-2",
      text: "He leído en los libros antiguos que _____ jugará un papel importante.",
    },
    {
      id: "mage-3",
      text: "_____ confunde la magia con superstición; debo educarle.",
    },
  ],
  Paladín: [
    {
      id: "paladin-1",
      text: "_____ es honorable, aunque a veces necesite recordarle el camino.",
    },
    {
      id: "paladin-2",
      text: "He jurado proteger a _____ con mi vida.",
    },
    {
      id: "paladin-3",
      text: "_____ oculta algo; vigilaré sus actos por el bien del grupo.",
    },
  ],
};

/**
 * Return the bond templates for a class. Falls back to an empty list when the
 * class name is unknown so custom classes don't crash the wizard.
 */
export function getBondTemplates(className: string): BondTemplate[] {
  return BOND_TEMPLATES_BY_CLASS[className] ?? [];
}

/**
 * Create initial draft bonds from the templates for a class.
 */
export function createDraftBonds(className: string): {
  templateId: string;
  text: string;
  complete: boolean;
}[] {
  return getBondTemplates(className).map((template) => ({
    templateId: template.id,
    text: template.text,
    complete: false,
  }));
}
