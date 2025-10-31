#!/usr/bin/env bash
set -euo pipefail

# =========================
#  Bundle maker (v2, no eval)
# =========================
PROJECT_NAME="${PROJECT_NAME:-master-thesis-2025}"
TS="$(date +"%Y-%m-%d_%H-%M-%S")"
ARCHIVE_NAME="${PROJECT_NAME}-bundle-${TS}.zip"

# Проверка zip
if ! command -v zip >/dev/null 2>&1; then
  echo "❌ 'zip' не найден. Arch: sudo pacman -S zip | Debian/Ubuntu: sudo apt-get install zip | macOS: brew install zip"
  exit 1
fi

WORKDIR="$(pwd)"
LIST_FILE="${WORKDIR}/.bundle_filelist.txt"
MANIFEST="${WORKDIR}/MANIFEST.txt"
STATS="${WORKDIR}/STATS.txt"
: > "$LIST_FILE"

# 1) Корневые полезные файлы
ROOT_KEEP=( package.json package-lock.json yarn.lock pnpm-lock.yaml bun.lockb
  README.md README README.rst README.txt LICENSE LICENSE.txt
  next.config.js next.config.mjs next.config.ts
  tsconfig.json tsconfig.base.json
  tailwind.config.js tailwind.config.cjs tailwind.config.mjs tailwind.config.ts
  postcss.config.js postcss.config.cjs postcss.config.mjs postcss.config.ts
  eslint.config.js eslint.config.cjs eslint.config.mjs eslint.config.ts .eslintrc .eslintrc.* 
  .prettierrc .prettierrc.* prettier.config.js prettier.config.cjs
  .editorconfig
  vercel.json .vercel/project.json
  vite.config.* turbo.json biome.json
  jest.config.* vitest.config.* playwright.config.*
  Dockerfile docker-compose.yml docker-compose.yaml .dockerignore
  Makefile
)
for f in "${ROOT_KEEP[@]}"; do
  for p in $f; do
    [[ -e "$p" ]] && echo "./$p" >> "$LIST_FILE"
  done
done

# 2) Директории, которые включаем
INCLUDE_DIRS=(
  "./app" "./pages" "./src" "./components" "./lib" "./utils" "./hooks" "./styles"
  "./public" "./prisma" "./scripts" "./api" "./server" "./config" "./database"
  "./migrations" "./tests" "./e2e" "./docs" "./.github" "./.vscode"
)

# 3) Глобальные исключения путей (во всех вложениях)
EXCLUDE_PATHS=(
  "./node_modules/*" "./*/node_modules/*"
  "./.git/*"         "./*/.git/*"
  "./.next/*"        "./*/.next/*"
  "./dist/*"         "./*/dist/*"
  "./build/*"        "./*/build/*"
  "./coverage/*"     "./*/coverage/*"
  "./.vercel/cache/*" "./*/.vercel/cache/*"
  "./.vercel/output/*" "./*/.vercel/output/*"
  "./.turbo/*"       "./*/.turbo/*"
  "./.cache/*"       "./*/.cache/*"
  "./.parcel-cache/*" "./*/.parcel-cache/*"
  "./.vite/*"        "./*/.vite/*"
  "./storybook-static/*" "./*/storybook-static/*"
  "./.svelte-kit/*"  "./*/.svelte-kit/*"
  "./.pnpm-store/*"  "./*/.pnpm-store/*"
)

# 4) Шаблоны файлов для исключения
EXCLUDE_FILE_PATTERNS=( "*.log" "*.tmp" "*.swp" "*.swo" ".DS_Store" "Thumbs.db" )

# Функция: добавить файлы из каталога с исключениями путей
add_dir_files() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0

  # строим массив аргументов -not -path ...
  local find_args=()
  for pat in "${EXCLUDE_PATHS[@]}"; do
    find_args+=( -not -path "$pat" )
  done
  for pat in "${EXCLUDE_FILE_PATTERNS[@]}"; do
    find_args+=( -not -name "$pat" )
  done

  find "$dir" -type f "${find_args[@]}" -print >> "$LIST_FILE"
}

# Добавляем из всех include-директорий
for d in "${INCLUDE_DIRS[@]}"; do
  add_dir_files "$d"
done

# 5) Добавляем все .env* вне исключённых путей
add_envs() {
  local find_args=()
  for pat in "${EXCLUDE_PATHS[@]}"; do
    find_args+=( -not -path "$pat" )
  done
  for pat in "${EXCLUDE_FILE_PATTERNS[@]}"; do
    find_args+=( -not -name "$pat" )
  done
  find . -type f \( -name ".env" -o -name ".env.*" \) "${find_args[@]}" -print >> "$LIST_FILE"
}
add_envs

# 6) Очистка списка: существующие файлы + uniq + sort
TMP_LIST="${LIST_FILE}.tmp"
awk '{sub(/^.\//,""); print $0}' "$LIST_FILE" \
  | while IFS= read -r p; do [[ -f "$p" ]] && echo "./$p"; done \
  | sort -u > "$TMP_LIST"
mv "$TMP_LIST" "$LIST_FILE"

# 7) MANIFEST
echo "Генерирую ${MANIFEST}…"
{
  echo "# Manifest snapshot"
  echo "# Создано: $(date)"
  echo "# Архив: ${ARCHIVE_NAME}"
  echo
  sed 's|^\./||' "$LIST_FILE" | sort
} > "$MANIFEST"

# 8) STATS
echo "Генерирую ${STATS}…"
{
  echo "# File type stats (по расширениям)"
  echo
  sed 's|^\./||' "$LIST_FILE" \
  | awk -F. '{ if (NF>1) print $NF; else print "(noext)"; }' \
  | sort | uniq -c | sort -nr

  echo
  echo "# Top 30 largest files (KiB)"
  sed 's|^\./||' "$LIST_FILE" \
    | xargs -I{} sh -c 'test -f "{}" && du -k "{}"' 2>/dev/null \
    | sort -nr | head -n 30
} > "$STATS"

# 9) Упаковка
echo "Упаковываю проект в ${ARCHIVE_NAME}…"
zip -q -9 "$ARCHIVE_NAME" -@ < "$LIST_FILE"
zip -q -9 "$ARCHIVE_NAME" "$MANIFEST" "$STATS"

# 10) Сводка
SIZE_BYTES=$( { stat -f%z "$ARCHIVE_NAME" 2>/dev/null || stat -c%s "$ARCHIVE_NAME"; } )
COUNT_FILES=$(wc -l < "$LIST_FILE" | tr -d '[:space:]')

echo "✅ Готово: ${ARCHIVE_NAME}"
echo "   Размер: ${SIZE_BYTES} bytes"
echo "   Файлов: ${COUNT_FILES} (+ MANIFEST.txt, STATS.txt)"
echo
echo "Отправляй ${ARCHIVE_NAME} — там есть всё для полного ревью."
