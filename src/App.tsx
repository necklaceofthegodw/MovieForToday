import { Film, RefreshCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { FilmStrip } from "./components/FilmStrip";
import { MovieDetailModal } from "./components/MovieDetailModal";
import { PreferencePanel } from "./components/PreferencePanel";
import { getRecommendations } from "./lib/api";
import { setMovieCardStatus, type MovieCardStatus } from "./lib/movieActions";
import { loadLastResults, loadPreferences, saveLastResults, savePreferences } from "./lib/storage";
import type { MovieSummary, Preferences } from "./types";

function App() {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());
  const [movies, setMovies] = useState<MovieSummary[]>(() => loadLastResults());
  const [settingsOpen, setSettingsOpen] = useState(() => !loadPreferences().completed);
  const [selectedMovie, setSelectedMovie] = useState<MovieSummary | null>(null);
  const [movieStatuses, setMovieStatuses] = useState<Record<number, Exclude<MovieCardStatus, null>>>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    saveLastResults(movies);
  }, [movies]);

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

  const generateMovies = async () => {
    if (!preferences.completed) {
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setNotice("");
    try {
      const previousMovieIds = movies.map((movie) => movie.id);
      const response = await getRecommendations(preferences, previousMovieIds);
      setMovies(response.movies);
      setMovieStatuses({});
      if (response.movies.length === 0) {
        setNotice("Nie znalazłem filmów dla tego profilu. Poluzuj VOD, czas lub minimalną ocenę.");
      } else {
        setNotice(response.demo ? "Tryb demo: dodaj token TMDB, żeby pobierać prawdziwe rekomendacje." : "");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Nie udało się wygenerować filmów.");
    } finally {
      window.setTimeout(() => setLoading(false), 500);
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
            <h1>10 filmów na dziś</h1>
          </div>
        </div>
        <button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Otwórz ustawienia">
          <Settings size={21} />
        </button>
      </header>

      <section className="hero-panel">
        <button className="generate-button" type="button" onClick={generateMovies} disabled={loading}>
          <RefreshCcw size={22} />
          {loading ? "Kręcę taśmę..." : "Wybierz 10 filmów"}
        </button>
      </section>

      {notice && <p className="notice">{notice}</p>}

      <FilmStrip
        movies={movies}
        spinning={loading}
        movieStatuses={movieStatuses}
        onOpen={setSelectedMovie}
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

      <MovieDetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}

export default App;
