-- CreateTable
CREATE TABLE "counters" (
    "key" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "counters_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL,
    "login" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landings" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "group_name" TEXT NOT NULL DEFAULT 'default',
    "record_type" VARCHAR(20) NOT NULL DEFAULT 'offer',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "roi" DOUBLE PRECISION,
    "conversion" DOUBLE PRECISION,
    "cr" DOUBLE PRECISION,
    "crc" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "landings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_catalog" (
    "id" SERIAL NOT NULL,
    "widget_key" TEXT NOT NULL,
    "widget_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "widget_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_catalog" (
    "id" SERIAL NOT NULL,
    "script_key" TEXT NOT NULL,
    "script_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "script_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widgets" (
    "id" INTEGER NOT NULL,
    "landing_id" INTEGER NOT NULL,
    "widget_key" TEXT NOT NULL,
    "widget_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts" (
    "id" INTEGER NOT NULL,
    "landing_id" INTEGER NOT NULL,
    "script_key" TEXT NOT NULL,
    "script_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL,
    "landing_id" INTEGER NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" INTEGER NOT NULL,
    "landing_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_key" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_templates" (
    "entity" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "body" BYTEA NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entity_templates_pkey" PRIMARY KEY ("entity","template_key")
);

-- CreateTable
CREATE TABLE "filter_presets" (
    "id" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "saved_from_context" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "filter_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_smoke_logs" (
    "id" SERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "queue_smoke_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "widget_catalog_widget_key_key" ON "widget_catalog"("widget_key");

-- CreateIndex
CREATE UNIQUE INDEX "script_catalog_script_key_key" ON "script_catalog"("script_key");

-- CreateIndex
CREATE INDEX "widgets_landing_id_idx" ON "widgets"("landing_id");

-- CreateIndex
CREATE UNIQUE INDEX "widgets_landing_id_widget_key_key" ON "widgets"("landing_id", "widget_key");

-- CreateIndex
CREATE INDEX "scripts_landing_id_idx" ON "scripts"("landing_id");

-- CreateIndex
CREATE UNIQUE INDEX "scripts_landing_id_script_key_key" ON "scripts"("landing_id", "script_key");

-- CreateIndex
CREATE INDEX "settings_landing_id_idx" ON "settings"("landing_id");

-- CreateIndex
CREATE INDEX "history_landing_id_idx" ON "history"("landing_id");

-- CreateIndex
CREATE INDEX "history_user_id_idx" ON "history"("user_id");

-- CreateIndex
CREATE INDEX "filter_presets_context_created_idx" ON "filter_presets"("context", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "landings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "landings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "landings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "landings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
