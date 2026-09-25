import { apiFetchRelative } from "./client";
import { EquipmentItem } from "./types";

export async function listEquipment(): Promise<EquipmentItem[]> {
  return apiFetchRelative<EquipmentItem[]>("/api/equipment");
}
