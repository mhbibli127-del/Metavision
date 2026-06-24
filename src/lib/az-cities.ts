/** Azərbaycan şəhərləri — xəritə və bazar analitikası */
export const AZ_CITIES = [
  { id: "baku", name: "Bakı", near: "Baku, Azerbaijan", lat: 40.4093, lng: 49.8671 },
  { id: "ganja", name: "Gəncə", near: "Ganja, Azerbaijan", lat: 40.6828, lng: 46.3606 },
  { id: "sumgait", name: "Sumqayıt", near: "Sumgayit, Azerbaijan", lat: 40.5897, lng: 49.6686 },
  { id: "lankaran", name: "Lənkəran", near: "Lankaran, Azerbaijan", lat: 38.7543, lng: 48.8506 },
  { id: "sheki", name: "Şəki", near: "Sheki, Azerbaijan", lat: 41.1919, lng: 47.1706 },
  { id: "mingachevir", name: "Mingəçevir", near: "Mingachevir, Azerbaijan", lat: 40.7703, lng: 47.0489 },
  { id: "shirvan", name: "Şirvan", near: "Shirvan, Azerbaijan", lat: 39.9378, lng: 48.929 },
] as const;

export type AzCityId = (typeof AZ_CITIES)[number]["id"];

export function getCityById(id: string) {
  return AZ_CITIES.find((c) => c.id === id) ?? AZ_CITIES[0];
}

export function getCityByName(name: string) {
  return AZ_CITIES.find((c) => c.name === name || c.near.startsWith(name)) ?? AZ_CITIES[0];
}
