// Tiny localStorage store for watch history + saved videos, with a change
// emitter so cards and the sidebar stay in sync.

export interface HistoryEntry {
  id: string;
  title: string;
  thumb?: string;
  url: string;
  channel?: string;
  ts: number;
}

export type SavedEntry = Omit<HistoryEntry, "ts"> & { ts: number };

const HISTORY_KEY = "faphive_history";
const SAVED_KEY = "faphive_saved";
const MAX = 48;

const listeners = new Set<() => void>();

export function onStoreChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn();
}

function read<T>(key: string): T[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? (raw as T[]) : [];
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  return read<HistoryEntry>(HISTORY_KEY);
}

export function saveHistoryEntry(v: Omit<HistoryEntry, "ts">) {
  const list = loadHistory().filter((h) => h.id !== v.id);
  list.unshift({ ...v, ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX)));
  emit();
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  emit();
}

export function loadSaved(): SavedEntry[] {
  return read<SavedEntry>(SAVED_KEY);
}

export function isSaved(id: string): boolean {
  return loadSaved().some((s) => s.id === id);
}

export function toggleSaved(v: Omit<SavedEntry, "ts">): boolean {
  const list = loadSaved();
  const exists = list.some((s) => s.id === v.id);
  const next = exists
    ? list.filter((s) => s.id !== v.id)
    : [{ ...v, ts: Date.now() }, ...list].slice(0, MAX);
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  emit();
  return !exists;
}

/** "Today" / "3d" / "2w" — same short-form labels the beeg cards use. */
export function relativeDay(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}
