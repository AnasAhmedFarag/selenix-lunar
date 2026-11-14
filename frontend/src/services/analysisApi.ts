import type { CompareResponse } from "../types/analysis";

export async function getComparison(start: string, days = 7, signal?: AbortSignal): Promise<CompareResponse> {
  const params = new URLSearchParams({ start: `${start}T00:00:00Z`, days: String(days) });
  const response = await fetch(`/api/compare?${params}`, { signal });
  if (!response.ok) throw new Error(`Analysis API returned HTTP ${response.status}`);
  return response.json() as Promise<CompareResponse>;
}


// One anonymous private key per browser. Saves are scoped to this browser on cloud.
function ownerHeaders(): Record<string, string> {
  const key = "sightline-anonymous-owner-token";
  let token = window.localStorage.getItem(key);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    window.localStorage.setItem(key, token);
  }
  return { "X-Sightline-Owner-Token": token };
}

export interface SavedAnalysis {
  id: number;
  title: string;
  site_id: string;
  site_name: string;
  start_date: string;
  days: number;
  solar_percent: number;
  earth_percent: number;
  combined_percent: number;
  model_version: string;
  source_sha256: string;
  created_at_utc: string;
}

async function checkedJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json() as {detail?: string};
      message = typeof payload.detail === "string" ? payload.detail : message;
    } catch { /* Non-JSON error; preserve HTTP status. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getSavedAnalyses(signal?: AbortSignal): Promise<SavedAnalysis[]> {
  const response = await fetch("/api/saved-analyses", { signal, headers: ownerHeaders() });
  const body = await checkedJson<{ items: SavedAnalysis[] }>(response);
  return body.items;
}

export async function createSavedAnalysis(input: {
  title: string;
  siteId: string;
  startDate: string;
  days: number;
}): Promise<SavedAnalysis> {
  return checkedJson<SavedAnalysis>(await fetch("/api/saved-analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ownerHeaders() },
    body: JSON.stringify(input),
  }));
}

export async function removeSavedAnalysis(id: number): Promise<void> {
  await checkedJson<{ deleted: boolean }>(await fetch(`/api/saved-analyses/${id}`, { method: "DELETE", headers: ownerHeaders() }));
}
