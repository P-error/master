#!/usr/bin/env bash
set -euo pipefail

# === Настройки ===
PROJECT_NAME="${PROJECT_NAME:-master-thesis-2025}"
TS="$(date +"%Y-%m-%d_%H-%M-%S")"
ARCHIVE_NAME="${PROJECT_NAME}-bundle-${TS}.zip"

# Список исключений (тяжёлые/кэш/сборка)
read -r -d '' EXCLUDES <<'EOF'
node_modules/**
.next/**
.out/**
dist/**
build/**
coverage/**
.vscode/**
.idea/**
.git/**
.gitignore
.vercel/cache/**
.turbo/**
.cache/**
.tmp/**
*.log
*.tmp
*.swp
.DS_Store
Thumbs.db
EOF

# Создаём краткий манифест файлов для удобства обзора (без тяжёлых папок)
echo "Генерирую MANIFEST.txt…"
# используем find вместо tree, чтобы не требовать дополнительных утилит
{
  echo "# Manifest snapshot (без тяжёлых директорий)"
  echo "# Создано: $(date)"
  echo
  # выводим до 5 уровней вложенности
  find . -maxdepth 5 -type f \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./.vercel/cache/*" \
    -not -path "./.turbo/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./coverage/*" \
    -not -name ".DS_Store" \
    | sort
} > MANIFEST.txt

# Проверяем наличие zip
if ! command -v zip >/dev/null 2>&1; then
  echo "❌ Утилита 'zip' не найдена. Установи её и перезапусти."
  echo "macOS:  brew install zip     | Ubuntu/Debian: sudo apt-get install zip"
  exit 1
fi

# Формируем список аргументов -x для zip
ZIP_EXCLUDES=()
while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue
  ZIP_EXCLUDES+=("-x" "$pattern")
done <<<"$EXCLUDES"

echo "Упаковываю проект в ${ARCHIVE_NAME}…"
# -r рекурсивно, -q тихо, -9 максимальная компрессия
zip -r -q -9 "$ARCHIVE_NAME" . "${ZIP_EXCLUDES[@]}"

# Дополнительный вывод размера
SIZE_BYTES=$(stat -f%z "$ARCHIVE_NAME" 2>/dev/null || stat -c%s "$ARCHIVE_NAME")
echo "✅ Готово: ${ARCHIVE_NAME} (${SIZE_BYTES} bytes)"
echo "В архив включены .env и прочие конфиги (по запросу), исключены только тяжёлые директории/кэш."
