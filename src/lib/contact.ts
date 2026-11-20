// People to reach about Kanta (Settings → Contact).
export type Contact = { name: string; email: string };

export const CONTACTS: Contact[] = [
  { name: 'Timothy Borja', email: 'timothyborja28@gmail.com' },
  { name: 'Jonathan De Jesus', email: 'durocabeza@gmail.com' },
];

export function mailtoUrl(email: string, subject = 'Kanta'): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
