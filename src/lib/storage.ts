import { DEFAULT_PREFERENCES, type MovieSummary, type Preferences } from "../types";

const PREFS_KEY = "movie-for-today/preferences";
const LAST_RESULTS_KEY = "movie-for-today/last-results";

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as Preferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
}

export function loadLastResults(): MovieSummary[] {
  try {
    return JSON.parse(localStorage.getItem(LAST_RESULTS_KEY) || "[]") as MovieSummary[];
  } catch {
    return [];
  }
}

export function saveLastResults(movies: MovieSummary[]) {
  localStorage.setItem(LAST_RESULTS_KEY, JSON.stringify(movies));
}
