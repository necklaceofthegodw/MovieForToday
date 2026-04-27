import type { MovieDetail, MovieReview, MovieSummary, Person, Preferences, WatchProvider } from "../src/types.js";
import { fallbackFilmwebUrl } from "./_filmweb.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const token = process.env.TMDB_READ_ACCESS_TOKEN;

export function hasTmdbToken() {
  return Boolean(token);
}

export async function tmdbFetch<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}) {
  if (!token) throw new Error("TMDB_READ_ACCESS_TOKEN is not configured.");

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export function mapProvider(provider: any): WatchProvider {
  return {
    id: provider.provider_id,
    name: provider.provider_name,
    logoPath: provider.logo_path,
  };
}

export function mapPerson(person: any): Person {
  return {
    id: person.id,
    name: person.name,
    profilePath: person.profile_path,
    knownFor: Array.isArray(person.known_for)
      ? person.known_for
          .map((item: any) => item.title || item.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(", ")
      : undefined,
  };
}

export function mapMovie(movie: any): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    year: movie.release_date?.slice(0, 4),
    overview: movie.overview || "Brak polskiego opisu w TMDB.",
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    voteAverage: movie.vote_average ?? 0,
    voteCount: movie.vote_count ?? 0,
    genreIds: movie.genre_ids || movie.genres?.map((genre: any) => genre.id) || [],
    genres: movie.genres,
    runtime: movie.runtime,
  };
}

export function mapDetail(movie: any): MovieDetail {
  const videos = movie.videos?.results || [];
  const trailer = videos.find((video: any) => video.site === "YouTube" && video.type === "Trailer") || videos[0];
  const providers = movie["watch/providers"]?.results?.PL;
  const flatProviders = [...(providers?.flatrate || []), ...(providers?.rent || []), ...(providers?.buy || [])];
  const uniqueProviders = Array.from(new Map(flatProviders.map((provider: any) => [provider.provider_id, provider])).values());
  const reviews: MovieReview[] = (movie.reviews?.results || []).slice(0, 3).map((review: any) => ({
    id: review.id,
    author: review.author,
    content: review.content,
    url: review.url,
  }));

  return {
    ...mapMovie(movie),
    tagline: movie.tagline,
    trailerUrl: trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
    filmwebUrl: fallbackFilmwebUrl(movie.title, movie.release_date?.slice(0, 4)),
    reviews,
    providers: uniqueProviders.map(mapProvider),
  };
}

export function buildDiscoverParams(preferences: Preferences, page: number, relaxation: number) {
  const providerIds = relaxation >= 1 ? [] : preferences.providerIds;
  const maxRuntime = relaxation >= 2 ? undefined : preferences.maxRuntime;
  const minReleaseYear = relaxation >= 3 ? Math.max(1950, preferences.minReleaseYear - 10) : preferences.minReleaseYear;
  const minRating = relaxation >= 3 ? Math.max(5.5, preferences.minRating - 1) : preferences.minRating;

  return {
    language: "pl-PL",
    region: "PL",
    watch_region: "PL",
    sort_by: "popularity.desc",
    include_adult: false,
    include_video: false,
    page,
    with_genres: preferences.favoriteGenreIds.join("|") || undefined,
    without_genres: preferences.blockedGenreIds.join(",") || undefined,
    with_watch_providers: providerIds.join("|") || undefined,
    "vote_average.gte": minRating,
    "vote_count.gte": relaxation >= 3 ? 80 : 250,
    "primary_release_date.gte": `${minReleaseYear}-01-01`,
    "with_runtime.lte": maxRuntime,
  };
}
