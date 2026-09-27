import { apiFetchRelative } from "./client";
import { EquipmentItem } from "./types";

type RawEquipmentItem = {
  id: number;
  name: string;
  description: string | null;
  metadata: {
    weight: number | null;
    tags: string[];
    category: string | null;
    usesPerUnit: number | null;
  };
};

function toEquipmentItem(raw: RawEquipmentItem): EquipmentItem {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    weight: raw.metadata.weight ?? 0,
    tags: raw.metadata.tags,
    category: raw.metadata.category ?? undefined,
    usesPerUnit: raw.metadata.usesPerUnit ?? undefined,
  };
}

export async function listEquipment(): Promise<EquipmentItem[]> {
  const rows = await apiFetchRelative<RawEquipmentItem[]>("/api/equipment");
  return rows.map(toEquipmentItem);
}
