-- Keitaro + autoincrement id для landings (совместимость с существующими FK).

ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "keitaro_id" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "landings_keitaro_id_key" ON "landings"("keitaro_id");

ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "group_id" INTEGER;
ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "local_path" TEXT;
ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "preview_path" TEXT;
ALTER TABLE "landings" ADD COLUMN IF NOT EXISTS "landing_type" TEXT;

ALTER TABLE "landings" ALTER COLUMN "roi" TYPE DECIMAL(10,2) USING ("roi"::numeric);
ALTER TABLE "landings" ALTER COLUMN "conversion" TYPE DECIMAL(10,2) USING ("conversion"::numeric);
ALTER TABLE "landings" ALTER COLUMN "cr" TYPE DECIMAL(10,2) USING ("cr"::numeric);
ALTER TABLE "landings" ALTER COLUMN "crc" TYPE DECIMAL(10,2) USING ("crc"::numeric);

CREATE SEQUENCE IF NOT EXISTS "landings_id_seq";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "landings" LIMIT 1) THEN
    PERFORM setval('landings_id_seq', (SELECT COALESCE(MAX("id"), 1) FROM "landings"));
  ELSE
    PERFORM setval('landings_id_seq', 1, false);
  END IF;
END $$;
ALTER TABLE "landings" ALTER COLUMN "id" SET DEFAULT nextval('landings_id_seq');
ALTER SEQUENCE "landings_id_seq" OWNED BY "landings"."id";
