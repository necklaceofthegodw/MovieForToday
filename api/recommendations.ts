import { rankMovies, rankMoviesWithHistoryFallback } from "../src/lib/recommendation.js";
import type { MovieSummary, Preferences, WatchProvider } from "../src/types.js";
import { sampleMovies } from "./_sample.js";
import { buildDiscoverParams, hasTmdbToken, mapMovie, mapProvider, mapPerson, tmdbFetch } from "./_tmdb.js";

async function enrichMovie(movie: MovieSummary, preferences: Preferences) {
  const [detail, credits, providers] = await Promise.all([
    tmdbFetch<any>(`/movie/${movie.id}`, { language: "en-US" }).catch(() => null),
    tmdbFetch<any>(`/movie/${movie.id}/credits`, { language: "en-US" }).catch(() => null),
    tmdbFetch<any>(`/movie/${movie.id}/watch/providers`).catch(() => null),
  ]);

  const cast = credits?.cast || [];
  const topActorIds = new Set(preferences.topActors.map((actor) => actor.id));
  const matchedActors = cast.filter((person: any) => topActorIds.has(person.id)).map(mapPerson);
  const providerBuckets = providers?.results?.PL;
  const flatProviders = [
    ...(providerBuckets?.flatrate || []),
    ...(providerBuckets?.rent || []),
    ...(providerBuckets?.buy || []),
  ];
  const uniqueProviders = Array.from(
    new Map(flatProviders.map((provider: any) => [provider.provider_id, provider])).values(),
  ).map(mapProvider) as WatchProvider[];

  return {
    ...movie,
    runtime: detail?.runtime || movie.runtime,
    genres: detail?.genres || movie.genres,
    providers: uniqueProviders,
    matchedActors,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const preferences = req.body?.preferences as Preferences | undefined;
  const previousMovieIds = new Set<number>(req.body?.previousMovieIds || []);

  if (!preferences) {
    return res.status(400).json({ error: "Missing preferences." });
  }

  if (!hasTmdbToken()) {
    const demoMovies = sampleMovies
      .filter((movie) => !previousMovieIds.has(movie.id))
      .concat(sampleMovies.filter((movie) => previousMovieIds.has(movie.id)));
    return res.status(200).json({ movies: rankMoviesWithHistoryFallback(demoMovies, preferences, 10), demo: true });
  }

  try {
    const candidates = new Map<number, MovieSummary>();

    for (let relaxation = 0; relaxation < 4 && candidates.size < 35; relaxation += 1) {
      const pages = [1, 2, 3].sort(() => Math.random() - 0.5);
      for (const page of pages) {
        const data = await tmdbFetch<{ results: any[] }>("/discover/movie", buildDiscoverParams(preferences, page, relaxation));
        data.results
          .map(mapMovie)
          .filter((movie) => !previousMovieIds.has(movie.id))
          .forEach((movie) => candidates.set(movie.id, movie));
      }
    }

    const enriched = await Promise.all(Array.from(candidates.values()).slice(0, 35).map((movie) => enrichMovie(movie, preferences)));
    let movies = rankMovies(enriched, preferences, 10);

    if (movies.length < 10) {
      const extra = rankMovies(Array.from(candidates.values()), preferences, 10);
      movies = rankMovies([...movies, ...extra], preferences, 10);
    }

    return res.status(200).json({ movies: movies.length > 0 ? movies : rankMoviesWithHistoryFallback(enriched, preferences, 10), demo: false });
  } catch (error) {
    return res.status(200).json({ movies: rankMoviesWithHistoryFallback(sampleMovies, preferences, 10), demo: true, warning: String(error) });
  }
}
