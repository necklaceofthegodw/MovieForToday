import { describe, expect, it } from "vitest";
import { rankMovies, rankMoviesWithHistoryFallback, scoreMovie } from "./recommendation";
import { DEFAULT_PREFERENCES, type MovieSummary } from "../types";

const baseMovie: MovieSummary = {
  id: 1,
  title: "Test Movie",
  overview: "A test movie",
  voteAverage: 7.5,
  voteCount: 1500,
  genreIds: [18],
  runtime: 120,
};

describe("recommendation scoring", () => {
  it("boosts favorite genres and matched actors", () => {
    const score = scoreMovie(
      { ...baseMovie, matchedActors: [{ id: 31, name: "Tom Hanks" }] },
      { ...DEFAULT_PREFERENCES, favoriteGenreIds: [18], topActors: [{ id: 31, name: "Tom Hanks" }] },
    );

    expect(score).toBeGreaterThan(45);
  });

  it("removes hard blocked genres and watched movies", () => {
    const ranked = rankMovies(
      [
        baseMovie,
        { ...baseMovie, id: 2, title: "Allowed", genreIds: [35] },
        { ...baseMovie, id: 3, title: "Watched", genreIds: [35] },
      ],
      { ...DEFAULT_PREFERENCES, blockedGenreIds: [18], watchedMovieIds: [3] },
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].title).toBe("Allowed");
  });

  it("falls back when local history exhausts the available pool", () => {
    const ranked = rankMoviesWithHistoryFallback(
      [baseMovie],
      { ...DEFAULT_PREFERENCES, watchedMovieIds: [baseMovie.id], blockedMovieIds: [] },
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].title).toBe("Test Movie");
  });
});
