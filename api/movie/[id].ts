import { sampleDetail } from "../_sample";
import { hasTmdbToken, mapDetail, tmdbFetch } from "../_tmdb";

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
    return res.status(200).json({ movie: mapDetail(movie), demo: false });
  } catch (error) {
    return res.status(200).json({ movie: sampleDetail(id), demo: true, warning: String(error) });
  }
}
