BEGIN;

-- 1) Добавляем/инициализируем updatedAt/createdAt (без падений на непустых таблицах)

-- Subject.createdAt (если Prisma уже добавлял - этот ADD COLUMN может выстрелить;
-- обычно миграция соответствует схеме, но если поле уже есть, пропустите этот шаг вручную.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Subject' AND column_name='createdAt'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."Subject" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Subject' AND column_name='updatedAt'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."Subject" ADD COLUMN "updatedAt" TIMESTAMP(3);';
    EXECUTE 'UPDATE "public"."Subject" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;';
    EXECUTE 'ALTER TABLE "public"."Subject" ALTER COLUMN "updatedAt" SET NOT NULL;';
  END IF;
END$$;

-- User.createdAt/updatedAt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='"User"' AND column_name='createdAt'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='"User"' AND column_name='updatedAt'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."User" ADD COLUMN "updatedAt" TIMESTAMP(3);';
    EXECUTE 'UPDATE "public"."User" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;';
    EXECUTE 'ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" SET NOT NULL;';
  END IF;
END$$;

-- 2) Конверсия QuestionTagResult.tags -> text[] ЧЕРЕЗ ВРЕМЕННУЮ КОЛОНКУ (без подзапросов в USING)

-- Добавляем временную колонку с дефолтом пустого массива
ALTER TABLE "public"."QuestionTagResult"
  ADD COLUMN "tags_tmp" text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Заполняем tags_tmp из старого tags (jsonb/text/string)
UPDATE "public"."QuestionTagResult" qtr
SET "tags_tmp" = (
  CASE
    WHEN qtr."tags" IS NULL THEN ARRAY[]::text[]
    WHEN pg_typeof(qtr."tags")::text = 'jsonb' THEN
      CASE jsonb_typeof((qtr."tags")::jsonb)
        WHEN 'array' THEN (
          SELECT COALESCE(array_agg(elem::text), ARRAY[]::text[])
          FROM jsonb_array_elements((qtr."tags")::jsonb) AS elem
        )
        WHEN 'string' THEN ARRAY[((qtr."tags")::text)]
        ELSE ARRAY[]::text[]
      END
    WHEN pg_typeof(qtr."tags")::text = 'text' THEN
      CASE
        WHEN jsonb_typeof((qtr."tags")::jsonb) = 'array' THEN (
          SELECT COALESCE(array_agg(elem::text), ARRAY[]::text[])
          FROM jsonb_array_elements((qtr."tags")::jsonb) AS elem
        )
        ELSE ARRAY[((qtr."tags")::text)]
      END
    ELSE ARRAY[]::text[]
  END
);

-- Удаляем старый столбец и переименовываем временный
ALTER TABLE "public"."QuestionTagResult" DROP COLUMN "tags";
ALTER TABLE "public"."QuestionTagResult" RENAME COLUMN "tags_tmp" TO "tags";

-- 3) Уникальный индекс Subject(name,userId)
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_name_userId_key"
  ON "public"."Subject"("name","userId");

COMMIT;
