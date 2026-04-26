import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES } from "../types";
import { setMovieCardStatus, toggleBlocked, toggleWatched } from "./movieActions";

describe("movie card actions", () => {
  it("toggles watched state", () => {
    const watched = toggleWatched(DEFAULT_PREFERENCES, 10);
    expect(watched.watchedMovieIds).toContain(10);

    const reverted = toggleWatched(watched, 10);
    expect(reverted.watchedMovieIds).not.toContain(10);
  });

  it("toggles blocked state", () => {
    const blocked = toggleBlocked(DEFAULT_PREFERENCES, 20);
    expect(blocked.blockedMovieIds).toContain(20);

    const reverted = toggleBlocked(blocked, 20);
    expect(reverted.blockedMovieIds).not.toContain(20);
  });

  it("keeps watched and blocked mutually exclusive", () => {
    const watched = toggleWatched(DEFAULT_PREFERENCES, 30);
    const blocked = toggleBlocked(watched, 30);
    expect(blocked.blockedMovieIds).toContain(30);
    expect(blocked.watchedMovieIds).not.toContain(30);

    const watchedAgain = toggleWatched(blocked, 30);
    expect(watchedAgain.watchedMovieIds).toContain(30);
    expect(watchedAgain.blockedMovieIds).not.toContain(30);
  });

  it("sets a neutral card status without relying on previous history", () => {
    const history = { ...DEFAULT_PREFERENCES, watchedMovieIds: [40], blockedMovieIds: [50] };

    const watched = setMovieCardStatus(history, 50, "watched");
    expect(watched.watchedMovieIds).toContain(50);
    expect(watched.blockedMovieIds).not.toContain(50);

    const neutral = setMovieCardStatus(watched, 50, null);
    expect(neutral.watchedMovieIds).not.toContain(50);
    expect(neutral.blockedMovieIds).not.toContain(50);
  });
});
