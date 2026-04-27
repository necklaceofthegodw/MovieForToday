import { useEffect, useMemo, useRef, type WheelEvent } from "react";
import type { MovieCardStatus } from "../lib/movieActions";
import type { MovieSummary } from "../types";
import { MovieCard } from "./MovieCard";

type FilmStripProps = {
  movies: MovieSummary[];
  spinPhase: "idle" | "spinning" | "settling";
  movieStatuses: Record<number, Exclude<MovieCardStatus, null>>;
  onOpen: (movie: MovieSummary) => void;
  onSetMovieStatus: (movieId: number, status: MovieCardStatus) => void;
};

export function FilmStrip({ movies, spinPhase, movieStatuses, onOpen, onSetMovieStatus }: FilmStripProps) {
  const stripRef = useRef<HTMLElement | null>(null);
  const reelMovies = useMemo(() => {
    if (movies.length === 0 || spinPhase === "idle") return movies.map((movie) => ({ movie, reelKey: String(movie.id) }));

    return Array.from({ length: 3 }, (_, reelIndex) =>
      movies.map((movie) => ({ movie, reelKey: `${reelIndex}-${movie.id}` })),
    ).flat();
  }, [movies, spinPhase]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || movies.length === 0 || spinPhase === "idle") {
      if (strip) {
        strip.scrollLeft = 0;
        strip.scrollTop = 0;
      }
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const isMobile = mobileQuery.matches;
    const reelSize = isMobile ? strip.scrollHeight / 3 : strip.scrollWidth / 3;
    let frame = 0;
    let previousTime = performance.now();

    if (reelSize > 0 && spinPhase === "spinning") {
      if (isMobile) {
        strip.scrollTop = reelSize;
      } else {
        strip.scrollLeft = reelSize;
      }
    }

    if (reelSize > 0 && spinPhase === "settling") {
      const currentPosition = isMobile ? strip.scrollTop : strip.scrollLeft;
      const normalizedPosition = currentPosition % reelSize;
      const startPosition = reelSize + normalizedPosition;
      const targetPosition = reelSize * 2;
      const duration = 520;
      const startTime = performance.now();

      if (isMobile) {
        strip.scrollTop = startPosition;
      } else {
        strip.scrollLeft = startPosition;
      }

      const settle = (time: number) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextPosition = startPosition + (targetPosition - startPosition) * easedProgress;

        if (isMobile) {
          strip.scrollTop = nextPosition;
        } else {
          strip.scrollLeft = nextPosition;
        }

        if (progress < 1) {
          frame = window.requestAnimationFrame(settle);
        }
      };

      frame = window.requestAnimationFrame(settle);
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const currentReelSize = isMobile ? strip.scrollHeight / 3 : strip.scrollWidth / 3;
      if (currentReelSize <= 0) return;

      const currentPosition = isMobile ? strip.scrollTop : strip.scrollLeft;
      const speed = 2400;
      let nextPosition = currentPosition + speed * deltaSeconds;

      if (nextPosition >= currentReelSize * 2) {
        nextPosition -= currentReelSize;
      }

      if (isMobile) {
        strip.scrollTop = nextPosition;
      } else {
        strip.scrollLeft = nextPosition;
      }

      if (spinPhase === "spinning") {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [movies.length, spinPhase]);

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    const strip = stripRef.current;
    if (!strip || window.matchMedia("(max-width: 760px)").matches) return;

    const canScrollHorizontally = strip.scrollWidth > strip.clientWidth;
    if (!canScrollHorizontally) return;

    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (delta === 0) return;

    event.preventDefault();
    strip.scrollLeft += delta;
  };

  if (movies.length === 0) {
    return (
      <section
        ref={stripRef}
        className={`film-strip empty ${spinPhase}`}
        aria-live="polite"
        onWheel={handleWheel}
      >
        <div className="empty-frame">
          <span className="projector-mark">FILM</span>
          <h2>Your first set of picks is waiting</h2>
          <p>Build your taste profile, tap the main button, and get ten movies matched to your mood.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={stripRef} className={`film-strip ${spinPhase}`} aria-live="polite" onWheel={handleWheel}>
      <div className="strip-track">
        {reelMovies.map(({ movie, reelKey }) => (
          <MovieCard
            key={reelKey}
            movie={movie}
            status={movieStatuses[movie.id] ?? null}
            onOpen={onOpen}
            onSetStatus={(status) => onSetMovieStatus(movie.id, status)}
          />
        ))}
      </div>
    </section>
  );
}
