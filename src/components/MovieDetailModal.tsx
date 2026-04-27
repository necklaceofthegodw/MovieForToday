import { ExternalLink, Play, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getMovieDetail, imageUrl } from "../lib/api";
import type { MovieDetail, MovieSummary } from "../types";

type MovieDetailModalProps = {
  movie: MovieSummary | null;
  onClose: () => void;
};

function fallbackFilmwebUrl(movie: MovieSummary) {
  return `https://www.filmweb.pl/films/search?q=${encodeURIComponent([movie.title, movie.year].filter(Boolean).join(" "))}`;
}

export function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setLoading(true);
    setDetail(null);
    getMovieDetail(movie.id)
      .then(({ movie }) => setDetail(movie))
      .catch(() =>
        setDetail({
          ...movie,
          filmwebUrl: fallbackFilmwebUrl(movie),
          reviews: [],
        }),
      )
      .finally(() => setLoading(false));
  }, [movie]);

  if (!movie) return null;

  const active = detail || movie;
  const backdrop = imageUrl(active.backdropPath, "w1280");

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Szczegóły filmu ${movie.title}`}>
      <section className="detail-modal">
        <button className="icon-button close-detail" type="button" onClick={onClose} aria-label="Zamknij szczegóły">
          <X size={20} />
        </button>
        {backdrop && <img className="detail-backdrop" src={backdrop} alt="" />}
        <div className="detail-content">
          <div>
            <span className="eyebrow">Szczegóły filmu</span>
            <h2>{active.title}</h2>
            <p className="detail-meta">
              {[active.year, active.runtime ? `${active.runtime} min` : undefined].filter(Boolean).join(" • ")}
              <span>
                <Star size={16} fill="currentColor" /> {active.voteAverage.toFixed(1)}
              </span>
            </p>
          </div>
          {loading ? <p>Ładuję pełne informacje...</p> : <p>{active.overview}</p>}

          <div className="mini-tags">
            {(active.genres || []).map((genre) => (
              <span key={genre.id}>{genre.name}</span>
            ))}
          </div>

          {detail?.reviews && detail.reviews.length > 0 && (
            <div className="reviews">
              <h3>Recenzje</h3>
              {detail.reviews.map((review) => (
                <blockquote key={review.id}>
                  <strong>{review.author}</strong>
                  <p>{review.content.slice(0, 320)}{review.content.length > 320 ? "..." : ""}</p>
                </blockquote>
              ))}
            </div>
          )}

          <div className="detail-actions">
            {detail?.trailerUrl && (
              <a className="primary-button" href={detail.trailerUrl} target="_blank" rel="noreferrer">
                <Play size={19} />
                Trailer
              </a>
            )}
            <a
              className="secondary-button"
              href={detail?.filmwebUrl || fallbackFilmwebUrl(movie)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={18} />
              Zobacz na Filmweb
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
