export type TestReading = {
  timestamp: string;
  percent: number;
};

export type TestHistoryKey = "rom-history" | "extension-history" | "flexion-history";

export function loadHistory(key: TestHistoryKey): TestReading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReading(key: TestHistoryKey, percent: number): TestReading[] {
  const history = loadHistory(key);
  const entry: TestReading = {
    timestamp: new Date().toISOString(),
    percent,
  };
  history.push(entry);
  localStorage.setItem(key, JSON.stringify(history));
  return history;
}

export function clearHistory(key: TestHistoryKey): void {
  localStorage.removeItem(key);
}
