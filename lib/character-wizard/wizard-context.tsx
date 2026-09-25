"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
  ReactNode,
} from "react";
import {
  initialWizardDraft,
  WizardAction,
  WizardDraft,
  wizardReducer,
} from "./draft";

type WizardStore = {
  draft: WizardDraft;
  dispatch: React.Dispatch<WizardAction>;
  subscribe: (listener: () => void) => () => void;
};

const WizardContext = createContext<WizardStore | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(wizardReducer, initialWizardDraft);
  const listeners = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    listeners.current.forEach((listener) => listener());
  }, [draft]);

  const store = useMemo(
    () => ({
      draft,
      dispatch,
      subscribe,
    }),
    [draft, dispatch, subscribe]
  );

  return (
    <WizardContext.Provider value={store}>{children}</WizardContext.Provider>
  );
}

export function useWizard(): { draft: WizardDraft; dispatch: React.Dispatch<WizardAction> } {
  const store = useContext(WizardContext);
  if (store === null) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return { draft: store.draft, dispatch: store.dispatch };
}

type Selector<T> = (draft: WizardDraft) => T;

type EqualityFn<T> = (a: T, b: T) => boolean;

function defaultEquality<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

export function useWizardSelector<T>(
  selector: Selector<T>,
  equalityFn: EqualityFn<T> = defaultEquality
): T {
  const store = useContext(WizardContext);
  if (store === null) {
    throw new Error("useWizardSelector must be used within a WizardProvider");
  }

  const lastValue = useRef<T>(selector(store.draft));

  const getSnapshot = useCallback(() => {
    const nextValue = selector(store.draft);
    if (!equalityFn(lastValue.current, nextValue)) {
      lastValue.current = nextValue;
    }
    return lastValue.current;
  }, [store.draft, selector, equalityFn]);

  const selected = useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot
  );

  return selected;
}
