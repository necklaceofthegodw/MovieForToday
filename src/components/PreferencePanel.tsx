import { Search, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProviders, imageUrl, searchPeople } from "../lib/api";
import { toggleNumber } from "../lib/recommendation";
import { POPULAR_GENRES, type Person, type Preferences, type WatchProvider } from "../types";

type PreferencePanelProps = {
  preferences: Preferences;
  open: boolean;
  onboarding?: boolean;
  onClose: () => void;
  onSave: (preferences: Preferences) => void;
};

export function PreferencePanel({ preferences, open, onboarding = false, onClose, onSave }: PreferencePanelProps) {
  const [draft, setDraft] = useState(preferences);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [actorQuery, setActorQuery] = useState("");
  const [actorResults, setActorResults] = useState<Person[]>([]);
  const [searchingActors, setSearchingActors] = useState(false);

  useEffect(() => {
    if (open) setDraft(preferences);
  }, [open, preferences]);

  useEffect(() => {
    getProviders().then(({ providers }) => setProviders(providers)).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (actorQuery.trim().length < 2) {
        setActorResults([]);
        return;
      }

      setSearchingActors(true);
      searchPeople(actorQuery)
        .then(({ people }) => setActorResults(people))
        .catch(() => setActorResults([]))
        .finally(() => setSearchingActors(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [actorQuery]);

  const canSave = useMemo(() => draft.favoriteGenreIds.length > 0, [draft.favoriteGenreIds.length]);

  if (!open) return null;

  const addActor = (person: Person) => {
    if (draft.topActors.some((actor) => actor.id === person.id)) return;
    setDraft({ ...draft, topActors: [...draft.topActors, person].slice(0, 8) });
    setActorQuery("");
    setActorResults([]);
  };

  const save = () => {
    if (!canSave) return;
    onSave({ ...draft, completed: true });
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Preferencje filmowe">
      <section className="preferences-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Profil seansu</span>
            <h2>{onboarding ? "Ustaw swój gust" : "Preferencje"}</h2>
          </div>
          {!onboarding && (
            <button className="icon-button ghost" type="button" onClick={onClose} aria-label="Zamknij ustawienia">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="preference-section">
          <h3>Ulubione gatunki</h3>
          <div className="chip-grid">
            {POPULAR_GENRES.map((genre) => (
              <button
                key={genre.id}
                className={`chip ${draft.favoriteGenreIds.includes(genre.id) ? "selected" : ""}`}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    favoriteGenreIds: toggleNumber(draft.favoriteGenreIds, genre.id),
                    blockedGenreIds: draft.blockedGenreIds.filter((id) => id !== genre.id),
                  })
                }
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <details className="preference-section quiet-section">
          <summary>Nielubiane gatunki</summary>
          <div className="chip-grid">
            {POPULAR_GENRES.map((genre) => (
              <button
                key={genre.id}
                className={`chip danger ${draft.blockedGenreIds.includes(genre.id) ? "selected" : ""}`}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    blockedGenreIds: toggleNumber(draft.blockedGenreIds, genre.id),
                    favoriteGenreIds: draft.favoriteGenreIds.filter((id) => id !== genre.id),
                  })
                }
              >
                {genre.name}
              </button>
            ))}
          </div>
        </details>

        <div className="preference-section">
          <h3>TOP aktorzy</h3>
          <label className="search-box">
            <Search size={18} />
            <input
              value={actorQuery}
              onChange={(event) => setActorQuery(event.target.value)}
              placeholder="Wpisz aktora lub aktorkę"
            />
          </label>
          {(actorResults.length > 0 || searchingActors) && (
            <div className="search-results">
              {searchingActors && <span className="muted">Szukam...</span>}
              {actorResults.map((person) => (
                <button key={person.id} type="button" onClick={() => addActor(person)} className="person-result">
                  {person.profilePath ? <img src={imageUrl(person.profilePath, "w185")} alt="" /> : <span />}
                  <strong>{person.name}</strong>
                  {person.knownFor && <small>{person.knownFor}</small>}
                </button>
              ))}
            </div>
          )}
          <div className="selected-actors">
            {draft.topActors.map((actor) => (
              <button
                key={actor.id}
                className="actor-pill"
                type="button"
                onClick={() => setDraft({ ...draft, topActors: draft.topActors.filter((item) => item.id !== actor.id) })}
              >
                {actor.name}
                <X size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="preference-section">
          <h3>Platformy VOD</h3>
          <div className="provider-grid" aria-label="Wybierz platformy VOD">
            {providers.map((provider) => (
              <button
                key={`${provider.id}-${provider.name}`}
                className={`provider-toggle ${providerClass(provider.name)} ${
                  draft.providerIds.includes(provider.id) ? "selected" : ""
                }`}
                type="button"
                title={provider.name}
                aria-label={`Przełącz platformę ${provider.name}`}
                aria-pressed={draft.providerIds.includes(provider.id)}
                onClick={() => setDraft({ ...draft, providerIds: toggleNumber(draft.providerIds, provider.id) })}
              >
                <span className="provider-logo" aria-hidden="true">
                  {provider.logoPath ? <img src={imageUrl(provider.logoPath, "w92")} alt="" /> : providerMark(provider.name)}
                </span>
                <span className="provider-name">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="preference-row">
          <label>
            Maks. czas
            <span>{draft.maxRuntime} min</span>
            <input
              type="range"
              min="80"
              max="210"
              step="5"
              value={draft.maxRuntime}
              onChange={(event) => setDraft({ ...draft, maxRuntime: Number(event.target.value) })}
            />
          </label>
          <label>
            Min. ocena
            <span>{draft.minRating.toFixed(1)}</span>
            <input
              type="range"
              min="5"
              max="8.5"
              step="0.1"
              value={draft.minRating}
              onChange={(event) => setDraft({ ...draft, minRating: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="panel-actions">
          <button className="secondary-button" type="button" onClick={() => setDraft({ ...preferences, completed: false })}>
            Reset
          </button>
          <button className="primary-button" type="button" disabled={!canSave} onClick={save}>
            <Settings2 size={20} />
            Zapisz profil
          </button>
        </div>
      </section>
    </div>
  );
}

function providerClass(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("netflix")) return "netflix";
  if (normalized.includes("max") || normalized.includes("hbo")) return "max";
  if (normalized.includes("prime") || normalized.includes("amazon")) return "prime";
  if (normalized.includes("disney")) return "disney";
  if (normalized.includes("apple")) return "apple";
  if (normalized.includes("sky")) return "skyshowtime";
  if (normalized.includes("canal")) return "canal";
  if (normalized.includes("player")) return "player";
  if (normalized.includes("tvp")) return "tvp";
  if (normalized.includes("paramount")) return "paramount";
  return "generic";
}

function providerMark(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("netflix")) return "N";
  if (normalized.includes("max") || normalized.includes("hbo")) return "max";
  if (normalized.includes("prime") || normalized.includes("amazon")) return "prime";
  if (normalized.includes("disney")) return "D+";
  if (normalized.includes("apple")) return "tv+";
  if (normalized.includes("sky")) return "sky";
  if (normalized.includes("canal")) return "C+";
  if (normalized.includes("player")) return "P";
  if (normalized.includes("tvp")) return "TVP";
  if (normalized.includes("paramount")) return "P+";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
