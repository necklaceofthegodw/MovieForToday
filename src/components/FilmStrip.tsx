import { useRef, type WheelEvent } from "react";
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
          <h2>Taśma czeka na pierwszy seans</h2>
          <p>Ustaw profil, kliknij główny przycisk i dostaniesz dziesiątkę filmów dobraną pod Twój gust.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={stripRef} className={`film-strip ${spinPhase}`} aria-live="polite" onWheel={handleWheel}>
      <div className="strip-track">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
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
