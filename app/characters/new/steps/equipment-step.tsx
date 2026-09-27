"use client";

import { useEffect, useMemo, useState } from "react";
import { EquipmentItem } from "@/lib/api/types";
import { listEquipment } from "@/lib/api/equipment";
import {
  carriedLoadFromItems,
  isEncumbered,
  maxLoad,
  totalArmor,
} from "@/lib/character-wizard/derived-stats";
import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function EquipmentStep() {
  const { draft, dispatch } = useWizard();
  const [catalog, setCatalog] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const classDetail = draft.classDetail;
  const classEquipment = classDetail?.equipment ?? [];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const items = await listEquipment();
        if (!cancelled) {
          setCatalog(items);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el catálogo de equipo.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog]
  );

  const selectedItems = useMemo(
    () =>
      draft.equipmentIds
        .map((id) => catalogById.get(id))
        .filter((item): item is EquipmentItem => item !== undefined),
    [draft.equipmentIds, catalogById]
  );

  const armor = useMemo(
    () => totalArmor(selectedItems.flatMap((item) => item.tags)),
    [selectedItems]
  );

  const carried = useMemo(() => carriedLoadFromItems(selectedItems), [selectedItems]);

  const currentMaxLoad =
    classDetail !== null && draft.stats.strength !== null
      ? maxLoad(classDetail.baseLoad, draft.stats.strength)
      : null;

  const encumbered =
    currentMaxLoad !== null ? isEncumbered(carried, currentMaxLoad) : false;

  function toggleEquipment(equipmentId: number | undefined) {
    if (equipmentId === undefined || equipmentId === null) {
      return;
    }
    dispatch({ type: "toggleEquipment", equipmentId });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Paso 8: Equipamiento inicial</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Elige el equipo de inicio de tu {classDetail?.name ?? "personaje"}.
        </p>
      </div>

      {classDetail === null && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Vuelve al paso anterior y selecciona una clase primero.
        </p>
      )}

      {classDetail !== null && isLoading && (
        <p className="text-zinc-600 dark:text-zinc-400">Cargando equipo...</p>
      )}
      {classDetail !== null && error && (
        <p className="text-red-700 dark:text-red-300">{error}</p>
      )}

      {classDetail !== null && !isLoading && !error && classEquipment.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta clase no tiene equipo configurado.
        </p>
      )}

      {classDetail !== null && !isLoading && !error && classEquipment.length > 0 && (
        <fieldset className="space-y-3" aria-describedby="equipment-selection-help">
          <legend className="sr-only">Equipo disponible</legend>
          <p id="equipment-selection-help" className="sr-only">
            Marca o desmarca cada objeto de equipo.
          </p>
          {classEquipment.map((option) => {
            const item = option.equipmentId !== undefined ? catalogById.get(option.equipmentId) : undefined;
            const selected =
              option.equipmentId !== undefined &&
              draft.equipmentIds.includes(option.equipmentId);

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer flex-col gap-1 rounded border p-4 dark:border-zinc-700 ${
                  selected ? "border-foreground" : ""
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={option.equipmentId === undefined}
                    onChange={() => toggleEquipment(option.equipmentId)}
                  />
                  <span className="flex-1">
                    <span className="font-medium">{option.title}</span>
                    {option.content && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {option.content}
                      </p>
                    )}
                    {item && (
                      <p className="text-sm text-zinc-500">
                        Peso {item.weight}
                        {item.tags.length > 0
                          ? ` · ${item.tags.join(", ")}`
                          : ""}
                      </p>
                    )}
                    {option.equipmentId === undefined && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Este objeto no está vinculado al catálogo de equipo.
                      </p>
                    )}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {classDetail !== null && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Armadura total</p>
              <p className="text-2xl font-semibold">{armor}</p>
            </div>

            <div className="rounded border p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Carga transportada</p>
              <p className="text-2xl font-semibold">{carried}</p>
            </div>

            <div className="rounded border p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Carga máxima</p>
              <p className="text-2xl font-semibold">{currentMaxLoad ?? "—"}</p>
            </div>
          </div>

          <div className="rounded border p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Estado de carga</p>
            <p className="font-medium">
              {encumbered
                ? "Impedimenta: la carga transportada supera el máximo"
                : "Carga dentro del límite"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
