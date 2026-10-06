export type ImportItem = { name: string; description: string; weight: string; price: number; category: string; image: string; popular: boolean };
export type ImportPreview = { items: ImportItem[]; errors: number };

type Row = Record<string, unknown>;
const columns = ["name", "description", "weight", "price", "category", "image", "popular"];
const popularValues = ["1", "true", "yes", "y", "да"];

export function csvTemplate(): string {
  return [columns.join(","), "Филадельфия классик,Лосось и сливочный сыр,250 г,390,Роллы,https://example.com/roll.jpg,true", "Мисо суп,Тофу и водоросли,300 г,180,Супы,,false"].join("\n");
}
export function parseMenuFile(text: string, fileName: string): ImportPreview {
  const head = text.trimStart();
  const rows = fileName.toLowerCase().endsWith(".json") || head.startsWith("[") || head.startsWith("{") ? parseJson(text) : parseCsv(text);
  const items: ImportItem[] = []; let errors = 0;
  for (const row of rows) { const item = normalize(row); if (item) items.push(item); else errors++; }
  return { items, errors };
}
function parseJson(text: string): Row[] {
  const parsed = JSON.parse(text.replace(/^\uFEFF/, "")) as unknown;
  const list = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { products?: unknown }).products) ? (parsed as { products: unknown[] }).products : [];
  return list.filter((entry) => typeof entry === "object" && entry !== null) as Row[];
}
function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitLine(lines[0], delimiter).map((cell) => cell.trim().toLowerCase());
  const named = header.includes("name");
  return lines.slice(named ? 1 : 0).map((line) => {
    const cells = splitLine(line, delimiter);
    const row: Row = {};
    columns.forEach((column, index) => { row[column] = named ? cells[header.indexOf(column)] : cells[index]; });
    return row;
  });
}
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { cells.push(cell); cell = ""; }
    else cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}
function normalize(row: Row): ImportItem | null {
  const text = (key: string) => String(row[key] ?? "").trim();
  const name = text("name"); const priceRaw = text("price").replace(",", ".");
  const price = Number(priceRaw); const image = text("image");
  if (!name || !priceRaw || !Number.isFinite(price)) return null;
  if (image.startsWith("data:") || image.length > 500) return null;
  return { name, description: text("description"), weight: text("weight"), price, category: text("category") || "Без категории", image, popular: popularValues.includes(text("popular").toLowerCase()) };
}
