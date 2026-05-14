-- PK landings.id = keitaro_id для записей из Keitaro (как ID в админке Keitaro).
-- Дочерние таблицы ссылаются на landings(id) с ON UPDATE CASCADE.

SELECT setval('landings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM landings));

DO $$
DECLARE
  moved int;
BEGIN
  LOOP
    UPDATE landings blocker
    SET id = nextval('landings_id_seq')
    FROM landings need
    WHERE need.keitaro_id IS NOT NULL
      AND need.id <> need.keitaro_id
      AND blocker.id = need.keitaro_id
      AND blocker.id <> need.id;
    GET DIAGNOSTICS moved = ROW_COUNT;
    EXIT WHEN moved = 0;
  END LOOP;
END $$;

UPDATE landings
SET id = keitaro_id
WHERE keitaro_id IS NOT NULL
  AND id <> keitaro_id;

SELECT setval('landings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM landings));
