#!/usr/bin/env bash
set -euo pipefail

# === Config ===
OUT_BASE_DIR="dumps"
DEFAULT_LIMIT=""   # оставьте пусто для полного дампа; можно поставить LIMIT через COPY в CSV (не рекомендуется)

# === Helpers ===
fail() { echo "Error: $*" >&2; exit 1; }
info() { echo "[*] $*"; }
ok()   { echo "[✓] $*"; }

# Find project root (directory where script is executed is fine)
PROJECT_ROOT="$(pwd)"

# Try to read DATABASE_URL from .env.local or .env (without sourcing arbitrary code)
ENV_FILES=("$PROJECT_ROOT/.env.local" "$PROJECT_ROOT/.env")
DATABASE_URL=""
for f in "${ENV_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    # read first non-comment DATABASE_URL= line
    line="$(grep -E '^\s*DATABASE_URL\s*=' "$f" | head -n1 || true)"
    if [[ -n "$line" ]]; then
      # strip quotes; keep everything after first =
      val="${line#*=}"
      # trim spaces and surrounding quotes
      val="$(echo "$val" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' | sed -E 's/^["'\'']|["'\'']$//g')"
      if [[ -n "$val" ]]; then
        DATABASE_URL="$val"
        info "DATABASE_URL найден в $(basename "$f")"
        break
      fi
    fi
  fi
done

[[ -z "${DATABASE_URL}" ]] && fail "DATABASE_URL не найден ни в .env.local, ни в .env"

# Make unpooled URL for Neon (remove -pooler and pgbouncer=true)
UNPOOLED_URL="$(echo "$DATABASE_URL" \
  | sed 's/-pooler//g' \
  | sed -E 's/([?&])pgbouncer=true(\&)?/\1/g' \
  | sed -E 's/[?&]$//g')"

# Dependencies
command -v pg_dump >/dev/null 2>&1 || fail "pg_dump не найден. Установите: sudo pacman -S postgresql"
command -v psql    >/dev/null 2>&1 || fail "psql не найден. Установите: sudo pacman -S postgresql"

# Output dir
TS="$(date +%F_%H-%M-%S)"
OUT_DIR="$OUT_BASE_DIR/$TS"
mkdir -p "$OUT_DIR"

info "Проверяю подключение..."
psql "$UNPOOLED_URL" -c "SELECT now();" >/dev/null
ok "Подключение к БД установлено"

# === 1) Дамп данных (INSERT) ===
info "Экспорт данных (INSERT)…"
pg_dump "$UNPOOLED_URL" \
  --no-owner --no-privileges \
  --format=plain --encoding=UTF8 \
  --data-only --column-inserts \
  -f "$OUT_DIR/data.sql"
ok "Готово: $OUT_DIR/data.sql"

# === 2) Дамп схемы ===
info "Экспорт схемы…"
pg_dump "$UNPOOLED_URL" \
  --no-owner --no-privileges \
  --format=plain --encoding=UTF8 \
  --schema-only \
  -f "$OUT_DIR/schema.sql"
ok "Готово: $OUT_DIR/schema.sql"

# === 3) Полный дамп (схема+данные) ===
info "Полный дамп (plain)…"
pg_dump "$UNPOOLED_URL" \
  --no-owner --no-privileges \
  --format=plain --encoding=UTF8 \
  --column-inserts \
  -f "$OUT_DIR/full_dump.sql"
ok "Готово: $OUT_DIR/full_dump.sql"

# === 4) CSV по всем таблицам public ===
info "Экспорт CSV по таблицам…"
TABLES=$(psql "$UNPOOLED_URL" -Atc "SELECT tablename FROM pg_tables WHERE schemaname='public';")
CSV_DIR="$OUT_DIR/csv"
mkdir -p "$CSV_DIR"

# Для имён с заглавными буквами/кавычками используем кавычки
while IFS= read -r t; do
  [[ -z "$t" ]] && continue
  out="$CSV_DIR/${t}.csv"
  # COPY через \copy (клиентская команда) в локальный файл
  psql "$UNPOOLED_URL" -c "\copy \"${t}\" to '${out}' csv header"
  ok "CSV: ${out}"
done <<< "$TABLES"

# === 5) Мини-маскирование чувствительных полей (опционально) ===
# Пример: сделать копию User.csv с NULL вместо password
USER_CSV="$CSV_DIR/User.csv"
if [[ -f "$USER_CSV" ]]; then
  info "Создаю маскированную версию User (пароли -> NULL)…"
  psql "$UNPOOLED_URL" -c "\copy (
    SELECT id, login, NULL::text as password, email, age, \"educationLevel\", \"learningGoal\",
           \"learningStyle\", \"preferredFormat\", \"preferredTone\", \"detailLevel\", \"priorKnowledge\",
           \"languageLevel\", \"darkMode\", \"accessibleMode\", \"fontSize\"
    FROM \"User\"
  ) TO '${CSV_DIR}/User_masked.csv' CSV HEADER"
  ok "CSV (masked): ${CSV_DIR}/User_masked.csv"
fi

# === 6) Короткая сводка ===
echo
echo "==== Итоги ===="
echo "Папка дампа: $OUT_DIR"
echo " - data.sql           (только данные, INSERT)"
echo " - schema.sql         (схема)"
echo " - full_dump.sql      (схема+данные)"
echo " - csv/*.csv          (таблицы по отдельности)"
echo
ok "Готово. Можете отправлять мне $OUT_DIR/data.sql (или всю папку $OUT_DIR)."

