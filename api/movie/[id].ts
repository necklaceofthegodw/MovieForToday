import { sampleDetail } from "../_sample.js";
import { resolveFilmwebUrl } from "../_filmweb.js";
import { hasTmdbToken, mapDetail, tmdbFetch } from "../_tmdb.js";

export default async function handler(req: any, res: any) {
  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid movie id." });

  if (!hasTmdbToken()) {
    return res.status(200).json({ movie: sampleDetail(id), demo: true });
  }

  try {
    const movie = await tmdbFetch<any>(`/movie/${id}`, {
      language: "pl-PL",
      append_to_response: "videos,reviews,watch/providers,credits",
    });
    const detail = mapDetail(movie);
    detail.filmwebUrl = await resolveFilmwebUrl(detail.title, detail.year, detail.originalTitle);

    return res.status(200).json({ movie: detail, demo: false });
  } catch (error) {
    return res.status(200).json({ movie: sampleDetail(id), demo: true, warning: String(error) });
  }
}
