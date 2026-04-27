type FilmwebSearchHit = {
  id: number;
  type: string;
};

type FilmwebSearchResponse = {
  searchHits?: FilmwebSearchHit[];
};

type FilmwebInfoResponse = {
  year?: number;
};

const FILMWEB_BASE_URL = "https://www.filmweb.pl";

function filmwebSearchUrl(title: string, year?: string) {
  return `${FILMWEB_BASE_URL}/films/search?q=${encodeURIComponent([title, year].filter(Boolean).join(" "))}`;
}

async function filmwebFetch<T>(path: string) {
  const response = await fetch(`${FILMWEB_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MovieForToday/0.1",
    },
  });

  if (!response.ok) throw new Error(`Filmweb request failed with ${response.status}.`);

  return response.json() as Promise<T>;
}

export async function resolveFilmwebUrl(title: string, year?: string, originalTitle?: string) {
  const fallback = filmwebSearchUrl(title, year);
  const queries = Array.from(new Set([[title, year].filter(Boolean).join(" "), [originalTitle, year].filter(Boolean).join(" "), title].filter(Boolean)));

  for (const query of queries) {
    try {
      const search = await filmwebFetch<FilmwebSearchResponse>(`/api/v1/search?query=${encodeURIComponent(query)}`);
      const filmHits = (search.searchHits || []).filter((hit) => hit.type === "film");

      for (const hit of filmHits.slice(0, 5)) {
        const info = await filmwebFetch<FilmwebInfoResponse>(`/api/v1/film/${hit.id}/info`);
        if (!year || String(info.year) === year) {
          const filmYear = info.year || year;
          return `${FILMWEB_BASE_URL}/film/film-${filmYear}-${hit.id}`;
        }
      }
    } catch {
      // Keep the app usable when Filmweb throttles or changes its search endpoint.
    }
  }

  return fallback;
}

export function fallbackFilmwebUrl(title: string, year?: string) {
  return filmwebSearchUrl(title, year);
}
