import type { MovieDetail, MovieSummary, Person, Preferences, WatchProvider } from "../types";
import { rankMoviesWithHistoryFallback } from "./recommendation";
import { sampleDetail, sampleMovies, samplePeople, sampleProviders } from "../../api/_sample";

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected JSON response.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Nie udało się pobrać danych.");
  }
  return response.json() as Promise<T>;
}

export async function getProviders() {
  try {
    const response = await fetch("/api/providers");
    return await parseResponse<{ providers: WatchProvider[]; demo: boolean }>(response);
  } catch {
    return { providers: sampleProviders, demo: true };
  }
}

export async function searchPeople(query: string) {
  if (query.trim().length < 2) return { people: [] as Person[], demo: false };
  const normalizedQuery = query.trim();
  try {
    const response = await fetch(`/api/search/people?query=${encodeURIComponent(normalizedQuery)}`);
    return await parseResponse<{ people: Person[]; demo: boolean }>(response);
  } catch {
    const people = samplePeople.filter((person) => person.name.toLowerCase().includes(normalizedQuery.toLowerCase()));
    return {
      people:
        people.length > 0
          ? people
          : [
              {
                id: demoPersonId(normalizedQuery),
                name: toTitleCase(normalizedQuery),
                knownFor: "Wpis demo, podmień token TMDB dla prawdziwych wyników",
              },
            ],
      demo: true,
    };
  }
}

export async function getRecommendations(preferences: Preferences, previousMovieIds: number[]) {
  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences, previousMovieIds }),
    });
    return await parseResponse<{ movies: MovieSummary[]; demo: boolean }>(response);
  } catch {
    const previous = new Set(previousMovieIds);
    const ordered = sampleMovies.filter((movie) => !previous.has(movie.id)).concat(sampleMovies.filter((movie) => previous.has(movie.id)));
    return { movies: rankMoviesWithHistoryFallback(ordered, preferences, 10), demo: true };
  }
}

export async function getMovieDetail(id: number) {
  try {
    const response = await fetch(`/api/movie/${id}`);
    return await parseResponse<{ movie: MovieDetail; demo: boolean }>(response);
  } catch {
    return { movie: sampleDetail(id), demo: true };
  }
}

export function imageUrl(path?: string | null, size = "w500") {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function demoPersonId(value: string) {
  return Math.abs(
    value.split("").reduce((hash, char) => {
      return (hash << 5) - hash + char.charCodeAt(0);
    }, 0),
  );
}
