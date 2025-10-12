// scripts/pack.mjs
// Кросс-платформенный сборщик архива проекта (без внешних бинарников).
// Использует archiver + fast-glob, создаёт MANIFEST.txt и zip с таймстампом.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function readPackageName() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
    if (pkg.name && typeof pkg.name === "string") return pkg.name.replace(/[^a-z0-9-_]/gi, "-");
  } catch {}
  return "project";
}

// Паттерны исключений (но .env и конфиги — включаем!)
const DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.out/**",
  "**/out/**",
  "**/dist/**",
  "**/build/**",
  "**/.vercel/cache/**",
  "**/.turbo/**",
  "**/.cache/**",
  "**/.tmp/**",
  "**/coverage/**",
  "**/.git/**",
  "**/.vscode/**",
  "**/.idea/**",
  "**/*.log",
  "**/*.tmp",
  "**/*.swp",
  "**/.DS_Store",
  "**/Thumbs.db",
];

const args = process.argv.slice(2);
const clean = args.includes("--clean"); // опционально — очистка старых архивов

const projectName = readPackageName();
const outName = `${projectName}-bundle-${ts()}.zip`;
const outPath = path.join(projectRoot, outName);

// Соберём список файлов (до 5 уровней — для скорости; можно убрать restriction если нужно)
const globOptions = {
  cwd: projectRoot,
  dot: true,
  onlyFiles: true,
  followSymbolicLinks: true,
  ignore: DEFAULT_EXCLUDES,
  unique: true,
};

(async () => {
  try {
    // (опционально) удалить предыдущие zip’ы
    if (clean) {
      const old = await fg([`${projectName}-bundle-*.zip`], { cwd: projectRoot, onlyFiles: true });
      for (const f of old) {
        try {
          fs.unlinkSync(path.join(projectRoot, f));
        } catch {}
      }
    }

    // Список файлов проекта
    const files = await fg(["**/*"], globOptions);

    if (files.length === 0) {
      console.error("Нечего архивировать (всё исключено?). Проверь EXCLUDES.");
      process.exit(2);
    }

    // MANIFEST.txt — снимок структуры
    const manifestPath = path.join(projectRoot, "MANIFEST.txt");
    const manifestLines = [
      `# Manifest snapshot`,
      `# Created: ${new Date().toISOString()}`,
      `# Included files (excluding heavy dirs):`,
      ``,
      ...files.sort(),
      ``,
    ];
    fs.writeFileSync(manifestPath, manifestLines.join("\n"), "utf8");

    // Добавим MANIFEST в список
    const filesWithManifest = [...files, path.relative(projectRoot, manifestPath)];

    // Создаём zip
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const bytes = archive.pointer();
      console.log(`✅ Готово: ${outName} (${bytes} bytes)`);
    });
    archive.on("warning", (err) => {
      // предупреждения не фатальны, но покажем
      console.warn("Warn:", err.message || err);
    });
    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Добавляем файлы
    for (const rel of filesWithManifest) {
      const abs = path.join(projectRoot, rel);
      archive.file(abs, { name: rel.replace(/^[.][/\\]?/, "") });
    }

    await archive.finalize();
  } catch (e) {
    console.error("❌ Ошибка упаковки:", e?.message || e);
    process.exit(1);
  }
})();
