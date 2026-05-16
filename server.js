const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const LEGACY_DATA_FILE = path.join(DATA_DIR, "store.json");
const DB_FILE = path.join(DATA_DIR, "dalan-tourism.db");

const listConfig = {
  homestays: {
    table: "homestays",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["name", "TEXT"],
      ["village", "TEXT"],
      ["owner", "TEXT"],
      ["phone", "TEXT"],
      ["rooms", "REAL"],
      ["beds", "REAL"],
      ["price", "REAL"],
      ["rating", "REAL"],
      ["status", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["rooms", "beds", "price", "rating"])
  },
  scenicSpots: {
    table: "scenic_spots",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["name", "TEXT"],
      ["type", "TEXT"],
      ["dailyCapacity", "REAL"],
      ["ticketPrice", "REAL"],
      ["manager", "TEXT"],
      ["status", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["dailyCapacity", "ticketPrice"])
  },
  newBusinesses: {
    table: "new_businesses",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["name", "TEXT"],
      ["type", "TEXT"],
      ["village", "TEXT"],
      ["owner", "TEXT"],
      ["phone", "TEXT"],
      ["dailyCapacity", "REAL"],
      ["avgSpend", "REAL"],
      ["status", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["dailyCapacity", "avgSpend"])
  },
  farmhouses: {
    table: "farmhouses",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["name", "TEXT"],
      ["village", "TEXT"],
      ["owner", "TEXT"],
      ["phone", "TEXT"],
      ["seats", "REAL"],
      ["tables", "REAL"],
      ["avgSpend", "REAL"],
      ["specialty", "TEXT"],
      ["status", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["seats", "tables", "avgSpend"])
  },
  operationRecords: {
    table: "operation_records",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["month", "TEXT"],
      ["targetType", "TEXT"],
      ["targetId", "TEXT"],
      ["periodStart", "TEXT"],
      ["periodEnd", "TEXT"],
      ["occupancyRate", "REAL"],
      ["guestCount", "REAL"],
      ["visitors", "REAL"],
      ["vehicleTraffic", "REAL"],
      ["revenue", "REAL"],
      ["activityDate", "TEXT"],
      ["activityName", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["occupancyRate", "guestCount", "visitors", "vehicleTraffic", "revenue"])
  },
  dailyReferences: {
    table: "daily_references",
    fields: [
      ["id", "TEXT PRIMARY KEY"],
      ["date", "TEXT"],
      ["vehicleTraffic", "REAL"],
      ["visitors", "REAL"],
      ["parkingPressure", "TEXT"],
      ["notes", "TEXT"],
      ["createdAt", "TEXT"],
      ["updatedAt", "TEXT"]
    ],
    numberFields: new Set(["vehicleTraffic", "visitors"])
  }
};

