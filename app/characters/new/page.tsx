import { Suspense } from "react";
import { listClassesServer } from "@/lib/api/classes";
import { WizardProvider } from "@/lib/character-wizard/wizard-context";
import WizardShell from "./wizard";

export const dynamic = "force-dynamic";

export default function NewCharacterPage() {
  const classListPromise = listClassesServer();

  return (
    <WizardProvider>
      <Suspense fallback={<div className="p-8">Cargando clases...</div>}>
        <WizardShell classListPromise={classListPromise} />
      </Suspense>
    </WizardProvider>
  );
}
