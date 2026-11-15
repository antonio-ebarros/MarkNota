export interface RecommendedFont {
  name: string;
  label: string;
  stack: string;
}

export const RECOMMENDED_FONTS: RecommendedFont[] = [
  { name: 'Inter', label: 'Inter', stack: "'Inter', 'Segoe UI', 'Noto Sans', sans-serif" },
  { name: 'Segoe UI', label: 'Segoe UI', stack: "'Segoe UI', 'Noto Sans', sans-serif" },
  { name: 'Noto Sans', label: 'Noto Sans', stack: "'Noto Sans', sans-serif" },
  { name: 'JetBrains Mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', 'Fira Code', monospace" },
  { name: 'Fira Code', label: 'Fira Code', stack: "'Fira Code', monospace" },
  { name: 'Ubuntu', label: 'Ubuntu', stack: "'Ubuntu', 'Noto Sans', sans-serif" },
  { name: 'Georgia', label: 'Georgia', stack: "'Georgia', 'Noto Serif', serif" },
  { name: 'Noto Serif', label: 'Noto Serif', stack: "'Noto Serif', serif" }
];

export function buildFontStack(fontName: string): string {
  const recommended = RECOMMENDED_FONTS.find((f) => f.name === fontName);
  if (recommended) return recommended.stack;
  const safe = fontName.replace(/'/g, "\\'");
  return `'${safe}', 'Noto Sans', sans-serif`;
}