fs.mkdirSync(DATA_DIR, { recursive: true });
const database = new DatabaseSync(DB_FILE);
const SESSION_DAYS = 7;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function initDatabase() {
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  for (const config of Object.values(listConfig)) {
    const columns = config.fields.map(([name, type]) => `"${name}" ${type}`).join(", ");
    database.exec(`CREATE TABLE IF NOT EXISTS "${config.table}" (${columns})`);
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      displayName TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

function migrateLegacyStore() {
  if (!fs.existsSync(LEGACY_DATA_FILE)) return;
  const hasRows = Object.values(listConfig).some(config => {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM "${config.table}"`).get();
    return row.count > 0;
  });
  if (hasRows) return;

  const legacy = JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, "utf8"));
  for (const listName of Object.keys(listConfig)) {
    for (const item of legacy[listName] || []) {
      insertListItem(listName, item);
    }
  }
}

function rowToItem(listName, row) {
  const config = listConfig[listName];
  const item = {};
  for (const [field] of config.fields) {
    if (row[field] === null || row[field] === undefined) continue;
    item[field] = config.numberFields.has(field) ? normalizeNumber(row[field]) : row[field];
  }
  return item;
}

function listItems(listName) {
  const config = listConfig[listName];
  const orderField = listName === "operationRecords" ? "month" : listName === "dailyReferences" ? "date" : "name";
  const rows = database.prepare(`SELECT * FROM "${config.table}" ORDER BY "${orderField}"`).all();
  return rows.map(row => rowToItem(listName, row));
}

function readStore() {
  return {
    homestays: listItems("homestays"),
    scenicSpots: listItems("scenicSpots"),
    newBusinesses: listItems("newBusinesses"),
    farmhouses: listItems("farmhouses"),
    operationRecords: listItems("operationRecords"),
    dailyReferences: listItems("dailyReferences")
  };
}

function normalizeForDatabase(listName, item) {
  const config = listConfig[listName];
  const output = {};
  for (const [field] of config.fields) {
    if (field === "createdAt" && !item[field]) output[field] = new Date().toISOString();
    else if (config.numberFields.has(field)) output[field] = normalizeNumber(item[field]);
    else output[field] = item[field] ?? "";
  }
  return output;
}

function insertListItem(listName, item) {
  const config = listConfig[listName];
  const row = normalizeForDatabase(listName, item);
  const fields = config.fields.map(([field]) => field);
  const placeholders = fields.map(() => "?").join(", ");
  const values = fields.map(field => row[field]);
  database.prepare(`INSERT INTO "${config.table}" (${fields.map(field => `"${field}"`).join(", ")}) VALUES (${placeholders})`).run(...values);
  return rowToItem(listName, row);
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function createUser({ username, password, role, entityType = "", entityId = "", displayName = "" }) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  database.prepare(`
    INSERT INTO users (id, username, passwordHash, role, entityType, entityId, displayName, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, username, hashPassword(password), role, entityType, entityId, displayName || username, now, now);
  return id;
}

function seedUsers() {
  const count = database.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return;
  createUser({ username: "admin", password: "admin123", role: "admin", displayName: "管理员" });
  for (const [index, item] of listItems("homestays").entries()) {
    createUser({
      username: `homestay${index + 1}`,
      password: "dl123",
      role: "homestay",
      entityType: "homestay",
      entityId: item.id,
      displayName: item.name
    });
  }
  for (const [index, item] of listItems("scenicSpots").entries()) {
    createUser({
      username: `scenic${index + 1}`,
      password: "dl123",
      role: "scenicSpot",
      entityType: "scenicSpot",
      entityId: item.id,
      displayName: item.name
    });
  }
}

function migrateDefaultUserPasswords() {
  database.prepare(`
    UPDATE users
    SET passwordHash = ?, updatedAt = ?
    WHERE role != 'admin' AND passwordHash = ?
  `).run(hashPassword("dl123"), new Date().toISOString(), hashPassword("123456"));
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    entityType: user.entityType || "",
    entityId: user.entityId || "",
    displayName: user.displayName || user.username
  };
}

function listUsers() {
  return database.prepare(`
    SELECT id, username, role, entityType, entityId, displayName, createdAt, updatedAt
    FROM users
    ORDER BY role, username
  `).all();
}

function normalizeUserPayload(payload, existing = {}) {
  const role = payload.role || existing.role || "homestay";
  const entityType = role === "admin" ? "" : role;
  const entityId = role === "admin" ? "" : payload.entityId || existing.entityId || "";
  return {
    username: String(payload.username || existing.username || "").trim(),
    password: payload.password ? String(payload.password) : "",
    role,
    entityType,
    entityId,
    displayName: String(payload.displayName || existing.displayName || payload.username || "").trim()
  };
}

function createManagedUser(payload) {
  const user = normalizeUserPayload(payload);
  if (!user.username) throw new Error("账号不能为空");
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  database.prepare(`
    INSERT INTO users (id, username, passwordHash, role, entityType, entityId, displayName, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, user.username, hashPassword(user.password || "dl123"), user.role, user.entityType, user.entityId, user.displayName || user.username, now, now);
  return publicUser(database.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

function updateManagedUser(id, payload) {
  const existing = database.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!existing) return null;
  const user = normalizeUserPayload(payload, existing);
  if (!user.username) throw new Error("账号不能为空");
  const passwordHash = user.password ? hashPassword(user.password) : existing.passwordHash;
  database.prepare(`
    UPDATE users
    SET username = ?, passwordHash = ?, role = ?, entityType = ?, entityId = ?, displayName = ?, updatedAt = ?
    WHERE id = ?
  `).run(user.username, passwordHash, user.role, user.entityType, user.entityId, user.displayName || user.username, new Date().toISOString(), id);
  return publicUser(database.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

function deleteManagedUser(id, currentUserId) {
  if (id === currentUserId) throw new Error("不能删除当前登录账号");
  const result = database.prepare("DELETE FROM users WHERE id = ?").run(id);
  return result.changes > 0;
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(part => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function getCurrentUser(req) {
  const token = parseCookies(req).session;
  if (!token) return null;
  const session = database.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    if (session) database.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return database.prepare("SELECT * FROM users WHERE id = ?").get(session.userId) || null;
}

function createSession(userId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  database.prepare("INSERT INTO sessions (token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)")
    .run(token, userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}

function sendSessionCookie(res, token, expiresAt) {
  res.setHeader("Set-Cookie", `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

function scopedStore(store, user) {
  if (!user || user.role === "admin") return store;
  const emptyStore = {
    homestays: [],
    scenicSpots: [],
    newBusinesses: [],
    farmhouses: [],
    operationRecords: [],
    dailyReferences: []
  };
  if (user.role === "homestay") {
    return {
      ...emptyStore,
      homestays: store.homestays.filter(item => item.id === user.entityId),
      operationRecords: store.operationRecords.filter(item => item.targetType === "homestay" && item.targetId === user.entityId)
    };
  }
  if (user.role === "scenicSpot") {
    return {
      ...emptyStore,
      scenicSpots: store.scenicSpots.filter(item => item.id === user.entityId),
      operationRecords: store.operationRecords.filter(item => item.targetType === "scenicSpot" && item.targetId === user.entityId)
    };
  }
  if (user.role === "newBusiness") {
    return {
      ...emptyStore,
      newBusinesses: store.newBusinesses.filter(item => item.id === user.entityId),
      operationRecords: store.operationRecords.filter(item => item.targetType === "newBusiness" && item.targetId === user.entityId)
    };
  }
  if (user.role === "farmhouse") {
    return {
      ...emptyStore,
      farmhouses: store.farmhouses.filter(item => item.id === user.entityId),
      operationRecords: store.operationRecords.filter(item => item.targetType === "farmhouse" && item.targetId === user.entityId)
    };
  }
  return emptyStore;
}

function isAdmin(user) {
  return user?.role === "admin";
}

function canAccessList(user, listName) {
  if (isAdmin(user)) return true;
  if (listName === "homestays") return user?.role === "homestay";
  if (listName === "scenicSpots") return user?.role === "scenicSpot";
  if (listName === "newBusinesses") return user?.role === "newBusiness";
  if (listName === "farmhouses") return user?.role === "farmhouse";
  if (listName === "operationRecords") return ["homestay", "scenicSpot", "newBusiness", "farmhouse"].includes(user?.role);
  return false;
}

function assertCanWrite(user, listName, id, payload = {}) {
  if (isAdmin(user)) return;
  if (listName === "dailyReferences") throw new Error("无权维护日参考数据");
  if (["homestays", "scenicSpots", "newBusinesses", "farmhouses"].includes(listName)) {
    const expectedType = {
      homestays: "homestay",
      scenicSpots: "scenicSpot",
      newBusinesses: "newBusiness",
      farmhouses: "farmhouse"
    }[listName];
    if (user.role !== expectedType || id !== user.entityId) throw new Error("只能维护自己的基础资料");
    return;
  }
  if (listName === "operationRecords") {
    const expectedType = user.role;
    if (payload.targetType && payload.targetType !== expectedType) throw new Error("只能录入自己的月度数据");
    if (payload.targetId && payload.targetId !== user.entityId) throw new Error("只能录入自己的月度数据");
    return;
  }
  throw new Error("无权操作");
}

function scopeOperationPayload(user, payload) {
  if (isAdmin(user)) return payload;
  return {
    ...payload,
    targetType: user.role,
    targetId: user.entityId,
    activityDate: "",
    activityName: ""
  };
}

function normalizeOperationRecordPayload(payload) {
  return {
    ...payload,
    vehicleTraffic: 0
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON 格式不正确"));
      }
    });
  });
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function addId(item) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...item
  };
}

