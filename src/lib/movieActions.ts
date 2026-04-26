import type { Preferences } from "../types";

export type MovieCardStatus = "watched" | "blocked" | null;

export function toggleWatched(preferences: Preferences, movieId: number): Preferences {
  const alreadyWatched = preferences.watchedMovieIds.includes(movieId);

  return {
    ...preferences,
    watchedMovieIds: alreadyWatched
      ? preferences.watchedMovieIds.filter((id) => id !== movieId)
      : Array.from(new Set([...preferences.watchedMovieIds, movieId])),
    blockedMovieIds: preferences.blockedMovieIds.filter((id) => id !== movieId),
  };
}

export function setMovieCardStatus(preferences: Preferences, movieId: number, status: MovieCardStatus): Preferences {
  const withoutMovie = {
    ...preferences,
    watchedMovieIds: preferences.watchedMovieIds.filter((id) => id !== movieId),
    blockedMovieIds: preferences.blockedMovieIds.filter((id) => id !== movieId),
  };

  if (status === "watched") {
    return {
      ...withoutMovie,
      watchedMovieIds: [...withoutMovie.watchedMovieIds, movieId],
    };
  }

  if (status === "blocked") {
    return {
      ...withoutMovie,
      blockedMovieIds: [...withoutMovie.blockedMovieIds, movieId],
    };
  }

  return withoutMovie;
}

export function toggleBlocked(preferences: Preferences, movieId: number): Preferences {
  const alreadyBlocked = preferences.blockedMovieIds.includes(movieId);

  return {
    ...preferences,
    blockedMovieIds: alreadyBlocked
      ? preferences.blockedMovieIds.filter((id) => id !== movieId)
      : Array.from(new Set([...preferences.blockedMovieIds, movieId])),
    watchedMovieIds: preferences.watchedMovieIds.filter((id) => id !== movieId),
  };
}
