"use client";

import { ABILITIES } from "@/lib/api/types";
import {
  abilityLabel,
  formatModifier,
  isEncumbered,
  maxHitPoints,
  maxLoad,
  modifier,
} from "@/lib/character-wizard/derived-stats";
import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function DerivedStep() {
  const { draft } = useWizard();

  const hasClassAndStats =
    draft.classDetail !== null &&
    draft.stats.constitution !== null &&
    draft.stats.strength !== null;

  const constitution = draft.stats.constitution ?? 0;
  const strength = draft.stats.strength ?? 0;

  const derived =
    draft.classDetail !== null
      ? {
          maxHp: maxHitPoints(draft.classDetail.hitPoints, constitution),
          maxLoad: maxLoad(draft.classDetail.baseLoad, strength),
          carried: 0,
        }
      : null;

  const encumbered =
    derived !== null ? isEncumbered(derived.carried, derived.maxLoad) : false;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Paso 5: Salud y carga</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Revisa los valores derivados de tu personaje. Estos números cambian
          automáticamente cuando modificas las características.
        </p>
      </div>

      {!hasClassAndStats && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Completa el paso anterior con una clase y todas las características
          para ver los derivados.
        </p>
      )}

      {derived !== null && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Puntos de golpe máximos
              </p>
              <p className="text-2xl font-semibold">{derived.maxHp}</p>
              <p className="text-xs text-zinc-500">
                {draft.classDetail?.hitPoints} base + {constitution} CON
              </p>
            </div>

            <div className="rounded border p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Carga máxima
              </p>
              <p className="text-2xl font-semibold">{derived.maxLoad}</p>
              <p className="text-xs text-zinc-500">
                {draft.classDetail?.baseLoad} base + {strength} FUE
              </p>
            </div>
          </div>

          <div className="rounded border p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Estado de carga
            </p>
            <p className="font-medium">
              {encumbered
                ? "Impedimenta: la carga transportada supera el máximo"
                : "Carga dentro del límite"}
            </p>
            <p className="text-xs text-zinc-500">
              Transportada: {derived.carried} / {derived.maxLoad}
            </p>
          </div>
        </>
      )}

      <div className="space-y-3">
        <h3 className="font-medium">Modificadores de características</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ABILITIES.map((ability) => {
            const score = draft.stats[ability];
            const result = score !== null ? modifier(score) : null;
            return (
              <div
                key={ability}
                className="flex items-center justify-between rounded border p-3 dark:border-zinc-700"
              >
                <span>{abilityLabel(ability)}</span>
                <span className="font-mono">
                  {result?.kind === "valid"
                    ? `${score} (${formatModifier(result.value)})`
                    : score !== null
                      ? "—"
                      : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
