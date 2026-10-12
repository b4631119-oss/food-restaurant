// Путь к service account для скриптов миграции.
// Берётся ТОЛЬКО из аргумента --service-account или переменной окружения
// GOOGLE_APPLICATION_CREDENTIALS. Значения по умолчанию внутри репозитория нет:
// ключ должен лежать вне проекта, чтобы случайно не попасть в git.
import { readFile } from "node:fs/promises";
import path from "node:path";

const FLAG = "--service-account=";

export function serviceAccountPath(argv = process.argv.slice(2)) {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--service-account" && argv[index + 1]) return argv[index + 1];
    if (argv[index].startsWith(FLAG)) return argv[index].slice(FLAG.length);
  }
  return process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
}

export async function loadServiceAccount(argv = process.argv.slice(2)) {
  const filePath = serviceAccountPath(argv);
  if (!filePath) {
    console.error("Не задан путь к ключу. Укажите файл вне репозитория: GOOGLE_APPLICATION_CREDENTIALS=/path/key.json или --service-account /path/key.json");
    process.exit(1);
  }
  let raw;
  try {
    raw = await readFile(path.resolve(filePath), "utf8");
  } catch {
    console.error(`Не удалось прочитать файл ключа: ${path.resolve(filePath)}`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.error("Файл ключа не является корректным JSON.");
    process.exit(1);
  }
}
