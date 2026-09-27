"use client";

import { Suspense, use, useMemo, useState } from "react";
import {
  getStepIndex,
  getStepLabel,
  STEP_ORDER,
  validateStep,
  WizardStep,
} from "@/lib/character-wizard/validation";
import { useWizard } from "@/lib/character-wizard/wizard-context";
import { ClassSummary } from "@/lib/api/types";

import ClassStep from "./steps/class-step";
import RaceStep from "./steps/race-step";
import IdentityStep from "./steps/identity-step";
import StatsStep from "./steps/stats-step";
import DerivedStep from "./steps/derived-step";
import AlignmentStep from "./steps/alignment-step";
import ConfigStep from "./steps/config-step";
import EquipmentStep from "./steps/equipment-step";
import BondsStep from "./steps/bonds-step";

const STEP_COMPONENTS: Record<Exclude<WizardStep, "class">, React.ComponentType> = {
  race: RaceStep,
  identity: IdentityStep,
  stats: StatsStep,
  derived: DerivedStep,
  alignment: AlignmentStep,
  config: ConfigStep,
  equipment: EquipmentStep,
  bonds: BondsStep,
};

export type WizardShellProps = {
  classListPromise: Promise<ClassSummary[]>;
};

export default function WizardShell({ classListPromise }: WizardShellProps) {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <WizardContent classListPromise={classListPromise} />
    </Suspense>
  );
}

function WizardSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-lg text-zinc-600 dark:text-zinc-400">Cargando clases...</p>
    </div>
  );
}

function WizardContent({ classListPromise }: WizardShellProps) {
  const classes = use(classListPromise);
  const [currentStep, setCurrentStep] = useState<WizardStep>("class");
  const { draft } = useWizard();

  // The class list will be consumed by the class step in Phase 2.
  void classes;

  const currentIndex = getStepIndex(currentStep);

  const validation = useMemo(
    () => validateStep(currentStep, draft),
    [currentStep, draft]
  );

  function handleNext() {
    if (!validation.valid) {
      return;
    }
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }

  function handleFinalize() {
    if (!validation.valid) {
      return;
    }
    // Finalize orchestration is implemented in Phase 5.
    void classes;
  }

  function renderCurrentStep() {
    if (currentStep === "class") {
      return <ClassStep classes={classes} />;
    }

    const StepComponent = STEP_COMPONENTS[currentStep];
    return <StepComponent />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <StepNavigation currentStep={currentStep} />

      <div className="rounded border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {renderCurrentStep()}
      </div>

      {!validation.valid && validation.errors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <ul className="list-disc space-y-1 pl-5">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="rounded border px-4 py-2 disabled:opacity-50 dark:border-zinc-700"
        >
          Atrás
        </button>
        {currentIndex === STEP_ORDER.length - 1 ? (
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!validation.valid}
            className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
          >
            Finalizar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!validation.valid}
            className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

function StepNavigation({ currentStep }: { currentStep: WizardStep }) {
  return (
    <nav aria-label="Pasos del asistente">
      <ol className="flex flex-wrap gap-2">
        {STEP_ORDER.map((step, index) => {
          const isActive = step === currentStep;
          const isPast = getStepIndex(currentStep) > index;
          return (
            <li
              key={step}
              className={`rounded px-3 py-1 text-sm ${
                isActive
                  ? "bg-foreground text-background"
                  : isPast
                    ? "border dark:border-zinc-700"
                    : "text-zinc-500"
              }`}
            >
              {index + 1}. {getStepLabel(step)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
