import { apiFetchRelative } from "./client";
import {
  CreateCharacterRequest,
  MoveElementPayload,
  WizardError,
} from "./types";

function guardCharacterId(
  characterId: number | undefined | null,
  operation: string
): asserts characterId is number {
  if (characterId === undefined || characterId === null) {
    const error: WizardError = {
      category: "operation",
      message: "No hay un personaje activo para realizar esta acción.",
      operation,
    };
    throw error;
  }
}

export async function createCharacter(
  request: CreateCharacterRequest
): Promise<{ id: number }> {
  return apiFetchRelative<{ id: number }>("/api/characters", {
    method: "POST",
    body: request,
  });
}

export async function deleteCharacter(
  characterId: number | undefined | null
): Promise<void> {
  guardCharacterId(characterId, "deleteCharacter");
  return apiFetchRelative<void>(`/api/characters/${characterId}`, {
    method: "DELETE",
  });
}

export async function selectRace(
  characterId: number | undefined | null,
  contentId: number
): Promise<void> {
  guardCharacterId(characterId, "selectRace");
  return apiFetchRelative<void>(`/api/characters/${characterId}/races`, {
    method: "POST",
    body: { contentId },
  });
}

export async function createCustomAlignment(
  characterId: number | undefined | null,
  payload: { name: string; description: string }
): Promise<{ id: number }> {
  guardCharacterId(characterId, "createCustomAlignment");
  return apiFetchRelative<{ id: number }>(
    `/api/characters/${characterId}/alignments/custom`,
    {
      method: "POST",
      body: payload,
    }
  );
}

export async function selectAlignment(
  characterId: number | undefined | null,
  contentId: number
): Promise<void> {
  guardCharacterId(characterId, "selectAlignment");
  return apiFetchRelative<void>(`/api/characters/${characterId}/alignments`, {
    method: "POST",
    body: { contentId },
  });
}

export async function replaceEquipment(
  characterId: number | undefined | null,
  equipmentIds: number[]
): Promise<void> {
  guardCharacterId(characterId, "replaceEquipment");
  return apiFetchRelative<void>(`/api/characters/${characterId}/equipment`, {
    method: "POST",
    body: { equipmentIds },
  });
}

export async function replaceSpells(
  characterId: number | undefined | null,
  spellIds: number[]
): Promise<void> {
  guardCharacterId(characterId, "replaceSpells");
  return apiFetchRelative<void>(`/api/characters/${characterId}/spells`, {
    method: "POST",
    body: { spellIds },
  });
}

export async function updateMove(
  characterId: number | undefined | null,
  contentId: number,
  elements: MoveElementPayload[]
): Promise<void> {
  guardCharacterId(characterId, "updateMove");
  return apiFetchRelative<void>(
    `/api/characters/${characterId}/moves/${contentId}`,
    {
      method: "PUT",
      body: { elements },
    }
  );
}

export async function createBond(
  characterId: number | undefined | null,
  text: string
): Promise<void> {
  guardCharacterId(characterId, "createBond");
  return apiFetchRelative<void>(`/api/characters/${characterId}/bonds`, {
    method: "POST",
    body: { text },
  });
}
