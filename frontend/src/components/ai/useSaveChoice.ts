"use client";
import { useState } from "react";
import { getAccessToken, syncAccountChoice } from "@/lib/account";
import { setChoice, type Choice } from "@/lib/history";

/** Saves a choice to the account first, then the local view, so the two never disagree. */
export function useSaveChoice(entryId: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(choice: Choice | undefined) {
    setSaving(true);
    setError("");
    try {
      if (!(await getAccessToken())) throw new Error("Sign in to save this.");
      await syncAccountChoice(entryId, choice);
      setChoice(entryId, choice);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return { save, saving, error };
}
