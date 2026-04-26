export type Genre = {
  id: number;
  name: string;
};

export type Person = {
  id: number;
  name: string;
  profilePath?: string | null;
  knownFor?: string;
};

export type WatchProvider = {
  id: number;
  name: string;
  logoPath?: string | null;
};

export type MovieSummary = {
  id: number;
  title: string;
  originalTitle?: string;
  year?: string;
  overview: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  genres?: Genre[];
  runtime?: number;
  providers?: WatchProvider[];
  matchedActors?: Person[];
  score?: number;
};

export type MovieReview = {
  id: string;
  author: string;
  content: string;
  url?: string;
};

export type MovieDetail = MovieSummary & {
  tagline?: string;
  trailerUrl?: string;
  filmwebUrl: string;
  reviews: MovieReview[];
};

export type Preferences = {
  favoriteGenreIds: number[];
  blockedGenreIds: number[];
  topActors: Person[];
  providerIds: number[];
  maxRuntime: number;
  minRating: number;
  watchedMovieIds: number[];
  blockedMovieIds: number[];
  completed: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  favoriteGenreIds: [18, 53, 878],
  blockedGenreIds: [],
  topActors: [],
  providerIds: [],
  maxRuntime: 150,
  minRating: 6.5,
  watchedMovieIds: [],
  blockedMovieIds: [],
  completed: false,
};

export const POPULAR_GENRES: Genre[] = [
  { id: 28, name: "Akcja" },
  { id: 12, name: "Przygodowy" },
  { id: 16, name: "Animacja" },
  { id: 35, name: "Komedia" },
  { id: 80, name: "Kryminał" },
  { id: 18, name: "Dramat" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romans" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 14, name: "Fantasy" },
  { id: 9648, name: "Tajemnica" },
];
