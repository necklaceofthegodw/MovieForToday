import { Film, RefreshCcw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FilmStrip } from "./components/FilmStrip";
import { MovieDetailModal } from "./components/MovieDetailModal";
import { PreferencePanel } from "./components/PreferencePanel";
import { getRecommendations } from "./lib/api";
import { setMovieCardStatus, type MovieCardStatus } from "./lib/movieActions";
import { mergeRecommendationHistory } from "./lib/recommendation";
import {
  loadLastResults,
  loadPreferences,
  loadRecommendationHistory,
  saveLastResults,
  savePreferences,
  saveRecommendationHistory,
} from "./lib/storage";
import type { MovieSummary, Preferences } from "./types";

type SpinPhase = "idle" | "spinning" | "settling";

function App() {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());
  const [movies, setMovies] = useState<MovieSummary[]>(() => loadLastResults());
  const [recommendationHistory, setRecommendationHistory] = useState<number[]>(() => loadRecommendationHistory());
  const [settingsOpen, setSettingsOpen] = useState(() => !loadPreferences().completed);
  const [selectedMovie, setSelectedMovie] = useState<MovieSummary | null>(null);
  const [movieStatuses, setMovieStatuses] = useState<Record<number, Exclude<MovieCardStatus, null>>>({});
  const [loading, setLoading] = useState(false);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>("idle");
  const [notice, setNotice] = useState("");
  const selectedMovieRef = useRef<MovieSummary | null>(null);
  const movieHistoryOpenRef = useRef(false);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    selectedMovieRef.current = selectedMovie;
  }, [selectedMovie]);

  useEffect(() => {
    const handlePopState = () => {
      if (!selectedMovieRef.current) return;
      movieHistoryOpenRef.current = false;
      setSelectedMovie(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    saveLastResults(movies);
  }, [movies]);

  useEffect(() => {
    saveRecommendationHistory(recommendationHistory);
  }, [recommendationHistory]);

  const updatePreferences = (next: Preferences) => {
    setPreferences(next);
  };

  const setVisibleMovieStatus = (movieId: number, status: MovieCardStatus) => {
    setPreferences((current) => setMovieCardStatus(current, movieId, status));
    setMovieStatuses((current) => {
      const next = { ...current };
      if (status) {
        next[movieId] = status;
      } else {
        delete next[movieId];
      }
      return next;
    });
  };

  const openMovie = (movie: MovieSummary) => {
    setSelectedMovie(movie);

    if (!window.history.state?.movieModal) {
      window.history.pushState({ ...window.history.state, movieModal: true, movieId: movie.id }, "", window.location.href);
      movieHistoryOpenRef.current = true;
    }
  };

  const closeMovie = () => {
    if (movieHistoryOpenRef.current && window.history.state?.movieModal) {
      window.history.back();
      return;
    }

    movieHistoryOpenRef.current = false;
    setSelectedMovie(null);
  };

  const generateMovies = async () => {
    if (!preferences.completed) {
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setSpinPhase("spinning");
    setNotice("");
    try {
      const previousMovieIds = Array.from(new Set([...movies.map((movie) => movie.id), ...recommendationHistory]));
      const [response] = await Promise.all([
        getRecommendations(preferences, previousMovieIds),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);
      setMovies(response.movies);
      setRecommendationHistory((current) => mergeRecommendationHistory(previousMovieIds.length > 0 ? previousMovieIds : current, response.movies));
      setMovieStatuses({});
      if (response.movies.length === 0) {
        setNotice("No matches for this profile yet. Try adding streaming services or relaxing max playtime and minimum rating.");
      } else {
        setNotice(response.demo ? "Demo mode: add a TMDB token to fetch real recommendations." : "");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't generate movies.");
    } finally {
      setSpinPhase("settling");
      window.setTimeout(() => {
        setLoading(false);
        setSpinPhase("idle");
      }, 520);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-reel">
            <Film size={24} />
          </span>
          <div>
            <span className="eyebrow">MovieForToday</span>
            <h1>Today's 10 movie picks</h1>
          </div>
        </div>
        <button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
          <Settings size={21} />
        </button>
      </header>

      <section className="hero-panel">
        <button className="generate-button" type="button" onClick={generateMovies} disabled={loading}>
          <RefreshCcw size={22} />
          {loading ? "Finding matches..." : "Find 10 movies"}
        </button>
      </section>

      {notice && <p className="notice">{notice}</p>}

      <FilmStrip
        movies={movies}
        spinPhase={spinPhase}
        movieStatuses={movieStatuses}
        onOpen={openMovie}
        onSetMovieStatus={setVisibleMovieStatus}
      />

      <PreferencePanel
        preferences={preferences}
        open={settingsOpen}
        onboarding={!preferences.completed}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          setPreferences(next);
          setSettingsOpen(false);
        }}
      />

      <MovieDetailModal movie={selectedMovie} onClose={closeMovie} />
    </main>
  );
}

export default App;
