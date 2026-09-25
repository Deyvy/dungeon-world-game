import { apiFetch, apiFetchRelative } from "./client";
import { ClassDetail, ClassSummary } from "./types";

export async function listClasses(): Promise<ClassSummary[]> {
  return apiFetchRelative<ClassSummary[]>("/api/classes");
}

export async function listClassesServer(): Promise<ClassSummary[]> {
  return apiFetch<ClassSummary[]>("/api/classes");
}

export async function getClass(id: number): Promise<ClassDetail> {
  return apiFetchRelative<ClassDetail>(`/api/classes/${id}`);
}
