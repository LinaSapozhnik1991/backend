/**
 * Одноразовая миграция данных из MySQL (crm_landings) в MongoDB (MONGO_URI).
 * Требует DB_* в .env для чтения MySQL и MONGO_URI для записи.
 * Запуск из каталога backend: npm run db:migrate-mysql-to-mongo
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t === "" || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function setCounter(db, key, maxSeq) {
  await db.collection("counters").replaceOne({ _id: key }, { _id: key, seq: maxSeq }, { upsert: true });
}

function maxId(rows, idField = "id") {
  if (!rows || rows.length === 0) return 0;
  return Math.max(...rows.map((r) => Number(r[idField]) || 0));
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  const env = loadEnv(envPath);
  const mongoUri = env.MONGO_URI || "mongodb://127.0.0.1:27017/crm_landings_mongo";
  const host = env.DB_HOST || "127.0.0.1";
  const port = Number(env.DB_PORT || 3306);
  const database = env.DB_NAME || "crm_landings";
  const user = env.DB_USER || "root";
  const password = env.DB_PASSWORD ?? "";

  if (!fs.existsSync(envPath)) {
    console.error("Нет backend/.env");
    process.exit(1);
  }

  const sql = await mysql.createConnection({ host, port, user, password, database });
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const cols = [
    "users",
    "landings",
    "widget_catalog",
    "script_catalog",
    "widgets",
    "scripts",
    "settings",
    "history",
    "entity_templates"
  ];
  for (const c of cols) {
    await db.collection(c).deleteMany({});
  }
  await db.collection("counters").deleteMany({});

  try {
    const [users] = await sql.query("SELECT id, login, password_hash AS passwordHash, role, created_at AS createdAt FROM users");
    if (users.length) {
      await db.collection("users").insertMany(
        users.map((u) => ({
          _id: u.id,
          login: u.login,
          passwordHash: u.passwordHash,
          role: u.role,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        }))
      );
      await setCounter(db, "users", maxId(users, "id"));
    }

    const [landings] = await sql.query(
      "SELECT id, name, group_name AS groupName, record_type AS recordType, status, roi, conversion, cr, crc, created_at AS createdAt, updated_at AS updatedAt FROM landings"
    );
    if (landings.length) {
      await db.collection("landings").insertMany(
        landings.map((l) => ({
          _id: l.id,
          name: l.name,
          groupName: l.groupName,
          recordType: l.recordType,
          status: l.status,
          roi: l.roi != null ? Number(l.roi) : null,
          conversion: l.conversion != null ? Number(l.conversion) : null,
          cr: l.cr != null ? Number(l.cr) : null,
          crc: l.crc != null ? Number(l.crc) : null,
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date()
        }))
      );
      await setCounter(db, "landings", maxId(landings, "id"));
    }

    const [wc] = await sql.query(
      "SELECT widget_key AS widgetKey, widget_name AS widgetName, sort_order AS sortOrder FROM widget_catalog"
    );
    if (wc.length) {
      await db.collection("widget_catalog").insertMany(
        wc.map((r) => ({
          widgetKey: r.widgetKey,
          widgetName: r.widgetName,
          sortOrder: Number(r.sortOrder)
        }))
      );
    }

    const [sc] = await sql.query(
      "SELECT script_key AS scriptKey, script_name AS scriptName, sort_order AS sortOrder FROM script_catalog"
    );
    if (sc.length) {
      await db.collection("script_catalog").insertMany(
        sc.map((r) => ({
          scriptKey: r.scriptKey,
          scriptName: r.scriptName,
          sortOrder: Number(r.sortOrder)
        }))
      );
    }

    const [widgets] = await sql.query(
      "SELECT id, landing_id AS landingId, widget_key AS widgetKey, widget_name AS widgetName, is_enabled AS isEnabled, sort_order AS sortOrder FROM widgets"
    );
    if (widgets.length) {
      await db.collection("widgets").insertMany(
        widgets.map((w) => ({
          _id: w.id,
          landingId: w.landingId,
          widgetKey: w.widgetKey,
          widgetName: w.widgetName,
          isEnabled: Boolean(w.isEnabled),
          sortOrder: Number(w.sortOrder)
        }))
      );
      await setCounter(db, "widget_rows", maxId(widgets, "id"));
    }

    const [scripts] = await sql.query(
      "SELECT id, landing_id AS landingId, script_key AS scriptKey, script_name AS scriptName, is_enabled AS isEnabled, sort_order AS sortOrder FROM scripts"
    );
    if (scripts.length) {
      await db.collection("scripts").insertMany(
        scripts.map((s) => ({
          _id: s.id,
          landingId: s.landingId,
          scriptKey: s.scriptKey,
          scriptName: s.scriptName,
          isEnabled: Boolean(s.isEnabled),
          sortOrder: Number(s.sortOrder)
        }))
      );
      await setCounter(db, "script_rows", maxId(scripts, "id"));
    }

    const [settings] = await sql.query(
      "SELECT id, landing_id AS landingId, setting_key AS settingKey, setting_value AS settingValue FROM settings"
    );
    if (settings.length) {
      await db.collection("settings").insertMany(
        settings.map((s) => ({
          _id: s.id,
          landingId: s.landingId,
          settingKey: s.settingKey,
          settingValue: s.settingValue != null ? String(s.settingValue) : ""
        }))
      );
      await setCounter(db, "settings", maxId(settings, "id"));
    }

    const [hist] = await sql.query(
      "SELECT id, landing_id AS landingId, user_id AS userId, action, entity_type AS entityType, entity_key AS entityKey, old_value AS oldValue, new_value AS newValue, created_at AS created_at FROM history"
    );
    if (hist.length) {
      await db.collection("history").insertMany(
        hist.map((h) => ({
          _id: h.id,
          landingId: h.landingId,
          userId: h.userId,
          action: h.action,
          entityType: h.entityType,
          entityKey: h.entityKey,
          oldValue: h.oldValue,
          newValue: h.newValue,
          created_at: h.created_at ? new Date(h.created_at) : new Date()
        }))
      );
      await setCounter(db, "history", maxId(hist, "id"));
    }

    const [tpl] = await sql.query(
      "SELECT entity, template_key AS templateKey, body, original_filename AS originalFilename, mime_type AS mimeType, updated_at AS updatedAt FROM entity_templates"
    );
    if (tpl.length) {
      await db.collection("entity_templates").insertMany(
        tpl.map((t) => ({
          entity: t.entity,
          templateKey: t.templateKey,
          body: Buffer.isBuffer(t.body) ? t.body : Buffer.from(t.body || []),
          originalFilename: t.originalFilename,
          mimeType: t.mimeType,
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date()
        }))
      );
    }

    console.log("Миграция завершена: данные скопированы в MongoDB.");
  } finally {
    await sql.end();
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
