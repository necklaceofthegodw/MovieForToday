import type { MovieSummary, Preferences } from "../types";

export const RECOMMENDATION_HISTORY_LIMIT = 120;

export function toggleNumber(values: number[], value: number) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function mergeRecommendationHistory(previousMovieIds: number[], movies: MovieSummary[], limit = RECOMMENDATION_HISTORY_LIMIT) {
  const merged = [...movies.map((movie) => movie.id), ...previousMovieIds];
  return Array.from(new Set(merged)).slice(0, limit);
}

export function scoreMovie(movie: MovieSummary, preferences: Preferences) {
  let score = 0;

  for (const genreId of movie.genreIds) {
    if (preferences.favoriteGenreIds.includes(genreId)) score += 12;
    if (preferences.blockedGenreIds.includes(genreId)) score -= 100;
  }

  const matchedActors = movie.matchedActors?.length ?? 0;
  score += matchedActors * 18;

  const providerMatch = movie.providers?.some((provider) => preferences.providerIds.includes(provider.id));
  if (providerMatch) score += 14;

  if (movie.runtime && movie.runtime <= preferences.maxRuntime) score += 8;
  if (movie.voteAverage >= preferences.minRating) score += 10;
  if (movie.year && Number(movie.year) >= preferences.minReleaseYear) score += 6;

  score += Math.min(movie.voteCount / 1000, 10);
  score += movie.voteAverage;

  if (preferences.watchedMovieIds.includes(movie.id)) score -= 1000;
  if (preferences.blockedMovieIds.includes(movie.id)) score -= 1000;

  return Math.round(score * 10) / 10;
}

export function filterHardBlocks(movies: MovieSummary[], preferences: Preferences) {
  return movies.filter((movie) => {
    const blockedMovie =
      preferences.watchedMovieIds.includes(movie.id) || preferences.blockedMovieIds.includes(movie.id);
    const blockedGenre = movie.genreIds.some((genreId) => preferences.blockedGenreIds.includes(genreId));
    const blockedYear = Boolean(movie.year && Number(movie.year) < preferences.minReleaseYear);
    return !blockedMovie && !blockedGenre && !blockedYear;
  });
}

export function rankMovies(movies: MovieSummary[], preferences: Preferences, limit = 10) {
  return filterHardBlocks(movies, preferences)
    .map((movie) => ({ ...movie, score: scoreMovie(movie, preferences) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

export function rankMoviesWithHistoryFallback(movies: MovieSummary[], preferences: Preferences, limit = 10) {
  const ranked = rankMovies(movies, preferences, limit);
  if (ranked.length > 0) return ranked;

  return rankMovies(
    movies,
    {
      ...preferences,
      watchedMovieIds: [],
      blockedMovieIds: [],
    },
    limit,
  );
}
