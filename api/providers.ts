import { sampleProviders } from "./_sample";
import { hasTmdbToken, mapProvider, tmdbFetch } from "./_tmdb";

const preferredProviderNames = [
  "Netflix",
  "Max",
  "HBO Max",
  "Amazon Prime Video",
  "Prime Video",
  "Disney Plus",
  "Apple TV Plus",
  "SkyShowtime",
  "Canal+",
  "Player",
  "TVP VOD",
  "Paramount Plus",
];

export default async function handler(_req: any, res: any) {
  if (!hasTmdbToken()) {
    return res.status(200).json({ providers: sampleProviders, demo: true });
  }

  try {
    const data = await tmdbFetch<{ results: any[] }>("/watch/providers/movie", {
      language: "pl-PL",
      watch_region: "PL",
    });
    const providers = data.results
      .filter((provider) =>
        preferredProviderNames.some((name) => provider.provider_name.toLowerCase().includes(name.toLowerCase())),
      )
      .map(mapProvider)
      .slice(0, 14);

    return res.status(200).json({ providers, demo: false });
  } catch (error) {
    return res.status(200).json({ providers: sampleProviders, demo: true, warning: String(error) });
  }
}
