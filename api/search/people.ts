import { samplePeople } from "../_sample";
import { hasTmdbToken, mapPerson, tmdbFetch } from "../_tmdb";

export default async function handler(req: any, res: any) {
  const query = String(req.query.query || "").trim();
  if (query.length < 2) return res.status(200).json({ people: [], demo: !hasTmdbToken() });

  if (!hasTmdbToken()) {
    const people = samplePeople.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));
    return res.status(200).json({ people, demo: true });
  }

  try {
    const data = await tmdbFetch<{ results: any[] }>("/search/person", {
      query,
      language: "pl-PL",
      include_adult: false,
      page: 1,
    });

    return res.status(200).json({ people: data.results.slice(0, 8).map(mapPerson), demo: false });
  } catch (error) {
    return res.status(500).json({ error: "Nie udało się wyszukać aktorów.", details: String(error) });
  }
}