function upsertListItem(store, listName, id, payload) {
  const config = listConfig[listName];
  const existing = database.prepare(`SELECT * FROM "${config.table}" WHERE id = ?`).get(id);
  if (!existing) return null;
  const item = normalizeForDatabase(listName, {
    ...rowToItem(listName, existing),
    ...payload,
    id,
    updatedAt: new Date().toISOString()
  });
  const fields = config.fields.map(([field]) => field).filter(field => field !== "id");
  const assignments = fields.map(field => `"${field}" = ?`).join(", ");
  const values = fields.map(field => item[field]);
  database.prepare(`UPDATE "${config.table}" SET ${assignments} WHERE id = ?`).run(...values, id);
  return rowToItem(listName, item);
}

function deleteListItem(store, listName, id) {
  const config = listConfig[listName];
  const result = database.prepare(`DELETE FROM "${config.table}" WHERE id = ?`).run(id);
  return result.changes > 0;
}

function totalRooms(homestays) {
  return homestays.reduce((sum, item) => sum + normalizeNumber(item.rooms), 0);
}

function totalBeds(homestays) {
  return homestays.reduce((sum, item) => sum + normalizeNumber(item.beds), 0);
}

function getTargetList(store, targetType) {
  if (targetType === "scenicSpot") return store.scenicSpots;
  if (targetType === "newBusiness") return store.newBusinesses;
  if (targetType === "farmhouse") return store.farmhouses;
  return store.homestays;
}

