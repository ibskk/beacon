export type City = {
  name: string;
  lat: number;
  lng: number;
};

export const CITIES: readonly City[] = [
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Mississauga', lat: 43.589, lng: -79.6441 },
  { name: 'Ottawa', lat: 45.4215, lng: -75.6972 },
  { name: 'Montreal', lat: 45.5019, lng: -73.5674 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Calgary', lat: 51.0447, lng: -114.0719 },
];

export const DEFAULT_CITY = CITIES[0];

export function findCity(name: string | null | undefined): City {
  return CITIES.find((c) => c.name === name) ?? DEFAULT_CITY;
}

/** Nearest supported city to a coordinate, used to tag new games and groups. */
export function nearestCity(lat: number, lng: number): City {
  let best = DEFAULT_CITY;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}
