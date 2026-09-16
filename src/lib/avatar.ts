// Avatar derivado do id do perfil: mesma entrada gera sempre a mesma cor + mascote.
// Sem coluna nova no banco, sem coleta nova, sem foto: só ajuda a criança a se reconhecer.
const COLORS = ["#eea047", "#015ca6", "#d96953", "#f3c44b", "#26578c", "#7db8e8"];
const GLYPHS = ["🏀", "🦁", "🐢", "⚡", "🌊", "⭐", "🐒", "🦊"];

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i++) value = (value * 31 + input.charCodeAt(i)) >>> 0;
  return value;
}

export function avatarFor(id: string): { background: string; glyph: string } {
  const value = hash(id);
  return { background: COLORS[value % COLORS.length], glyph: GLYPHS[Math.floor(value / COLORS.length) % GLYPHS.length] };
}
