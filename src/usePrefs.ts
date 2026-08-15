"use client";

import { useEffect, useState } from "react";
import { type Prefs, DEFAULT_PREFS, loadPrefs, savePrefs, applyPrefs } from "@/prefs";

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => {
    applyPrefs(prefs);
    savePrefs(prefs);
  }, [prefs]);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const reset = () => setPrefs({ ...DEFAULT_PREFS });

  return { prefs, update, reset };
}