function average(values) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getEntityName(store, targetType, targetId) {
  if (targetType === "activity") return "活动事项";
  const list = getTargetList(store, targetType);
  return list.find(item => item.id === targetId)?.name || "未选择对象";
}

function enrichOperationRecords(store, records = store.operationRecords) {
  return records.map(record => ({
    ...record,
    targetName: record.targetType === "activity" ? record.activityName || "活动事项" : getEntityName(store, record.targetType, record.targetId)
  }));
}

function monthStart(month) {
  return `${month}-01`;
}

function monthEnd(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  return formatLocalDate(new Date(year, monthIndex, 0));
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSummary(store) {
  const records = [...store.operationRecords].sort((a, b) => b.month.localeCompare(a.month));
  const latest = records.slice(0, 6);
  const monthSet = new Set(records.map(item => item.month));
  const dailyLatest = [...store.dailyReferences].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  return {
    homestayCount: store.homestays.length,
    scenicSpotCount: store.scenicSpots.length,
    newBusinessCount: store.newBusinesses.length,
    farmhouseCount: store.farmhouses.length,
    roomCount: totalRooms(store.homestays),
    bedCount: totalBeds(store.homestays),
    monthCount: monthSet.size,
    operationRecordCount: records.length,
    occupancyRate: Math.round(average(latest.filter(item => item.targetType === "homestay").map(item => normalizeNumber(item.occupancyRate)))),
    guestCount: latest.reduce((sum, item) => sum + normalizeNumber(item.guestCount), 0),
    visitors: latest.reduce((sum, item) => sum + normalizeNumber(item.visitors), 0),
    vehicleTraffic: dailyLatest.reduce((sum, item) => sum + normalizeNumber(item.vehicleTraffic), 0),
    revenue: latest.reduce((sum, item) => sum + normalizeNumber(item.revenue), 0),
    dailyReferenceCount: store.dailyReferences.length,
    dailyVehicleTraffic30d: dailyLatest.reduce((sum, item) => sum + normalizeNumber(item.vehicleTraffic), 0)
  };
}

function groupMonthly(records, dailyReferences = []) {
  const byMonth = new Map();
  const ensureMonth = month => {
    if (!byMonth.has(month)) {
      byMonth.set(month, {
        month,
        occupancyValues: [],
        guestCount: 0,
        visitors: 0,
        vehicleTraffic: 0,
        revenue: 0,
        activityCount: 0
      });
    }
    return byMonth.get(month);
  };
  for (const record of records) {
    const group = ensureMonth(record.month);
    if (record.targetType === "homestay") group.occupancyValues.push(normalizeNumber(record.occupancyRate));
    group.guestCount += normalizeNumber(record.guestCount);
    group.visitors += normalizeNumber(record.visitors);
    group.revenue += normalizeNumber(record.revenue);
    if (record.activityName) group.activityCount += 1;
  }
  for (const reference of dailyReferences) {
    if (!reference.date) continue;
    ensureMonth(reference.date.slice(0, 7)).vehicleTraffic += normalizeNumber(reference.vehicleTraffic);
  }

  return [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(group => ({
      month: group.month,
      occupancyRate: Math.round(average(group.occupancyValues)),
      guestCount: group.guestCount,
      visitors: group.visitors,
      vehicleTraffic: group.vehicleTraffic,
      revenue: group.revenue,
      activityCount: group.activityCount
    }));
}

function buildAnalysis(store) {
  const monthly = groupMonthly(store.operationRecords, store.dailyReferences);
  const trend = monthly.slice(-12);
  const forecast = forecastMonths(store, monthly, 6);
  const context = analysisContext(store);
  const dailyReference = [...store.dailyReferences]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);
  const derived = buildDerivedAnalysis(trend, forecast, dailyReference);

  return {
    summary: buildSummary(store),
    trend,
    forecast,
    dailyReference,
    derived,
    insights: buildInsights(trend, forecast, derived, context),
    recommendations: buildRecommendations(trend, forecast, derived, dailyReference, context)
  };
}

function analysisContext(store) {
  const activeTypes = [
    ["homestay", store.homestays.length],
    ["scenicSpot", store.scenicSpots.length],
    ["newBusiness", store.newBusinesses.length],
    ["farmhouse", store.farmhouses.length]
  ].filter(([, count]) => count > 0);
  if (activeTypes.length === 1) return activeTypes[0][0];
  return "admin";
}

function buildDerivedAnalysis(trend, forecast, dailyReference) {
  const latest = trend.at(-1) || {};
  const previous = trend.at(-2) || {};
  const next = forecast[0] || {};
  const visitorChange = percentChange(latest.visitors, previous.visitors);
  const revenueChange = percentChange(latest.revenue, previous.revenue);
  const occupancyChange = percentChange(latest.occupancyRate, previous.occupancyRate);
  const highTrafficDays = dailyReference.filter(item => normalizeNumber(item.vehicleTraffic) >= 900).length;

  return {
    latestMonth: latest.month || "",
    nextMonth: next.month || "",
    nextVisitors: normalizeNumber(next.visitors),
    nextGuests: normalizeNumber(next.guestCount),
    nextOccupancyRate: normalizeNumber(next.occupancyRate),
    nextVehicleTraffic: normalizeNumber(next.vehicleTraffic),
    nextRevenue: normalizeNumber(next.revenue),
    latestOccupancyRate: normalizeNumber(latest.occupancyRate),
    visitorChange,
    revenueChange,
    occupancyChange,
    visitorTrendText: trendText(visitorChange),
    revenueTrendText: trendText(revenueChange),
    vehiclePerVisitor: latest.visitors ? Number((normalizeNumber(latest.vehicleTraffic) / normalizeNumber(latest.visitors)).toFixed(2)) : 0,
    revenuePerVisitor: latest.visitors ? Math.round(normalizeNumber(latest.revenue) / normalizeNumber(latest.visitors)) : 0,
    highTrafficDays,
    dataMonths: trend.length
  };
}

function buildInsights(trend, forecast, derived, context = "admin") {
  if (!trend.length) return ["当前还没有月度运维记录，暂时无法形成趋势判断。"];
  const latestMonth = derived.latestMonth || "最近月份";
  if (context === "homestay") {
    const latest = trend.at(-1) || {};
    const previous = trend.at(-2) || {};
    return [
      `${latestMonth} 入住人数较上一个记录周期${changeText(percentChange(latest.guestCount, previous.guestCount))}，营收${changeText(derived.revenueChange)}。`,
      `最新入住率为 ${derived.latestOccupancyRate || 0}%，房间利用情况${derived.latestOccupancyRate >= 75 ? "较好" : derived.latestOccupancyRate >= 45 ? "较平稳" : "仍有提升空间"}。`,
      `最近月客单参考约为 ${derived.revenuePerVisitor || 0} 元/人，可用于判断价格、套餐和渠道质量。`
    ];
  }
  if (context === "scenicSpot") {
    return [
      `${latestMonth} 游客量较上一个记录周期${changeText(derived.visitorChange)}，营收${changeText(derived.revenueChange)}。`,
      `最近月客单参考约为 ${derived.revenuePerVisitor || 0} 元/人，可用于判断二次消费和票务转化。`,
      `最近月车流/游客比约为 ${derived.vehiclePerVisitor || 0}，可用于判断自驾到访和停车压力。`
    ];
  }
  if (context === "newBusiness" || context === "farmhouse") {
    return [
      `${latestMonth} 接待游客量较上一个记录周期${changeText(derived.visitorChange)}，营收${changeText(derived.revenueChange)}。`,
      `最近月客单参考约为 ${derived.revenuePerVisitor || 0} 元/人，可用于判断产品消费转化。`,
      "建议结合活动日、周末和景区客流观察到店转化，逐步形成自己的淡旺季规律。"
    ];
  }
  const insights = [
    `${latestMonth} 游客量较上一个记录周期${changeText(derived.visitorChange)}，营收${changeText(derived.revenueChange)}。`,
    `最新平均入住率为 ${derived.latestOccupancyRate || 0}%，民宿端热度${derived.latestOccupancyRate >= 75 ? "偏高" : derived.latestOccupancyRate >= 45 ? "较平稳" : "仍有提升空间"}。`
  ];

  if (derived.vehiclePerVisitor) {
    insights.push(`最近月车流/游客比约为 ${derived.vehiclePerVisitor}，可用于判断自驾客占比和道路压力。`);
  }
  if (derived.dataMonths < 6) {
    insights.push("当前连续月份样本偏少，后续可以重点观察活动月、周末和节假日对各业态的带动关系。");
  }
  return insights;
}

function buildRecommendations(trend, forecast, derived, dailyReference, context = "admin") {
  const recommendations = [];

  if (!trend.length) {
    return ["先完成民宿、景区、活动和日参考数据的连续录入，再观察活动与各业态之间的联动关系。"];
  }
  if (context === "homestay") {
    if (derived.latestOccupancyRate >= 75) {
      recommendations.push("入住率较高，建议提前做好房态锁定、保洁排班和接待物资准备。");
    } else if (derived.latestOccupancyRate < 45) {
      recommendations.push("入住率偏低，建议结合周末、亲子、研学等主题做套餐促销。");
    }
    if (derived.revenueChange < -10) recommendations.push("营收近期回落，建议核对客单价、渠道订单和节假日定价策略。");
    recommendations.push("建议每月固定录入入住率、入住人数和营收，形成连续趋势后更容易判断活动带动与淡旺季变化。");
    return recommendations.slice(0, 5);
  }
  if (context === "scenicSpot") {
    if (derived.visitorChange < -10) recommendations.push("游客量近期回落，建议结合活动、研学和渠道宣传提升到访。");
    if (derived.revenueChange < -10) recommendations.push("营收近期回落，建议核对票务、二消和活动转化情况。");
    recommendations.push("建议持续录入游客量和营收，便于判断景区承载、产品转化和淡旺季趋势。");
    return recommendations.slice(0, 5);
  }
  if (context === "newBusiness" || context === "farmhouse") {
    if (derived.visitorChange < -10) recommendations.push("接待游客量近期回落，建议结合活动、套餐和周边景区做联动引流。");
    if (derived.revenueChange < -10) recommendations.push("营收近期回落，建议核对客单价、产品组合和渠道转化情况。");
    recommendations.push("建议持续录入接待游客量和营收，后续可观察与景区、活动和周末客流的联动关系。");
    return recommendations.slice(0, 5);
  }
  if (derived.highTrafficDays >= 2) {
    recommendations.push("最近日参考数据中高车流日较多，建议重点复盘这些日期对应的活动、景区客流和停车压力。");
  }
  if (derived.latestOccupancyRate >= 75) {
    recommendations.push("民宿入住率较高，可对热门周末做价格和房态预案，同时关注保洁、接待和早餐供给。");
  } else if (derived.latestOccupancyRate < 45) {
    recommendations.push("民宿入住率偏低，建议结合景区活动做套餐联动，重点投放空房较多的片区。");
  }
  if (derived.visitorChange < -10) {
    recommendations.push("游客量近期回落，建议核对天气、活动缺口和渠道投放情况，优先补充节假日活动。");
  }
  if (!trend.some(item => item.activityCount > 0)) {
    recommendations.push("目前月度记录中活动数据较少，建议把节庆、市集、研学等活动单独录入，便于判断活动对客流的拉动。");
  }
  if (dailyReference.length < 7) {
    recommendations.push("日参考数据还不够密，建议对周末、节假日和活动日做日级车流记录，方便判断活动对交通和客流的影响。");
  }

  return recommendations.slice(0, 5);
}

function percentChange(current, previous) {
  const currentValue = normalizeNumber(current);
  const previousValue = normalizeNumber(previous);
  if (!previousValue) return currentValue ? 100 : 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

function trendText(change) {
  if (change >= 10) return `上升 ${change}%`;
  if (change <= -10) return `下降 ${Math.abs(change)}%`;
  return "基本平稳";
}

function changeText(change) {
  if (change > 0) return `上升 ${change}%`;
  if (change < 0) return `下降 ${Math.abs(change)}%`;
  return "基本持平";
}

function forecastMonths(store, monthly, count) {
  const recent = monthly.slice(-6);
  const lastMonth = recent.length ? recent[recent.length - 1].month : new Date().toISOString().slice(0, 7);
  const baseVisitors = Math.max(average(recent.map(item => item.visitors)), 100);
  const baseGuests = Math.max(average(recent.map(item => item.guestCount)), 20);
  const baseVehicles = Math.max(average(recent.map(item => item.vehicleTraffic)), 30);
  const baseRevenue = Math.max(average(recent.map(item => item.revenue)), 10000);
  const baseOccupancy = Math.max(average(recent.map(item => item.occupancyRate)), 20);
  const output = [];

  for (let index = 1; index <= count; index += 1) {
    const month = addMonths(lastMonth, index);
    const season = seasonalFactor(Number(month.slice(5, 7)));
    const activityFactor = hasActivityInMonth(store.operationRecords, month) ? 1.12 : 1;
    const referenceFactor = dailyVehicleFactor(store.dailyReferences, month);
    const factor = season * activityFactor * referenceFactor;

    output.push({
      month,
      occupancyRate: Math.min(100, Math.round(baseOccupancy * factor)),
      guestCount: Math.round(baseGuests * factor),
      visitors: Math.round(baseVisitors * factor),
      vehicleTraffic: Math.round(baseVehicles * factor),
      revenue: Math.round(baseRevenue * factor),
      confidence: recent.length >= 6 ? "较高" : recent.length >= 3 ? "中等" : "样本偏少"
    });
  }
  return output;
}

function addMonths(month, offset) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function seasonalFactor(month) {
  if ([4, 5, 10].includes(month)) return 1.15;
  if ([7, 8].includes(month)) return 1.1;
  if ([1, 2, 12].includes(month)) return 0.9;
  return 1;
}

function hasActivityInMonth(records, month) {
  return records.some(record => record.month === month && record.activityName);
}

function dailyVehicleFactor(dailyReferences, forecastMonth) {
  const recent = dailyReferences
    .filter(item => item.date < monthStart(forecastMonth))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  if (recent.length < 5) return 1;
  const avg = average(recent.map(item => normalizeNumber(item.vehicleTraffic)));
  if (avg > 900) return 1.08;
  if (avg < 250) return 0.95;
  return 1;
}

function serveStatic(req, res) {
  const cleanPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const filePath = cleanPath === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, cleanPath);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendError(res, 403, "Forbidden");

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) return sendError(res, 404, "Not found");
        res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
        res.end(fallback);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[1];
  const id = parts[2];
  const user = getCurrentUser(req);

  if (resource === "login" && req.method === "POST") {
    const { username, password } = await parseBody(req);
    const matched = database.prepare("SELECT * FROM users WHERE username = ?").get(username || "");
    if (!matched || matched.passwordHash !== hashPassword(password || "")) return sendError(res, 401, "账号或密码不正确");
    const session = createSession(matched.id);
    sendSessionCookie(res, session.token, session.expiresAt);
    return sendJson(res, 200, { user: publicUser(matched) });
  }

  if (resource === "logout" && req.method === "POST") {
    const token = parseCookies(req).session;
    if (token) database.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (resource === "me" && req.method === "GET") {
    if (!user) return sendError(res, 401, "请先登录");
    return sendJson(res, 200, { user: publicUser(user) });
  }

  if (!user) return sendError(res, 401, "请先登录");

  if (resource === "changePassword" && req.method === "POST") {
    const { oldPassword, newPassword } = await parseBody(req);
    if (!newPassword || String(newPassword).length < 4) return sendError(res, 400, "新密码至少 4 位");
    const current = database.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    if (current.passwordHash !== hashPassword(oldPassword || "")) return sendError(res, 400, "原密码不正确");
    database.prepare("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?")
      .run(hashPassword(newPassword), new Date().toISOString(), user.id);
    return sendJson(res, 200, { ok: true });
  }

  if (resource === "users") {
    if (!isAdmin(user)) return sendError(res, 403, "无权维护账号");
    if (req.method === "GET") return sendJson(res, 200, listUsers());
    if (req.method === "POST") return sendJson(res, 201, createManagedUser(await parseBody(req)));
    if (req.method === "PUT" && id) {
      const item = updateManagedUser(id, await parseBody(req));
      if (!item) return sendError(res, 404, "账号不存在");
      return sendJson(res, 200, item);
    }
    if (req.method === "DELETE" && id) {
      const deleted = deleteManagedUser(id, user.id);
      if (!deleted) return sendError(res, 404, "账号不存在");
      return sendJson(res, 200, { ok: true });
    }
  }

  const store = readStore();
  const scoped = scopedStore(store, user);

  if (req.method === "GET" && resource === "summary") return sendJson(res, 200, buildSummary(scoped));
  if (req.method === "GET" && resource === "analysis") return sendJson(res, 200, buildAnalysis(scoped));

  const listMap = {
    homestays: "homestays",
    scenicSpots: "scenicSpots",
    newBusinesses: "newBusinesses",
    farmhouses: "farmhouses",
    operationRecords: "operationRecords",
    dailyReferences: "dailyReferences"
  };
  const listName = listMap[resource];
  if (!listName) return sendError(res, 404, "接口不存在");
  if (!canAccessList(user, listName)) return sendError(res, 403, "无权访问该数据");

  if (req.method === "GET") {
    const list = listName === "operationRecords" ? enrichOperationRecords(scoped) : scoped[listName];
    return sendJson(res, 200, list);
  }

  if (req.method === "POST") {
    if (!isAdmin(user) && ["homestays", "scenicSpots", "newBusinesses", "farmhouses"].includes(listName)) return sendError(res, 403, "基础资料只能编辑，不能新增");
    let payload = await parseBody(req);
    if (listName === "operationRecords") payload = normalizeOperationRecordPayload(scopeOperationPayload(user, payload));
    assertCanWrite(user, listName, payload.id, payload);
    if (listName === "operationRecords" && payload.month) {
      payload.periodStart = monthStart(payload.month);
      payload.periodEnd = monthEnd(payload.month);
    }
    const item = addId(payload);
    return sendJson(res, 201, insertListItem(listName, item));
  }

  if (req.method === "PUT" && id) {
    let payload = await parseBody(req);
    const visibleItem = scoped[listName].find(item => item.id === id);
    if (!visibleItem) return sendError(res, 404, "数据不存在");
    if (listName === "operationRecords") payload = normalizeOperationRecordPayload(scopeOperationPayload(user, payload));
    assertCanWrite(user, listName, id, payload);
    if (listName === "operationRecords" && payload.month) {
      payload.periodStart = monthStart(payload.month);
      payload.periodEnd = monthEnd(payload.month);
    }
    const item = upsertListItem(store, listName, id, payload);
    if (!item) return sendError(res, 404, "数据不存在");
    return sendJson(res, 200, item);
  }

  if (req.method === "DELETE" && id) {
    if (!isAdmin(user) && ["homestays", "scenicSpots", "newBusinesses", "farmhouses"].includes(listName)) return sendError(res, 403, "基础资料不能删除");
    const visibleItem = scoped[listName].find(item => item.id === id);
    if (!visibleItem) return sendError(res, 404, "数据不存在");
    assertCanWrite(user, listName, id, visibleItem);
    const deleted = deleteListItem(store, listName, id);
    if (!deleted) return sendError(res, 404, "数据不存在");
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 405, "方法不支持");
}

initDatabase();
migrateLegacyStore();
seedUsers();
migrateDefaultUserPasswords();

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(error => sendError(res, 400, error.message));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Dalan tourism system running at http://localhost:${PORT}`);
});
