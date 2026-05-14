-- Один и тот же числовой id в Keitaro может быть у landing_page и у offer — разделяем по record_type.
DROP INDEX IF EXISTS "landings_keitaro_id_key";
CREATE UNIQUE INDEX "landings_keitaro_id_record_type_key" ON "landings"("keitaro_id", "record_type");
