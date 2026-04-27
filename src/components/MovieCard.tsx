import { Ban, Check, Info, Star } from "lucide-react";
import { imageUrl } from "../lib/api";
import type { MovieCardStatus } from "../lib/movieActions";
import type { MovieSummary } from "../types";

type MovieCardProps = {
  movie: MovieSummary;
  status: MovieCardStatus;
  onOpen: (movie: MovieSummary) => void;
  onSetStatus: (status: MovieCardStatus) => void;
};

export function MovieCard({ movie, status, onOpen, onSetStatus }: MovieCardProps) {
  const poster = imageUrl(movie.posterPath, "w500");
  const isWatched = status === "watched";
  const isBlocked = status === "blocked";

  return (
    <article className={`movie-frame ${isWatched ? "is-watched" : ""} ${isBlocked ? "is-blocked" : ""}`}>
      {(isWatched || isBlocked) && <span className="movie-state-badge">{isWatched ? "Watched" : "Rejected"}</span>}
      <button className="poster-button" type="button" onClick={() => onOpen(movie)}>
        {poster ? <img src={poster} alt={`${movie.title} poster`} /> : <div className="poster-fallback">{movie.title}</div>}
      </button>
      <div className="movie-copy">
        <div className="movie-title-row">
          <h3>{movie.title}</h3>
          <span className="rating">
            <Star size={15} fill="currentColor" />
            {movie.voteAverage.toFixed(1)}
          </span>
        </div>
        <p>{[movie.year, movie.runtime ? `${movie.runtime} min` : undefined].filter(Boolean).join(" • ")}</p>
        <div className="mini-tags">
          {(movie.genres || []).slice(0, 3).map((genre) => (
            <span key={genre.id}>{genre.name}</span>
          ))}
        </div>
        {movie.providers && movie.providers.length > 0 && (
          <div className="vod-row" aria-label={`Available on: ${movie.providers.map((provider) => provider.name).join(", ")}`}>
            {movie.providers.slice(0, 5).map((provider) => (
              <span className="provider-icon" key={`${movie.id}-${provider.id}`} title={provider.name}>
                {provider.logoPath ? (
                  <img src={imageUrl(provider.logoPath, "w92")} alt="" />
                ) : (
                  <span>{providerInitials(provider.name)}</span>
                )}
              </span>
            ))}
          </div>
        )}
        {movie.matchedActors && movie.matchedActors.length > 0 && (
          <p className="actor-match">Matched by: {movie.matchedActors.map((actor) => actor.name).join(", ")}</p>
        )}
      </div>
      <div className="card-actions">
        <button
          type="button"
          className="icon-button"
          onClick={() => onOpen(movie)}
          aria-label={`Movie details for ${movie.title}`}
          title="Details"
        >
          <Info size={18} />
        </button>
        <button
          type="button"
          className={`icon-button ${isWatched ? "active-positive" : ""}`}
          onClick={() => onSetStatus(isWatched ? null : "watched")}
          aria-label={isWatched ? `Undo watched: ${movie.title}` : `Mark ${movie.title} as watched`}
          aria-pressed={isWatched}
          title={isWatched ? "Undo watched" : "Mark as watched"}
        >
          <Check size={18} />
        </button>
        <button
          type="button"
          className={`icon-button ${isBlocked ? "active-negative" : ""}`}
          onClick={() => onSetStatus(isBlocked ? null : "blocked")}
          aria-label={isBlocked ? `Undo rejection: ${movie.title}` : `Reject ${movie.title}`}
          aria-pressed={isBlocked}
          title={isBlocked ? "Undo rejection" : "Reject movie"}
        >
          <Ban size={18} />
        </button>
      </div>
    </article>
  );
}

function providerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
