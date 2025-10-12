#!/usr/bin/env bash
set -euo pipefail

# === Настройки ===
OUT_NAME="project-ui-bundle-$(date +'%Y-%m-%d_%H-%M').zip"
WORKDIR="$(pwd)"
STAGING="$(mktemp -d -t ui_bundle_XXXXXX)"

# Проверим, что мы в корне (должен быть package.json)
if [[ ! -f "$WORKDIR/package.json" ]]; then
  echo "❌ Не найден package.json. Запусти скрипт из корня проекта."
  exit 1
fi

echo "📦 Подготовка staging директории: $STAGING"

# Создадим базовые папки
mkdir -p "$STAGING"

# === Список include/exclude для rsync ===
# Мы бережно собираем только то, что нужно для UI и контрактов API.
# Включаем: src/* (pages, components, styles, api, lib, hooks, types), public/*, конфиги, prisma/schema.prisma
# Исключаем: node_modules, .next, .git, .vercel, любые .env*, сборочные артефакты.
INCLUDE_FILE="$STAGING/rsync-include.txt"
EXCLUDE_FILE="$STAGING/rsync-exclude.txt"

cat > "$INCLUDE_FILE" <<'EOF'
# === include ===
/src/
/src/***
/public/***
/prisma/schema.prisma
/prisma/migrations/***        # опционально — если нужны для контекста
/package.json
/pnpm-lock.yaml
/package-lock.json
/yarn.lock
/tsconfig.json
/next.config.js
/next.config.mjs
/next.config.ts
/tailwind.config.js
/tailwind.config.cjs
/tailwind.config.ts
/postcss.config.js
/postcss.config.cjs
/postcss.config.ts
/README.md
EOF

cat > "$EXCLUDE_FILE" <<'EOF'
# === exclude ===
/node_modules/***
/.next/***
/dist/***
/build/***
/coverage/***
/out/***
/.vercel/***
/.git/***
/.gitignore
/.env
/.env.*
/prisma/.env
**/*.log
**/*.DS_Store
EOF

# Копируем проект в staging по правилам
rsync -a --prune-empty-dirs \
  --include-from="$INCLUDE_FILE" \
  --exclude-from="$EXCLUDE_FILE" \
  "$WORKDIR"/ "$STAGING"/

# Сформируем MANIFEST, чтобы было видно, что именно ушло в архив
echo "🧾 Генерирую MANIFEST..."
(
  cd "$STAGING"
  {
    echo "# MANIFEST — файлы, включённые в архив"
    echo "# Сгенерировано: $(date -Iseconds)"
    echo
    find . -type f | sed 's|^\./||' | sort
  } > MANIFEST.txt
)

# Проверим минимальный набор
REQUIRED=(
  "src/pages"
  "src/components"
  "tailwind.config.js"
  "postcss.config.js"
  "package.json"
)
MISSING=0
for p in "${REQUIRED[@]}"; do
  if [[ ! -e "$STAGING/$p" ]]; then
    echo "⚠️  Внимание: не найдено $p в собранном пакете (возможно у тебя другой путь или имя файла)."
    MISSING=1
  fi
done

# Упаковываем zip с максимальной компрессией
echo "🗜️  Упаковка в zip: $OUT_NAME"
(
  cd "$STAGING"
  zip -9 -r "$WORKDIR/$OUT_NAME" . >/dev/null
)

echo
echo "✅ Готово! Архив: $WORKDIR/$OUT_NAME"
echo "📄 MANIFEST внутри архива содержит полный список файлов."

if [[ "$MISSING" -eq 1 ]]; then
  echo
  echo "ℹ️  Похоже, часть стандартных путей отсутствует. Это не критично,"
  echo "    но если что-то забудется — я скажу, и мы добавим паттерн в скрипт."
fi

# Подсказка по весу
ARCHIVE_SIZE=$(du -h "$WORKDIR/$OUT_NAME" | awk '{print $1}')
echo "📦 Размер архива: $ARCHIVE_SIZE"

# Уберём staging
rm -rf "$STAGING"
