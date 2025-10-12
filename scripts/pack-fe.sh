#!/usr/bin/env bash
set -euo pipefail

# Имя архива можно передать первым аргументом:
#   ./scripts/pack-fe.sh my-bundle
# По умолчанию: student-assistant-web-bundle-YYYY-MM-DD_HH-MM-SS.zip
NAME="${1:-student-assistant-web-bundle-$(date +%F_%H-%M-%S)}"
OUT="${NAME}.zip"

# Корень репозитория (папка выше scripts/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ Packing frontend into ${OUT}"

# Список путей/файлов, которые полезно включить
INCLUDE=(
  "src/pages"
  "src/components"
  "src/lib"
  "src/styles"
  "public"
  "package.json"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
  "tsconfig.json"
  "next.config.*"
  "tailwind.config.*"
  "postcss.config.*"
  ".env.example"
  "README.md"
)

# Паттерны для исключения
EXCLUDE=(
  "node_modules/*"
  ".next/*"
  ".git/*"
  "**/*.DS_Store"
  "**/*.map"
  "**/*.log"
)

# Собираем флаги для zip
ZIP_ARGS=()
for item in "${INCLUDE[@]}"; do
  # добавляем только те, что существуют, чтобы zip не ругался
  if compgen -G "$item" > /dev/null; then
    ZIP_ARGS+=("$item")
  fi
done
for pat in "${EXCLUDE[@]}"; do
  ZIP_ARGS+=(-x "$pat")
done

# Упаковка
zip -r -q "$OUT" "${ZIP_ARGS[@]}"

echo "✓ Created $OUT"
