/**
 * Bulgarian labels for the english-keyed rows in the `User Roles` table.
 * The DB stores canonical english names so integrations have a stable
 * identifier; the UI translates on render. If a role isn't in the map,
 * the raw name is returned so new roles still show up safely.
 */
export const ROLE_BG: Record<string, string> = {
  "Super Administrator": "Супер администратор",
  Administrator: "Администратор",
  Mayor: "Кмет",
  "Deputy Mayor": "Заместник-кмет",
  "Chief Architect": "Главен архитект",
  "Municipal Mayor": "Районен кмет",
  "Municipal Manager": "Районен управител",
  "Municipal Employee": "Районен служител",
  "Municipal Chief Architect": "Районен главен архитект",
  Citizen: "Гражданин",
  "City Council": "Общински съвет",
  Partner: "Партньор",
};

export function translateRole(name: string | undefined | null): string {
  if (!name) return "";
  return ROLE_BG[name] ?? name;
}
