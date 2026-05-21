const state = {
  user: null,
  activeView: "maintainView",
  activeMaintainTab: "homestays",
  entryType: "homestay",
  selectedEntityId: "",
  analysisMonth: "",
  feedbackMonth: "",
  feedbackGeneratedAt: "",
  data: {
    homestays: [],
    scenicSpots: [],
    newBusinesses: [],
    farmhouses: [],
    operationRecords: [],
    dailyReferences: [],
    users: []
  },
  editing: null
};

function isAdmin() {
  return state.user?.role === "admin";
}

function roleText(role) {
  if (role === "homestay") return "民宿端";
  if (role === "scenicSpot") return "景区端";
  if (role === "newBusiness") return "新业态端";
  if (role === "farmhouse") return "农家乐端";
  return "管理员端";
}

function analysisMode() {
  if (state.user?.role === "homestay") return "homestay";
  if (state.user?.role === "scenicSpot") return "scenicSpot";
  if (state.user?.role === "newBusiness") return "newBusiness";
  if (state.user?.role === "farmhouse") return "farmhouse";
  return "admin";
}

const schemas = {
  homestays: {
    title: "民宿",
    hint: "逐家维护民宿名称、片区、房间床位、负责人等基础数据。",
    fields: [
      ["name", "民宿名称", "text"],
      ["village", "所在村/片区", "text"],
      ["owner", "负责人", "text"],
      ["phone", "联系电话", "text"],
      ["rooms", "房间数", "number"],
      ["beds", "床位数", "number"],
      ["price", "平均房价", "number"],
      ["rating", "评分", "number"],
      ["status", "经营状态", "text"],
      ["notes", "备注", "text"]
    ],
    columns: [
      ["name", "民宿名称"],
      ["village", "片区"],
      ["owner", "负责人"],
      ["rooms", "房间"],
      ["beds", "床位"],
      ["price", "平均房价"],
      ["status", "状态"]
    ]
  },
  scenicSpots: {
    title: "景区",
    hint: "逐个维护景区名称、类型、承载量、票价、管理单位等基础数据。",
    fields: [
      ["name", "景区/景点名称", "text"],
      ["type", "类型", "text"],
      ["dailyCapacity", "日承载量", "number"],
      ["ticketPrice", "票价", "number"],
      ["manager", "管理单位", "text"],
      ["status", "开放状态", "text"],
      ["notes", "备注", "text"]
    ],
    columns: [
      ["name", "景区/景点"],
      ["type", "类型"],
      ["dailyCapacity", "日承载量"],
      ["ticketPrice", "票价"],
      ["manager", "管理单位"],
      ["status", "状态"]
    ]
  },
  newBusinesses: {
    title: "新业态",
    hint: "维护咖啡店、漂流、露营基地等新业态的类型、接待能力和消费数据。",
    fields: [
      ["name", "新业态名称", "text"],
      ["type", "业态类型", "text"],
      ["village", "所在村/片区", "text"],
      ["owner", "负责人", "text"],
      ["phone", "联系电话", "text"],
      ["dailyCapacity", "日接待能力", "number"],
      ["avgSpend", "人均消费", "number"],
      ["status", "营业状态", "text"],
      ["notes", "备注", "text"]
    ],
    columns: [
      ["name", "新业态名称"],
      ["type", "业态类型"],
      ["village", "片区"],
      ["owner", "负责人"],
      ["dailyCapacity", "日接待能力"],
      ["avgSpend", "人均消费"],
      ["status", "状态"]
    ]
  },
  farmhouses: {
    title: "农家乐",
    hint: "维护农家乐名称、餐位桌数、人均消费、特色菜和经营状态等基础数据。",
    fields: [
      ["name", "农家乐名称", "text"],
      ["village", "所在村/片区", "text"],
      ["owner", "负责人", "text"],
      ["phone", "联系电话", "text"],
      ["seats", "餐位数", "number"],
      ["tables", "餐桌数", "number"],
      ["avgSpend", "人均消费", "number"],
      ["specialty", "特色菜/主打", "text"],
      ["status", "营业状态", "text"],
      ["notes", "备注", "text"]
    ],
    columns: [
      ["name", "农家乐名称"],
      ["village", "片区"],
      ["owner", "负责人"],
      ["seats", "餐位"],
      ["tables", "餐桌"],
      ["avgSpend", "人均消费"],
      ["specialty", "特色菜"],
      ["status", "状态"]
    ]
  },
  users: {
    title: "账号",
    hint: "为民宿、景区和管理员维护登录账号；默认密码为 dl123。",
    fields: [
      ["displayName", "显示名称", "text"],
      ["username", "登录账号", "text"],
      ["password", "密码(留空不改)", "password"],
      ["role", "账号类型", "userRole"],
      ["entityId", "绑定对象", "userEntitySelect"]
    ],
    columns: [
      ["displayName", "显示名称"],
      ["username", "登录账号"],
      ["role", "账号类型"],
      ["entityName", "绑定对象"],
      ["updatedAt", "更新时间"]
    ]
  }
};

const operationColumns = [
  ["month", "月份"],
  ["targetName", "对象"],
  ["targetType", "类型"],
  ["occupancyRate", "入住率"],
  ["guestCount", "入住人数"],
  ["visitors", "游客量"],
  ["revenue", "营收"],
  ["activityName", "活动"],
  ["notes", "备注"]
];

const dailyReferenceSchema = {
  columns: [
    ["date", "日期"],
    ["vehicleTraffic", "车流量"],
    ["visitors", "游客量"],
    ["parkingPressure", "停车压力"],
    ["notes", "备注"]
  ],
  fields: [
    ["date", "日期", "date"],
    ["vehicleTraffic", "车流量", "number"],
    ["visitors", "游客量", "number"],
    ["parkingPressure", "停车压力", "pressure"],
    ["notes", "备注", "text"]
  ]
};

const feedbackKeywords = ["大岚", "丹山赤水", "大岚民宿", "大岚避暑", "大岚露营", "大岚农家乐", "大岚咖啡", "大岚徒步"];

const feedbackSources = [
  { name: "百度搜索", type: "全网搜索", mode: "site/关键词", status: "启用", note: "用于发现公开网页、新闻、攻略和平台摘要。" },
  { name: "携程", type: "旅游平台", mode: "固定页面/搜索结果", status: "启用", note: "优先关注景区、酒店、游记和点评摘要。" },
  { name: "Trip.com", type: "旅游平台", mode: "固定页面", status: "启用", note: "可补充英文站与目的地页面摘要。" },
  { name: "马蜂窝", type: "攻略游记", mode: "搜索结果", status: "待接入", note: "用于发现游记、路线和游客体验。" },
  { name: "大众点评", type: "本地生活", mode: "搜索结果/导入", status: "待接入", note: "适合农家乐、餐饮、新业态口碑。" },
  { name: "小红书", type: "内容社区", mode: "手动导入/摘要", status: "谨慎接入", note: "强反爬平台，正式版优先做手动导入或合规接口。" }
];

const mockNetworkFeedback = [
  {
    month: "2026-05",
    platform: "小红书",
    keyword: "大岚避暑",
    title: "周末去大岚避暑，山里空气和景色都很舒服",
    content: "丹山赤水沿线很适合拍照，亲子徒步体验不错，民宿管家响应也快。",
    targetType: "scenicSpot",
    targetName: "丹山赤水",
    sentiment: "positive",
    tags: ["风景", "避暑", "亲子"],
    heat: 428
  },
  {
    month: "2026-05",
    platform: "小红书",
    keyword: "大岚民宿",
    title: "云岭山居民宿视野很好，早餐也比较有当地特色",
    content: "山景房体验好，五一期间价格能接受，但建议提前预订。",
    targetType: "homestay",
    targetName: "云岭山居民宿",
    sentiment: "positive",
    tags: ["民宿", "服务", "早餐"],
    heat: 316
  },
  {
    month: "2026-05",
    platform: "大众点评",
    keyword: "大岚农家乐",
    title: "农家乐菜量足，但高峰期上菜偏慢",
    content: "土鸡和笋干不错，节假日人多的时候等菜时间偏长。",
    targetType: "farmhouse",
    targetName: "山风里",
    sentiment: "neutral",
    tags: ["农家乐", "餐饮", "排队"],
    heat: 112
  },
  {
    month: "2026-05",
    platform: "小红书",
    keyword: "大岚停车",
    title: "丹山赤水入口附近停车有点紧张",
    content: "景色好看，但是五一首日入口附近车比较多，停车引导可以再清楚一点。",
    targetType: "scenicSpot",
    targetName: "丹山赤水",
    sentiment: "negative",
    tags: ["停车", "交通", "引导"],
    heat: 265
  },
  {
    month: "2026-05",
    platform: "携程",
    keyword: "大岚住宿",
    title: "溪谷人家适合家庭住，周边比较安静",
    content: "房间干净，晚上安静，避暑资源建议提前启动。",
    targetType: "homestay",
    targetName: "溪谷人家",
    sentiment: "positive",
    tags: ["民宿", "卫生", "亲子"],
    heat: 178
  },
  {
    month: "2026-05",
    platform: "抖音",
    keyword: "大岚露营",
    title: "松雾咖啡附近露营氛围不错",
    content: "拍照出片，适合下午过去，但公共指示牌还可以更明显。",
    targetType: "newBusiness",
    targetName: "松雾咖啡",
    sentiment: "positive",
    tags: ["新业态", "咖啡", "露营"],
    heat: 236
  },
  {
    month: "2026-04",
    platform: "小红书",
    keyword: "大岚春游",
    title: "春季徒步路线适合轻量出行",
    content: "茶园徒步和民宿体验结合很好，适合周末两天一晚。",
    targetType: "activity",
    targetName: "茶园徒步活动",
    sentiment: "positive",
    tags: ["活动", "徒步", "茶园"],
    heat: 184
  },
  {
    month: "2026-04",
    platform: "大众点评",
    keyword: "丹山赤水",
    title: "景区入口排队稍明显",
    content: "周末游客比较多，入口排队和停车动线需要优化。",
    targetType: "scenicSpot",
    targetName: "丹山赤水",
    sentiment: "negative",
    tags: ["排队", "停车", "景区"],
    heat: 147
  }
];

const numberFields = new Set([
  "rooms",
  "beds",
  "price",
  "rating",
  "dailyCapacity",
  "ticketPrice",
  "avgSpend",
  "seats",
  "tables",
  "occupancyRate",
  "guestCount",
  "visitors",
  "vehicleTraffic",
  "revenue"
]);

function money(value) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function number(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
}

function percent(value) {
  return `${Number(value || 0).toFixed(Number(value) % 1 ? 1 : 0)}%`;
}

function average(values) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || "请求失败");
  }
  return response.json();
}

async function loadAll() {
  const commonRequests = [
    api("/api/summary"),
    api("/api/operationRecords"),
    api("/api/analysis")
  ];
  const [summary, operationRecords, analysis] = await Promise.all(commonRequests);
  let homestays = [];
  let scenicSpots = [];
  let newBusinesses = [];
  let farmhouses = [];
  let dailyReferences = [];

  if (isAdmin()) {
    let users = [];
    [homestays, scenicSpots, newBusinesses, farmhouses, dailyReferences, users] = await Promise.all([
      api("/api/homestays"),
      api("/api/scenicSpots"),
      api("/api/newBusinesses"),
      api("/api/farmhouses"),
      api("/api/dailyReferences"),
      api("/api/users")
    ]);
    state.data.users = enrichUsers(users, homestays, scenicSpots, newBusinesses, farmhouses);
  } else if (state.user.role === "homestay") {
    homestays = await api("/api/homestays");
  } else if (state.user.role === "scenicSpot") {
    scenicSpots = await api("/api/scenicSpots");
  } else if (state.user.role === "newBusiness") {
    newBusinesses = await api("/api/newBusinesses");
  } else if (state.user.role === "farmhouse") {
    farmhouses = await api("/api/farmhouses");
  }

  state.data = { ...state.data, homestays, scenicSpots, newBusinesses, farmhouses, operationRecords, dailyReferences };
  applyRoleUi();
  if (!state.selectedEntityId) state.selectedEntityId = getEntryList()[0]?.id || "";
  renderMetrics(summary);
  setMetricsVisibility();
  renderMaintainTable();
  renderEntrySelectors();
  renderSelectedEntityBox();
  renderOperationTable();
  if (isAdmin()) renderDailyReferenceTable();
  renderAnalysis(analysis);
  if (isAdmin()) renderNetworkFeedback();
}

async function boot() {
  try {
    const result = await api("/api/me");
    state.user = result.user;
    hideLogin();
    await loadAll();
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.body.classList.add("login-active");
  document.querySelector("#loginScreen").classList.add("active");
}

function hideLogin() {
  document.body.classList.remove("login-active");
  document.querySelector("#loginScreen").classList.remove("active");
}

function applyRoleUi() {
  const admin = isAdmin();
  document.querySelector("#userBadge").textContent = `${state.user.displayName} · ${roleText(state.user.role)}`;
  document.querySelector("#addBtn").hidden = !admin;
  document.querySelector("#dailyReferencePanel").hidden = !admin;
  document.querySelectorAll(".admin-only").forEach(item => {
    item.hidden = !admin;
  });
  document.querySelector("#entryTypeSelect option[value='activity']").hidden = !admin;
  document.querySelector("#entryTypeSelect option[value='activity']").disabled = !admin;

  if (!admin) {
    if (state.activeView === "feedbackView") state.activeView = "maintainView";
    document.querySelectorAll(".module-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === state.activeView));
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === state.activeView));
    state.activeMaintainTab = maintainTabForRole(state.user.role);
    state.entryType = state.user.role;
    document.querySelectorAll(".tab").forEach(tab => {
      const visible = tab.dataset.tab === state.activeMaintainTab;
      tab.hidden = !visible;
      tab.classList.toggle("active", visible);
    });
    document.querySelector("#entryTypeSelect").disabled = true;
    document.querySelector("#tableHint").textContent = "维护自己的基础资料，管理员可查看汇总数据。";
  } else {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.hidden = false;
      tab.classList.toggle("active", tab.dataset.tab === state.activeMaintainTab);
    });
    document.querySelector("#entryTypeSelect").disabled = false;
  }
}

function maintainTabForRole(role) {
  return {
    homestay: "homestays",
    scenicSpot: "scenicSpots",
    newBusiness: "newBusinesses",
    farmhouse: "farmhouses"
  }[role] || "homestays";
}

function listForType(type) {
  return {
    homestay: state.data.homestays,
    scenicSpot: state.data.scenicSpots,
    newBusiness: state.data.newBusinesses,
    farmhouse: state.data.farmhouses
  }[type] || state.data.homestays;
}

function enrichUsers(users, homestays, scenicSpots, newBusinesses, farmhouses) {
  const lists = { homestay: homestays, scenicSpot: scenicSpots, newBusiness: newBusinesses, farmhouse: farmhouses };
  return users.map(user => {
    const entity = (lists[user.entityType] || []).find(item => item.id === user.entityId);
    return {
      ...user,
      entityName: user.role === "admin" ? "全镇管理" : entity?.name || "未绑定"
    };
  });
}

function renderMetrics(summary) {
  if (analysisMode() === "homestay") return renderEntityMetrics("homestay");
  if (analysisMode() === "scenicSpot") return renderEntityMetrics("scenicSpot");
  if (analysisMode() === "newBusiness") return renderEntityMetrics("newBusiness");
  if (analysisMode() === "farmhouse") return renderEntityMetrics("farmhouse");

  const metrics = [
    ["民宿数量", `${summary.homestayCount} 家`],
    ["房间 / 床位", `${summary.roomCount} 间 / ${summary.bedCount} 张`],
    ["景区数量", `${summary.scenicSpotCount} 个`],
    ["新业态数量", `${summary.newBusinessCount || 0} 个`],
    ["农家乐数量", `${summary.farmhouseCount || 0} 家`],
    ["月度样本", `${summary.operationRecordCount} 条 / ${summary.monthCount} 个月`],
    ["近月入住人数", `${number(summary.guestCount)} 人`],
    ["近月游客量", `${number(summary.visitors)} 人`],
    ["近月车流量", `${number(summary.vehicleTraffic)} 辆`],
    ["近月营收", money(summary.revenue)],
    ["平均入住率", percent(summary.occupancyRate)],
    ["日参考车流", `${number(summary.dailyVehicleTraffic30d)} 辆`]
  ];
  document.querySelector("#metrics").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><p class="eyebrow">${label}</p><b>${value}</b></article>`)
    .join("");
}

function renderEntityMetrics(type) {
  const entity = listForType(type)[0];
  const latest = state.data.operationRecords
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month))[0] || {};
  if (type === "newBusiness" || type === "farmhouse") {
    const metrics = type === "newBusiness"
      ? [
        ["我的新业态", entity?.name || "暂无"],
        ["业态类型", entity?.type || "暂无"],
        ["日接待能力", entity ? `${number(entity.dailyCapacity)} 人` : "暂无"],
        ["人均消费", entity ? money(entity.avgSpend) : "暂无"],
        ["经营状态", entity?.status || "暂无"],
        ["最新游客量", latest.month ? `${number(latest.visitors)} 人` : "暂无"],
        ["最新营收", latest.month ? money(latest.revenue) : "暂无"]
      ]
      : [
        ["我的农家乐", entity?.name || "暂无"],
        ["餐位 / 桌数", entity ? `${number(entity.seats)} 位 / ${number(entity.tables)} 桌` : "暂无"],
        ["人均消费", entity ? money(entity.avgSpend) : "暂无"],
        ["特色菜", entity?.specialty || "暂无"],
        ["经营状态", entity?.status || "暂无"],
        ["最新接待游客", latest.month ? `${number(latest.visitors)} 人` : "暂无"],
        ["最新营收", latest.month ? money(latest.revenue) : "暂无"]
      ];
    document.querySelector("#metrics").innerHTML = metrics
      .map(([label, value]) => `<article class="metric"><p class="eyebrow">${label}</p><b>${value}</b></article>`)
      .join("");
    return;
  }
  const metrics = type === "scenicSpot"
    ? [
      ["我的景区", entity?.name || "暂无"],
      ["日承载量", entity ? `${number(entity.dailyCapacity)} 人` : "暂无"],
      ["票价", entity ? money(entity.ticketPrice) : "暂无"],
      ["开放状态", entity?.status || "暂无"],
      ["最新游客量", latest.month ? `${number(latest.visitors)} 人` : "暂无"],
      ["最新营收", latest.month ? money(latest.revenue) : "暂无"],
      ["最近录入月份", latest.month || "暂无"]
    ]
    : [
      ["我的民宿", entity?.name || "暂无"],
      ["房间 / 床位", entity ? `${number(entity.rooms)} 间 / ${number(entity.beds)} 张` : "暂无"],
      ["平均房价", entity ? money(entity.price) : "暂无"],
      ["经营状态", entity?.status || "暂无"],
      ["最新入住人数", latest.month ? `${number(latest.guestCount)} 人` : "暂无"],
      ["最新入住率", latest.month ? percent(latest.occupancyRate) : "暂无"],
      ["最新营收", latest.month ? money(latest.revenue) : "暂无"],
      ["最近录入月份", latest.month || "暂无"]
    ];

  document.querySelector("#metrics").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><p class="eyebrow">${label}</p><b>${value}</b></article>`)
    .join("");
}

function setMetricsVisibility() {
  document.querySelector("#metrics").classList.toggle("hidden", state.activeView !== "maintainView");
}

function getEntryList() {
  if (!isAdmin()) {
    return listForType(state.user?.role);
  }
  if (state.entryType === "activity") return [{ id: "activity", name: "活动事项" }];
  return listForType(state.entryType);
}

function getSelectedEntity() {
  return getEntryList().find(item => item.id === state.selectedEntityId) || getEntryList()[0];
}

function getEntityByRecord(record) {
  if (record.targetType === "activity") return { id: "activity", name: record.activityName || "活动事项" };
  return listForType(record.targetType).find(item => item.id === record.targetId);
}

function renderEntrySelectors() {
  if (!isAdmin()) state.entryType = state.user.role;
  const list = getEntryList();
  if (!list.some(item => item.id === state.selectedEntityId)) state.selectedEntityId = list[0]?.id || "";
  document.querySelector("#entryTypeSelect").value = state.entryType;
  document.querySelector("#entryEntitySelect").innerHTML = list
    .map(item => `<option value="${item.id}" ${item.id === state.selectedEntityId ? "selected" : ""}>${item.name}</option>`)
    .join("");
  document.querySelector("#entryEntitySelect").disabled = state.entryType === "activity" || !isAdmin();
}

function renderSelectedEntityBox() {
  const entity = getSelectedEntity();
  const month = document.querySelector("#entryMonth").value;
  const typeText = getTypeText(state.entryType);
  const existing = entity ? findOperationRecord(entity.id, state.entryType, month) : null;
  document.querySelector("#openOperationBtn").textContent = existing ? "修改本月数据" : "新增本月数据";
  document.querySelector("#selectedEntityBox").innerHTML = entity
    ? `
      <p class="eyebrow">当前选择</p>
      <strong>${entity.name}</strong>
      <span>${typeText} · ${month || "未选择月份"}</span>
      <span>${existing ? "本月已有记录，点击按钮继续编辑。" : "本月尚未录入，点击按钮新增记录。"}</span>
    `
    : `<p class="eyebrow">暂无可选对象，请先在基础维护里新增。</p>`;
}

function findOperationRecord(targetId, targetType, month) {
  return state.data.operationRecords.find(item => item.targetId === targetId && item.targetType === targetType && item.month === month);
}

function renderMaintainTable() {
  const schema = schemas[state.activeMaintainTab];
  const rows = state.data[state.activeMaintainTab];
  document.querySelector("#maintainTitle").textContent = isAdmin()
    ? state.activeMaintainTab === "users" ? "账号维护" : "文旅经营主体基础情况维护"
    : `${getTypeText(state.user.role)}基础资料`;
  document.querySelector("#tableHint").textContent = isAdmin() ? schema.hint : "维护自己的基础资料；数据只展示当前账号绑定对象。";
  document.querySelector("#dataHead").innerHTML = `<tr>${schema.columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>操作</th></tr>`;
  document.querySelector("#dataRows").innerHTML = rows
    .slice()
    .sort((a, b) => String(a.name || a.displayName || a.username || "").localeCompare(String(b.name || b.displayName || b.username || ""), "zh-CN"))
    .map(item => `
      <tr>
        ${schema.columns.map(([key]) => `<td>${formatCell(key, item[key])}</td>`).join("")}
        <td>${rowActions(item.id, "maintain")}</td>
      </tr>
    `)
    .join("");
}

function renderOperationTable() {
  const rows = state.data.operationRecords;
  const columns = getOperationColumns();
  document.querySelector("#operationHead").innerHTML = `<tr>${columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>操作</th></tr>`;
  document.querySelector("#operationRows").innerHTML = rows
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month))
    .map(item => `
      <tr>
        ${columns.map(([key]) => `<td>${formatOperationCell(key, item[key], item)}</td>`).join("")}
        <td>${rowActions(item.id, "operation")}</td>
      </tr>
    `)
    .join("");
}

function getOperationColumns() {
  if (analysisMode() === "homestay") {
    return [
      ["month", "月份"],
      ["targetName", "民宿名称"],
      ["occupancyRate", "入住率"],
      ["guestCount", "入住人数"],
      ["revenue", "营收"],
      ["notes", "备注"]
    ];
  }
  if (["scenicSpot", "newBusiness", "farmhouse"].includes(analysisMode())) {
    return [
      ["month", "月份"],
      ["targetName", `${getTypeText(analysisMode())}名称`],
      ["visitors", "游客量"],
      ["revenue", "营收"],
      ["notes", "备注"]
    ];
  }
  return operationColumns;
}

function renderDailyReferenceTable() {
  if (!isAdmin()) {
    document.querySelector("#dailyHead").innerHTML = "";
    document.querySelector("#dailyRows").innerHTML = "";
    return;
  }
  const rows = state.data.dailyReferences;
  document.querySelector("#dailyHead").innerHTML = `<tr>${dailyReferenceSchema.columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>操作</th></tr>`;
  document.querySelector("#dailyRows").innerHTML = rows
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(item => `
      <tr>
        ${dailyReferenceSchema.columns.map(([key]) => `<td>${formatCell(key, item[key])}</td>`).join("")}
        <td>${rowActions(item.id, "daily")}</td>
      </tr>
    `)
    .join("");
}

function renderAnalysis(analysis) {
  renderAnalysisMonthSelector(analysis.trend || []);
  renderAnalysisMonthSituation(analysis.trend || []);
  renderTrendPanels(analysis.trend || []);
  renderBarChart("#revenueTrendChart", analysis.trend, "revenue", money);
  renderAnalysisList("#insightList", analysis.insights || []);
  renderAnalysisList("#recommendationList", analysis.recommendations || []);
  renderAdminAnalysis();
  renderActivityLinkage(analysis.trend || []);
}

function renderTrendPanels(rows) {
  const mode = analysisMode();
  const primary = primaryTrendConfig();
  const visitorPanel = document.querySelector("#visitorTrendChart").closest(".chart-panel");
  visitorPanel.querySelector("h2").textContent = primary.title;
  renderTrendSummary("#primaryTrendSummary", rows, primary.key, primary.label, primary.formatter);
  renderTrendSummary("#revenueTrendSummary", rows, "revenue", "营收", money);
  renderBarChart("#visitorTrendChart", rows, primary.key, primary.formatter);
}

function primaryTrendConfig() {
  if (analysisMode() === "homestay") {
    return { key: "guestCount", label: "入住人数", title: "入住人数变化", formatter: value => `${number(value)}人` };
  }
  return { key: "visitors", label: "游客量", title: "游客量变化", formatter: value => `${number(value)}人` };
}

function renderTrendSummary(selector, rows, key, label, formatter) {
  const latest = rows.at(-1);
  const previous = rows.at(-2);
  const sameMonthLastYear = latest ? rows.find(row => row.month === addYear(latest.month, -1)) : null;
  document.querySelector(selector).innerHTML = latest
    ? `
      <span><b>${formatter(latest[key] || 0)}</b><small>最新${label}</small></span>
      <span><b>${deltaText(latest[key], previous?.[key])}</b><small>环比</small></span>
      <span><b>${deltaText(latest[key], sameMonthLastYear?.[key])}</b><small>同比</small></span>
    `
    : `<span><b>暂无</b><small>${label}</small></span>`;
}

function addYear(month, offset) {
  if (!month) return "";
  const [year, monthIndex] = month.split("-").map(Number);
  return `${year + offset}-${String(monthIndex).padStart(2, "0")}`;
}

function deltaText(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (!currentValue || !previousValue) return "暂无";
  const change = Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return "持平";
}

function renderActivityLinkage(trendRows) {
  const records = state.data.operationRecords.filter(item => item.month === state.analysisMonth);
  const activityRecords = records.filter(item => item.targetType === "activity");
  const current = buildLinkageMetrics(state.analysisMonth, trendRows);
  const rows = [
    { name: "活动热度", value: current.activityCount, label: `${number(current.activityCount)}场`, meta: `${number(current.activityVisitors)}名活动游客` },
    { name: "车流参考", value: current.vehicleTraffic, label: `${number(current.vehicleTraffic)}辆`, meta: current.vehicleChangeText },
    { name: "景区客流", value: current.scenicVisitors, label: `${number(current.scenicVisitors)}人`, meta: current.scenicChangeText },
    { name: "民宿入住", value: current.homestayGuests, label: `${number(current.homestayGuests)}人`, meta: current.homestayChangeText },
    { name: "新业态接待", value: current.newBusinessVisitors, label: `${number(current.newBusinessVisitors)}人`, meta: current.newBusinessChangeText },
    { name: "农家乐接待", value: current.farmhouseVisitors, label: `${number(current.farmhouseVisitors)}人`, meta: current.farmhouseChangeText }
  ].filter(row => row.value > 0);
  renderLinkageBars("#activityLinkChart", rows);
  renderActivityLinkText(records, trendRows, activityRecords, current);
}

function renderLinkageBars(selector, rows) {
  const box = document.querySelector(selector);
  if (!rows.length) {
    box.innerHTML = `<p class="empty">该月暂无可用于联动分析的数据。</p>`;
    return;
  }
  const max = Math.max(...rows.map(row => row.value), 1);
  box.innerHTML = rows
    .map((row, index) => {
      const { name, value, label, meta } = row;
      const width = Math.max(6, Math.round((value / max) * 100));
      return `
        <div class="rank-row">
          <div class="rank-line">
            <span class="rank-index">${index + 1}</span>
            <strong>${name}</strong>
            <b>${label || number(value)}</b>
          </div>
          <div class="rank-track"><i style="width:${width}%"></i></div>
          <small>${meta}</small>
        </div>
      `;
    })
    .join("");
}

function renderActivityLinkText(records, trendRows, activityRecords, current) {
  const totalVisitors = current.scenicVisitors + current.newBusinessVisitors + current.farmhouseVisitors + current.activityVisitors;
  const activityShare = totalVisitors ? Math.round((current.activityVisitors / totalVisitors) * 100) : 0;
  const comparison = compareActivityMonths(trendRows);
  const activityNames = activityRecords
    .map(item => item.activityName || item.targetName)
    .filter(Boolean)
    .slice(0, 3)
    .join("、") || "暂无活动记录";
  const entityLinkText = buildEntityLinkText(records);

  document.querySelector("#activityLinkText").innerHTML = `
    <p><b>${state.analysisMonth || "当前月份"}</b> 活动：${activityNames}；活动记录 ${activityRecords.length} 场，活动游客 ${number(current.activityVisitors)} 人，活动营收 ${money(current.activityRevenue)}。</p>
    <p>同月车流 ${number(current.vehicleTraffic)} 辆，活动游客约占经营侧游客量 ${percent(activityShare)}；${comparison}</p>
    <p>${entityLinkText}</p>
    <p class="eyebrow">这里展示的是同月联动关系，不直接判定因果；活动、车流和具体主体连续录入后，判断会更可靠。</p>
  `;
}

function buildLinkageMetrics(month, trendRows) {
  const currentRecords = state.data.operationRecords.filter(item => item.month === month);
  const monthIndex = trendRows.findIndex(row => row.month === month);
  const previousMonth = monthIndex > 0 ? trendRows[monthIndex - 1].month : "";
  const previousRecords = previousMonth ? state.data.operationRecords.filter(item => item.month === previousMonth) : [];
  const daily = state.data.dailyReferences.filter(item => item.date?.startsWith(month));
  const previousDaily = previousMonth ? state.data.dailyReferences.filter(item => item.date?.startsWith(previousMonth)) : [];
  const current = summarizeRecords(currentRecords, daily);
  const previous = summarizeRecords(previousRecords, previousDaily);
  return {
    ...current,
    homestayChangeText: linkageChangeText(current.homestayGuests, previous.homestayGuests),
    scenicChangeText: linkageChangeText(current.scenicVisitors, previous.scenicVisitors),
    newBusinessChangeText: linkageChangeText(current.newBusinessVisitors, previous.newBusinessVisitors),
    farmhouseChangeText: linkageChangeText(current.farmhouseVisitors, previous.farmhouseVisitors),
    vehicleChangeText: linkageChangeText(current.vehicleTraffic, previous.vehicleTraffic)
  };
}

function summarizeRecords(records, dailyReferences) {
  return {
    activityCount: records.filter(item => item.targetType === "activity").length,
    activityVisitors: sumBy(records.filter(item => item.targetType === "activity"), "visitors"),
    activityRevenue: sumBy(records.filter(item => item.targetType === "activity"), "revenue"),
    homestayGuests: sumBy(records.filter(item => item.targetType === "homestay"), "guestCount"),
    scenicVisitors: sumBy(records.filter(item => item.targetType === "scenicSpot"), "visitors"),
    newBusinessVisitors: sumBy(records.filter(item => item.targetType === "newBusiness"), "visitors"),
    farmhouseVisitors: sumBy(records.filter(item => item.targetType === "farmhouse"), "visitors"),
    vehicleTraffic: sumBy(dailyReferences, "vehicleTraffic")
  };
}

function sumBy(rows, key) {
  return rows.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

function linkageChangeText(current, previous) {
  if (!previous) return current ? "暂无上月对照" : "暂无数据";
  const change = Math.round(((Number(current || 0) - Number(previous || 0)) / previous) * 100);
  if (change > 0) return `环比上升 ${change}%`;
  if (change < 0) return `环比下降 ${Math.abs(change)}%`;
  return "环比持平";
}

function buildEntityLinkText(records) {
  const lastMonth = previousMonthKey(state.analysisMonth);
  const previousRecords = lastMonth
    ? state.data.operationRecords.filter(item => item.month === lastMonth)
    : [];
  const businessRecords = records
    .filter(item => item.targetType !== "activity")
    .map(item => ({
      ...item,
      linkValue: item.targetType === "homestay" ? Number(item.guestCount || 0) : Number(item.visitors || 0),
      linkLabel: item.targetType === "homestay" ? `入住 ${number(item.guestCount)} 人、入住率 ${percent(item.occupancyRate || 0)}` : `游客 ${number(item.visitors)} 人`,
      changeText: entityMonthChangeText(item, previousRecords)
    }))
    .filter(item => item.linkValue > 0)
    .sort((a, b) => b.linkValue - a.linkValue)
    .slice(0, 3);

  if (!businessRecords.length) {
    return "本月还缺少具体经营主体的有效客流或入住数据，暂时无法判断活动与哪家主体更相关。";
  }

  const text = businessRecords
    .map(item => `${item.targetName}（${getTypeText(item.targetType)}，${item.linkLabel}，${item.changeText}，营收 ${money(item.revenue)}）`)
    .join("、");
  return `同月表现最值得关注的主体是：${text}。可把这些主体与本月活动放在一起复盘，判断是否适合做活动套餐、导流点位或过夜转化。`;
}

function previousMonthKey(month) {
  if (!month) return "";
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function entityMonthChangeText(record, previousRecords) {
  const previous = previousRecords.find(item => item.targetType === record.targetType && item.targetId === record.targetId);
  if (!previous) return "暂无上月对照";
  const key = record.targetType === "homestay" ? "guestCount" : "visitors";
  return linkageChangeText(Number(record[key] || 0), Number(previous[key] || 0));
}

function compareActivityMonths(trendRows) {
  if (!trendRows.length) return "暂无足够月份进行活动月对比。";
  const activityMonths = new Set(
    state.data.operationRecords
      .filter(item => item.targetType === "activity" && Number(item.visitors || 0) > 0)
      .map(item => item.month)
  );
  const activeRows = trendRows.filter(row => activityMonths.has(row.month));
  const quietRows = trendRows.filter(row => !activityMonths.has(row.month));
  if (!activeRows.length || !quietRows.length) {
    return "活动月与非活动月对照不足，建议连续维护活动记录后再观察带动效果。";
  }
  const activeVisitors = average(activeRows.map(row => row.visitors));
  const quietVisitors = average(quietRows.map(row => row.visitors));
  const activeRevenue = average(activeRows.map(row => row.revenue));
  const quietRevenue = average(quietRows.map(row => row.revenue));
  return `活动月平均游客 ${number(activeVisitors)} 人、营收 ${money(activeRevenue)}；非活动月平均游客 ${number(quietVisitors)} 人、营收 ${money(quietRevenue)}。`;
}

function renderAnalysisMonthSelector(rows) {
  const select = document.querySelector("#analysisMonthSelect");
  const months = rows.map(row => row.month);
  if (!months.length) {
    state.analysisMonth = "";
    select.innerHTML = `<option value="">暂无月度数据</option>`;
    return;
  }
  if (!state.analysisMonth || !months.includes(state.analysisMonth)) {
    state.analysisMonth = months[months.length - 1];
  }
  select.innerHTML = months
    .slice()
    .reverse()
    .map(month => `<option value="${month}" ${month === state.analysisMonth ? "selected" : ""}>${month}</option>`)
    .join("");
}

function renderAnalysisMonthSituation(rows) {
  const monthData = rows.find(row => row.month === state.analysisMonth) || {};
  const monthIndex = rows.findIndex(row => row.month === state.analysisMonth);
  const previous = monthIndex > 0 ? rows[monthIndex - 1] : {};
  const records = state.data.operationRecords
    .filter(item => item.month === state.analysisMonth)
    .sort((a, b) => String(a.targetType).localeCompare(String(b.targetType), "zh-CN"));

  const cards = getMonthCards(monthData, previous);

  document.querySelector("#analysisMonthCards").classList.toggle("compact-cards", analysisMode() !== "admin");
  renderStatCards("#analysisMonthCards", cards);
  renderAdminAlertCards(records);
  const columns = getAnalysisMonthColumns();
  document.querySelector("#analysisMonthHead").innerHTML = `${columns.map(([, label]) => `<th>${label}</th>`).join("")}<th>操作</th>`;

  document.querySelector("#analysisMonthRows").innerHTML = records.length
    ? records.map(record => `
      <tr>
        ${columns.map(([key]) => `<td>${formatAnalysisRecordCell(key, record)}</td>`).join("")}
        <td>${analysisRowActions(record.id)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="${columns.length + 1}" class="empty-cell">该月份还没有录入明细。</td></tr>`;
}

function renderAdminAlertCards(records) {
  const box = document.querySelector("#adminAlertCards");
  box.hidden = !isAdmin();
  if (!isAdmin()) return;
  const month = state.analysisMonth || state.data.operationRecords.map(item => item.month).sort().at(-1) || "";
  const missing = getMissingReports(month);
  const risks = getRiskSignals(records);
  box.innerHTML = [
    ["未报民宿", `${missing.homestays.length} 家`, missing.homestays.slice(0, 3).join("、") || "无"],
    ["未报景区", `${missing.scenicSpots.length} 个`, missing.scenicSpots.slice(0, 3).join("、") || "无"],
    ["未报新业态", `${missing.newBusinesses.length} 个`, missing.newBusinesses.slice(0, 3).join("、") || "无"],
    ["未报农家乐", `${missing.farmhouses.length} 家`, missing.farmhouses.slice(0, 3).join("、") || "无"],
    ["异常提醒", `${risks.length} 条`, risks[0] || "暂无明显异常"]
  ].map(([label, value, note]) => `
    <article class="alert-card">
      <p class="eyebrow">${label}</p>
      <b>${value}</b>
      <small>${note}</small>
    </article>
  `).join("");
}

function getMissingReports(month) {
  const homestayIds = new Set(state.data.operationRecords.filter(item => item.month === month && item.targetType === "homestay").map(item => item.targetId));
  const scenicIds = new Set(state.data.operationRecords.filter(item => item.month === month && item.targetType === "scenicSpot").map(item => item.targetId));
  const newBusinessIds = new Set(state.data.operationRecords.filter(item => item.month === month && item.targetType === "newBusiness").map(item => item.targetId));
  const farmhouseIds = new Set(state.data.operationRecords.filter(item => item.month === month && item.targetType === "farmhouse").map(item => item.targetId));
  return {
    homestays: state.data.homestays.filter(item => !homestayIds.has(item.id)).map(item => item.name),
    scenicSpots: state.data.scenicSpots.filter(item => !scenicIds.has(item.id)).map(item => item.name),
    newBusinesses: state.data.newBusinesses.filter(item => !newBusinessIds.has(item.id)).map(item => item.name),
    farmhouses: state.data.farmhouses.filter(item => !farmhouseIds.has(item.id)).map(item => item.name)
  };
}

function getRiskSignals(records) {
  const month = state.analysisMonth || records[0]?.month || "";
  const issues = [];
  const seen = new Map();

  for (const record of records) {
    const duplicateKey = `${record.targetType}:${record.targetId}:${record.month}`;
    if (record.targetType !== "activity") seen.set(duplicateKey, (seen.get(duplicateKey) || 0) + 1);
    const entity = getEntityByRecord(record);
    const revenue = Number(record.revenue || 0);
    const guests = Number(record.guestCount || 0);
    const visitors = Number(record.visitors || 0);

    if (!entity && record.targetType !== "activity") issues.push(`${record.targetName} 找不到对应基础资料，请核对绑定对象。`);
    if (["occupancyRate", "guestCount", "visitors", "revenue"].some(key => Number(record[key] || 0) < 0)) {
      issues.push(`${record.targetName} 存在负数，请核对录入。`);
    }

    if (record.targetType === "homestay") {
      if (Number(record.occupancyRate || 0) > 100) issues.push(`${record.targetName} 入住率超过 100%，请核对。`);
      if (Number(record.occupancyRate || 0) > 0 && guests === 0) issues.push(`${record.targetName} 有入住率但入住人数为 0。`);
      if (guests > 0 && revenue === 0) issues.push(`${record.targetName} 有入住但营收为 0。`);
      if (entity?.beds && guests > Number(entity.beds || 0) * daysInMonth(record.month)) {
        issues.push(`${record.targetName} 入住人数超过床位月承载参考，请核对。`);
      }
    }

    if (["scenicSpot", "newBusiness", "farmhouse"].includes(record.targetType)) {
      if (visitors > 0 && revenue === 0) issues.push(`${record.targetName} 有游客量但营收为 0。`);
      if (revenue > 0 && visitors === 0) issues.push(`${record.targetName} 有营收但游客量为 0。`);
      if (entity?.dailyCapacity && visitors > Number(entity.dailyCapacity || 0) * daysInMonth(record.month)) {
        issues.push(`${record.targetName} 游客量超过月承载参考，请核对。`);
      }
    }

    if (record.targetType === "activity") {
      if (!String(record.activityName || "").trim()) issues.push("存在未填写活动名称的活动记录。");
      if (!record.activityDate) issues.push(`${record.activityName || "活动记录"} 未填写活动日期。`);
      if (record.activityDate && !String(record.activityDate).startsWith(record.month)) {
        issues.push(`${record.activityName || "活动记录"} 的活动日期不在记录月份内。`);
      }
      if (revenue > 0 && visitors === 0) issues.push(`${record.activityName || "活动记录"} 有营收但活动游客为 0。`);
    }

    const previous = previousRecordFor(record);
    const currentMainValue = mainRecordValue(record);
    const previousMainValue = previous ? mainRecordValue(previous) : 0;
    if (previousMainValue > 0 && currentMainValue > previousMainValue * 3) {
      issues.push(`${record.targetName} 较上月增长超过 200%，建议核对是否漏填或重复填报。`);
    }
    if (previousMainValue > 0 && currentMainValue < previousMainValue * 0.3) {
      issues.push(`${record.targetName} 较上月下降超过 70%，建议核对是否漏填。`);
    }
  }

  for (const [key, count] of seen.entries()) {
    if (count > 1) {
      const [, targetId] = key.split(":");
      const record = records.find(item => item.targetId === targetId);
      issues.push(`${record?.targetName || "某经营主体"} 本月存在重复记录，请合并核对。`);
    }
  }

  const dailyReferences = state.data.dailyReferences.filter(item => item.date?.startsWith(month));
  for (const item of dailyReferences) {
    if (Number(item.vehicleTraffic || 0) < 0 || Number(item.visitors || 0) < 0) issues.push(`${item.date} 日参考数据存在负数。`);
    if (Number(item.visitors || 0) > 0 && Number(item.vehicleTraffic || 0) === 0) issues.push(`${item.date} 有游客量但车流量为 0，请核对。`);
    if (item.parkingPressure === "高" && Number(item.vehicleTraffic || 0) < 100) issues.push(`${item.date} 停车压力为高但车流量较低，请核对。`);
  }

  return [...new Set(issues)];
}

function daysInMonth(month) {
  if (!month) return 31;
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function previousRecordFor(record) {
  const previousMonth = previousMonthKey(record.month);
  return state.data.operationRecords.find(item =>
    item.month === previousMonth &&
    item.targetType === record.targetType &&
    item.targetId === record.targetId
  );
}

function mainRecordValue(record) {
  if (record.targetType === "homestay") return Number(record.guestCount || 0);
  return Number(record.visitors || 0);
}

function renderAdminAnalysis() {
  const admin = isAdmin();
  document.querySelectorAll(".admin-analysis").forEach(panel => {
    panel.hidden = !admin;
  });
  if (!admin) return;

  const month = state.analysisMonth || state.data.operationRecords.map(item => item.month).sort().at(-1) || "";
  const records = state.data.operationRecords.filter(item => item.month === month);
  const homestayRecords = records.filter(item => item.targetType === "homestay");
  const scenicRecords = records.filter(item => ["scenicSpot", "newBusiness", "farmhouse"].includes(item.targetType));

  renderRankChart("#homestayRankList", homestayRecords
    .slice()
    .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
    .slice(0, 5)
    .map(record => ({
      name: record.targetName,
      value: Number(record.revenue || 0),
      label: money(record.revenue),
      meta: `入住率 ${percent(record.occupancyRate)} · 入住 ${number(record.guestCount)} 人`
    })));

  renderRankChart("#scenicRankList", scenicRecords
    .slice()
    .sort((a, b) => Number(b.visitors || 0) - Number(a.visitors || 0))
    .slice(0, 5)
    .map(record => ({
      name: record.targetName,
      value: Number(record.visitors || 0),
      label: `${number(record.visitors)} 人`,
      meta: `类型 ${getTypeText(record.targetType)} · 营收 ${money(record.revenue)}`
    })));

  const risks = [
    ...getRiskSignals(records),
    ...homestayRecords
      .filter(record => Number(record.occupancyRate || 0) >= 90)
      .map(record => `${record.targetName} 入住率已达 ${percent(record.occupancyRate)}，建议关注接待与服务压力。`),
    ...homestayRecords
      .filter(record => Number(record.occupancyRate || 0) > 0 && Number(record.occupancyRate || 0) <= 35)
      .map(record => `${record.targetName} 入住率偏低，建议联动活动或渠道促销。`),
  ];
  renderAnalysisList("#riskSignalList", risks.slice(0, 6));

  const missingReports = getMissingReports(month);
  const missing = [
    ...missingReports.homestays.map(name => `${name} 尚未录入 ${month || "本月"} 民宿运营数据。`),
    ...missingReports.scenicSpots.map(name => `${name} 尚未录入 ${month || "本月"} 景区运营数据。`),
    ...missingReports.newBusinesses.map(name => `${name} 尚未录入 ${month || "本月"} 新业态运营数据。`),
    ...missingReports.farmhouses.map(name => `${name} 尚未录入 ${month || "本月"} 农家乐运营数据。`)
  ];
  renderAnalysisList("#missingDataList", missing.slice(0, 8));
}

function renderRankChart(selector, rows) {
  const box = document.querySelector(selector);
  if (!rows.length) {
    box.innerHTML = `<p class="empty">暂无排行数据。</p>`;
    return;
  }
  const max = Math.max(...rows.map(row => row.value), 1);
  box.innerHTML = rows.map((row, index) => {
    const width = Math.max(6, Math.round((row.value / max) * 100));
    return `
      <div class="rank-row">
        <div class="rank-line">
          <span class="rank-index">${index + 1}</span>
          <strong>${row.name}</strong>
          <b>${row.label}</b>
        </div>
        <div class="rank-track"><i style="width:${width}%"></i></div>
        <small>${row.meta}</small>
      </div>
    `;
  }).join("");
}

function getMonthCards(monthData, previous) {
  if (analysisMode() === "homestay") {
    return [
      { icon: "宿", label: "本月入住人数", value: monthData.month ? `${number(monthData.guestCount)} 人` : "暂无", delta: compareText(monthData.guestCount, previous.guestCount) },
      { icon: "率", label: "本月平均入住率", value: monthData.month ? percent(monthData.occupancyRate) : "暂无", delta: compareText(monthData.occupancyRate, previous.occupancyRate, "百分点") },
      { icon: "营", label: "本月营收", value: monthData.month ? money(monthData.revenue) : "暂无", delta: compareText(monthData.revenue, previous.revenue), tone: "gold" }
    ];
  }
  if (["scenicSpot", "newBusiness", "farmhouse"].includes(analysisMode())) {
    return [
      { icon: "客", label: "本月游客量", value: monthData.month ? `${number(monthData.visitors)} 人` : "暂无", delta: compareText(monthData.visitors, previous.visitors) },
      { icon: "营", label: "本月营收", value: monthData.month ? money(monthData.revenue) : "暂无", delta: compareText(monthData.revenue, previous.revenue), tone: "gold" }
    ];
  }
  return [
    { icon: "客", label: "本月游客量", value: monthData.month ? `${number(monthData.visitors)} 人` : "暂无", delta: compareText(monthData.visitors, previous.visitors) },
    { icon: "宿", label: "本月入住人数", value: monthData.month ? `${number(monthData.guestCount)} 人` : "暂无", delta: compareText(monthData.guestCount, previous.guestCount) },
    { icon: "率", label: "本月平均入住率", value: monthData.month ? percent(monthData.occupancyRate) : "暂无", delta: compareText(monthData.occupancyRate, previous.occupancyRate, "百分点") },
    { icon: "车", label: "本月车流量", value: monthData.month ? `${number(monthData.vehicleTraffic)} 辆` : "暂无", delta: compareText(monthData.vehicleTraffic, previous.vehicleTraffic) },
    { icon: "营", label: "本月营收", value: monthData.month ? money(monthData.revenue) : "暂无", delta: compareText(monthData.revenue, previous.revenue), tone: "gold" },
    { icon: "活", label: "活动记录", value: monthData.month ? `${number(monthData.activityCount)} 条` : "暂无", delta: compareText(monthData.activityCount, previous.activityCount) }
  ];
}

function getAnalysisMonthColumns() {
  if (analysisMode() === "homestay") {
    return [
      ["targetName", "民宿名称"],
      ["occupancyRate", "入住率"],
      ["guestCount", "入住人数"],
      ["revenue", "营收"],
      ["notes", "备注"]
    ];
  }
  if (["scenicSpot", "newBusiness", "farmhouse"].includes(analysisMode())) {
    return [
      ["targetName", `${getTypeText(analysisMode())}名称`],
      ["visitors", "游客量"],
      ["revenue", "营收"],
      ["notes", "备注"]
    ];
  }
  return [
    ["targetName", "对象"],
      ["targetType", "类型"],
      ["occupancyRate", "入住率"],
      ["guestCount", "入住人数"],
      ["visitors", "游客量"],
      ["revenue", "营收"],
      ["notes", "活动/备注"]
  ];
}

function formatAnalysisRecordCell(key, record) {
  if (key === "targetName") return formatOperationCell("targetName", record.targetName, record);
  if (key === "targetType") return formatOperationCell("targetType", record.targetType, record);
  if (key === "occupancyRate") return record.targetType === "homestay" ? percent(record.occupancyRate) : "-";
  if (key === "guestCount") return record.targetType === "homestay" ? `${number(record.guestCount)} 人` : "-";
  if (key === "visitors") return record.targetType !== "homestay" ? `${number(record.visitors)} 人` : "-";
  if (key === "vehicleTraffic") return record.targetType !== "homestay" ? `${number(record.vehicleTraffic)} 辆` : "-";
  if (key === "revenue") return money(record.revenue);
  if (key === "notes") return record.activityName || record.notes || "-";
  return formatCell(key, record[key]);
}

function renderStatCards(selector, cards) {
  document.querySelector(selector).innerHTML = cards
    .map(card => `
      <article class="analysis-card ${card.tone === "gold" ? "gold" : ""}">
        <span class="stat-icon">${card.icon}</span>
        <span class="stat-body">
          <p class="eyebrow">${card.label}</p>
          <b>${card.value}</b>
          <small class="${card.delta?.startsWith("下降") ? "down" : ""}">${card.delta || "暂无对比"}</small>
        </span>
      </article>
    `)
    .join("");
}

function compareText(current, previous, unit = "%") {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (!currentValue || !previousValue) return "暂无环比";
  if (unit === "百分点") {
    const change = Math.round((currentValue - previousValue) * 100) / 100;
    if (change > 0) return `上升 ${change} 个百分点`;
    if (change < 0) return `下降 ${Math.abs(change)} 个百分点`;
    return "基本持平";
  }
  const change = Math.round(((currentValue - previousValue) / previousValue) * 10000) / 100;
  if (change > 0) return `上升 ${change}${unit}`;
  if (change < 0) return `下降 ${Math.abs(change)}${unit}`;
  return "基本持平";
}

function renderAnalysisList(selector, rows) {
  const box = document.querySelector(selector);
  if (!rows.length) {
    box.innerHTML = `<p class="empty">暂无足够数据形成判断。</p>`;
    return;
  }
  box.innerHTML = rows.map(item => `<p class="analysis-item">${item}</p>`).join("");
}

function renderNetworkFeedback() {
  if (!isAdmin()) return;
  const months = [...new Set([
    ...mockNetworkFeedback.map(item => item.month),
    ...state.data.operationRecords.map(item => item.month)
  ].filter(Boolean))].sort();
  if (!state.feedbackMonth || !months.includes(state.feedbackMonth)) {
    state.feedbackMonth = state.analysisMonth || months.at(-1) || "";
  }
  const select = document.querySelector("#feedbackMonthSelect");
  select.innerHTML = months.length
    ? months.slice().reverse().map(month => `<option value="${month}" ${month === state.feedbackMonth ? "selected" : ""}>${month}</option>`).join("")
    : `<option value="">暂无月份</option>`;

  const rows = mockNetworkFeedback.filter(item => item.month === state.feedbackMonth);
  const positive = rows.filter(item => item.sentiment === "positive").length;
  const neutral = rows.filter(item => item.sentiment === "neutral").length;
  const negative = rows.filter(item => item.sentiment === "negative").length;
  const heat = rows.reduce((sum, item) => sum + Number(item.heat || 0), 0);
  const platforms = countBy(rows, "platform");
  const tags = countTags(rows);
  const negativeTags = countTags(rows.filter(item => item.sentiment === "negative"));
  const topPlatform = Object.entries(platforms).sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";

  renderStatCards("#feedbackCards", [
    { icon: "声", label: "网络声量", value: `${number(rows.length)} 条`, delta: `模拟热度 ${number(heat)}` },
    { icon: "赞", label: "正面反馈", value: `${number(positive)} 条`, delta: rows.length ? `占比 ${percent(Math.round((positive / rows.length) * 100))}` : "暂无" },
    { icon: "险", label: "负面反馈", value: `${number(negative)} 条`, delta: negative ? `${Object.keys(negativeTags).slice(0, 2).join("、")} 需关注` : "暂无明显风险", tone: negative ? "gold" : "" },
    { icon: "台", label: "主要平台", value: topPlatform, delta: `覆盖 ${number(Object.keys(platforms).length)} 个平台` }
  ]);

  renderFeedbackSources();
  renderFeedbackKeywords();
  renderFeedbackPlatformChart(platforms);
  renderFeedbackTags(tags, negativeTags);
  renderFeedbackRows(rows);
  renderFeedbackReport(rows, { positive, neutral, negative, heat, platforms, tags, negativeTags });
}

function renderFeedbackSources() {
  document.querySelector("#feedbackSources").innerHTML = feedbackSources.map(source => `
    <article class="source-card ${source.status === "启用" ? "active" : ""}">
      <div>
        <strong>${source.name}</strong>
        <span>${source.type} · ${source.mode}</span>
      </div>
      <b>${source.status}</b>
      <p>${source.note}</p>
    </article>
  `).join("");
}

function renderFeedbackKeywords() {
  document.querySelector("#feedbackKeywords").innerHTML = feedbackKeywords
    .map(keyword => `<span>${keyword}</span>`)
    .join("");
}

function countBy(rows, key) {
  return rows.reduce((result, item) => {
    result[item[key]] = (result[item[key]] || 0) + 1;
    return result;
  }, {});
}

function countTags(rows) {
  return rows.flatMap(item => item.tags || []).reduce((result, tag) => {
    result[tag] = (result[tag] || 0) + 1;
    return result;
  }, {});
}

function renderFeedbackPlatformChart(platforms) {
  const rows = Object.entries(platforms)
    .map(([name, value]) => ({ name, value, label: `${number(value)} 条`, meta: "模拟采集记录" }))
    .sort((a, b) => b.value - a.value);
  renderLinkageBars("#feedbackPlatformChart", rows);
}

function renderFeedbackTags(tags, negativeTags) {
  const allTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);
  document.querySelector("#feedbackTagCloud").innerHTML = allTags.length
    ? allTags.map(([tag, count]) => `<span class="${negativeTags[tag] ? "warning" : ""}">${tag}<b>${count}</b></span>`).join("")
    : `<p class="empty">暂无标签。</p>`;
}

function renderFeedbackRows(rows) {
  document.querySelector("#feedbackRows").innerHTML = rows.length
    ? rows.map(item => `
      <tr>
        <td>${item.platform}</td>
        <td>${item.keyword}</td>
        <td><b>${item.title}</b><br><span class="eyebrow">${item.content}</span></td>
        <td>${getTypeText(item.targetType)} · ${item.targetName}</td>
        <td><span class="sentiment ${item.sentiment}">${sentimentText(item.sentiment)}</span></td>
        <td>${(item.tags || []).join("、")}</td>
        <td>${number(item.heat)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7" class="empty-cell">该月份暂无模拟反馈。</td></tr>`;
}

function renderFeedbackReport(rows, summary) {
  const topTags = Object.entries(summary.tags).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
  const riskTags = Object.entries(summary.negativeTags).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag);
  const topObjects = Object.entries(countBy(rows, "targetName")).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  const month = state.feedbackMonth || "当前月份";
  const generatedAt = state.feedbackGeneratedAt || "尚未手动生成，本页显示模拟草稿";
  const positiveRate = rows.length ? Math.round((summary.positive / rows.length) * 100) : 0;
  const negativeRate = rows.length ? Math.round((summary.negative / rows.length) * 100) : 0;
  document.querySelector("#feedbackReport").innerHTML = `
    <p class="eyebrow">报告状态：${generatedAt}；计划任务：每月28日自动全局搜索</p>
    <h3>${month} 大岚镇网络反馈研判</h3>
    <p>本月模拟采集 ${number(rows.length)} 条网络反馈，覆盖 ${Object.keys(summary.platforms).join("、") || "暂无平台"}；综合热度 ${number(summary.heat)}。反馈整体以正面为主，正面占比 ${positiveRate}%，负面占比 ${negativeRate}%。</p>
    <p>游客主要关注 ${topTags.join("、") || "暂无明显高频词"}；被提及较多的对象为 ${topObjects.join("、") || "暂无"}。</p>
    <p>${riskTags.length ? `需要重点跟进 ${riskTags.join("、")} 等问题，建议结合节假日车流、活动安排和现场服务进行排查。` : "暂未发现集中负面风险，可继续观察平台声量变化。"}</p>
    <p>建议下月将平台反馈较好的景区、民宿和新业态组合成主题线路，同时对负面标签进行闭环整改，形成“网络反馈 - 现场处置 - 经营提升”的月度机制。</p>
  `;
}

function sentimentText(value) {
  return { positive: "正面", neutral: "中性", negative: "负面" }[value] || "中性";
}

function renderBarChart(selector, rows, key, formatter) {
  const chart = document.querySelector(selector);
  if (!rows.length) {
    chart.innerHTML = `<p class="empty">暂无月度运维数据，先在“运维录入”里录入。</p>`;
    return;
  }
  const max = Math.max(...rows.map(row => Number(row[key]) || 0), 1);
  chart.innerHTML = rows
    .map(row => {
      const value = Number(row[key]) || 0;
      const height = value > 0 ? Math.max(8, Math.round((value / max) * 100)) : 4;
      return `<div class="bar" style="height:${height}%"><span>${formatter(value)}</span><small>${row.month}</small></div>`;
    })
    .join("");
}

function rowActions(id, scope) {
  if (!isAdmin() && scope === "maintain") {
    return `
      <div class="row-actions">
        <button class="ghost" data-scope="${scope}" data-edit="${id}">编辑</button>
      </div>
    `;
  }
  return `
    <div class="row-actions">
      <button class="ghost" data-scope="${scope}" data-edit="${id}">编辑</button>
      <button class="danger" data-scope="${scope}" data-delete="${id}">删除</button>
    </div>
  `;
}

function analysisRowActions(id) {
  return `
    <div class="row-actions">
      <button class="ghost" data-analysis-edit="${id}">修改</button>
    </div>
  `;
}

function formatOperationCell(key, value, item) {
  if (key === "targetType") return getTypeText(value);
  if (key === "activityName") return value ? `${value}${item.activityDate ? `<br><span class="eyebrow">${item.activityDate}</span>` : ""}` : "";
  return formatCell(key, value);
}

function getTypeText(type) {
  if (type === "scenicSpot") return "景区";
  if (type === "newBusiness") return "新业态";
  if (type === "farmhouse") return "农家乐";
  if (type === "activity") return "活动";
  return "民宿";
}

function formatCell(key, value) {
  if (key === "revenue" || key === "price" || key === "ticketPrice" || key === "avgSpend") return money(value);
  if (key === "occupancyRate") return value ? percent(value) : "";
  if (key === "role") return roleText(value);
  if (key === "updatedAt") return value ? String(value).slice(0, 10) : "";
  if (numberFields.has(key)) return value ? number(value) : "";
  return value || "";
}

function openMaintainDialog(item = null) {
  const schema = schemas[state.activeMaintainTab];
  const seed = item || (state.activeMaintainTab === "users" ? defaultUserSeed() : null);
  state.editing = { scope: "maintain", item };
  openDialog(`${item ? "编辑" : "新增"}${schema.title}`, schema.fields, seed);
}

function defaultUserSeed(role = "homestay") {
  const list = listForType(role);
  const entity = list[0] || {};
  return {
    role,
    entityId: entity.id || "",
    displayName: entity.name || "",
    username: makeUsername(entity.name || role),
    password: "dl123"
  };
}

function openSelectedOperationDialog() {
  const entity = getSelectedEntity();
  const month = document.querySelector("#entryMonth").value;
  if (!entity || !month) {
    alert("请先选择对象和月份。");
    return;
  }
  const targetId = state.entryType === "activity" ? "activity" : entity.id;
  const existing = findOperationRecord(targetId, state.entryType, month);
  const seed = existing || {
    month,
    targetType: state.entryType,
    targetId,
    occupancyRate: 0,
    guestCount: 0,
    visitors: 0,
    vehicleTraffic: 0,
    revenue: 0,
    activityDate: "",
    activityName: "",
    notes: ""
  };
  openOperationDialog(seed, existing || null);
}

function openOperationDialog(seed, existingItem = seed) {
  state.editing = { scope: "operation", item: existingItem };
  openDialog(`${existingItem ? "编辑" : "新增"}${getTypeText(seed.targetType)}月度数据`, getOperationFields(seed), seed);
}

function getOperationFields(record) {
  const entity = getEntityByRecord(record) || getSelectedEntity();
  const common = [
    ["month", "月份", "hidden"],
    ["targetType", "对象类型", "hidden"],
    ["targetId", "具体对象", "hidden"],
    ["monthDisplay", "月份", "readonly", record.month],
    ["typeDisplay", "对象类型", "readonly", getTypeText(record.targetType)]
  ];

  if (record.targetType === "homestay") {
    return [
      ...common,
      ["entityName", "民宿名称", "readonly", entity?.name || ""],
      ["roomsSnapshot", "房间数", "readonly", entity?.rooms || 0],
      ["bedsSnapshot", "床位数", "readonly", entity?.beds || 0],
      ["occupancyRate", "入住率(%)", "number"],
      ["guestCount", "入住人数", "number"],
      ["revenue", "营收", "number"],
      ["notes", "备注", "text"]
    ];
  }

  if (record.targetType === "scenicSpot") {
    return [
      ...common,
      ["entityName", "景区名称", "readonly", entity?.name || ""],
      ["capacitySnapshot", "日承载量", "readonly", entity?.dailyCapacity || 0],
      ["ticketSnapshot", "票价", "readonly", entity?.ticketPrice || 0],
      ["visitors", "游客量", "number"],
      ["revenue", "营收", "number"],
      ["notes", "备注", "text"]
    ];
  }

  if (record.targetType === "newBusiness") {
    return [
      ...common,
      ["entityName", "新业态名称", "readonly", entity?.name || ""],
      ["typeSnapshot", "业态类型", "readonly", entity?.type || ""],
      ["capacitySnapshot", "日接待能力", "readonly", entity?.dailyCapacity || 0],
      ["visitors", "接待游客量", "number"],
      ["revenue", "营收", "number"],
      ["notes", "备注", "text"]
    ];
  }

  if (record.targetType === "farmhouse") {
    return [
      ...common,
      ["entityName", "农家乐名称", "readonly", entity?.name || ""],
      ["seatsSnapshot", "餐位数", "readonly", entity?.seats || 0],
      ["tablesSnapshot", "餐桌数", "readonly", entity?.tables || 0],
      ["visitors", "接待游客量", "number"],
      ["revenue", "营收", "number"],
      ["notes", "备注", "text"]
    ];
  }

  return [
    ["month", "月份", "hidden"],
    ["targetType", "对象类型", "hidden"],
    ["targetId", "具体对象", "hidden"],
    ["monthDisplay", "月份", "readonly", record.month],
    ["typeDisplay", "对象类型", "readonly", "活动"],
    ["activityDate", "活动日期", "date"],
    ["activityName", "活动名称", "text"],
    ["visitors", "参与/带动游客量", "number"],
    ["revenue", "带动营收", "number"],
    ["notes", "活动说明", "text"]
  ];
}

function openDailyDialog(item = null) {
  state.editing = { scope: "daily", item };
  openDialog(`${item ? "编辑" : "新增"}日参考参数`, dailyReferenceSchema.fields, item);
}

function openDialog(title, fields, item) {
  document.querySelector("#dialogTitle").textContent = title;
  document.querySelector("#editFields").innerHTML = fields
    .map(field => renderField(field, item))
    .join("");
  document.querySelector("#editDialog").showModal();
}

function renderField(field, item) {
  const [key, label, type, explicitValue] = field;
  const value = explicitValue ?? item?.[key] ?? "";
  const full = key === "notes" || type === "entitySelect" || type === "readonly" ? " full" : "";

  if (type === "hidden") return `<input name="${key}" type="hidden" value="${escapeAttr(value)}" />`;
  if (type === "readonly") {
    return `<label class="${full}">${label}<input class="readonly-input" type="text" value="${escapeAttr(value)}" readonly /></label>`;
  }
  if (type === "entityType") {
    return `
      <label class="${full}">${label}
        <select name="${key}" data-dialog-target-type>
          <option value="homestay" ${value === "homestay" ? "selected" : ""}>民宿</option>
          <option value="scenicSpot" ${value === "scenicSpot" ? "selected" : ""}>景区</option>
          <option value="newBusiness" ${value === "newBusiness" ? "selected" : ""}>新业态</option>
          <option value="farmhouse" ${value === "farmhouse" ? "selected" : ""}>农家乐</option>
          <option value="activity" ${value === "activity" ? "selected" : ""}>活动</option>
        </select>
      </label>
    `;
  }
  if (type === "entitySelect") {
    const disabled = item?.targetType === "activity" ? "disabled" : "";
    const hidden = disabled ? `<input name="${key}" type="hidden" value="activity" />` : "";
    return `<label class="${full}">${label}<select name="${key}" data-dialog-target-id ${disabled}>${entityOptionHtml(item?.targetType || "homestay", value)}</select>${hidden}</label>`;
  }
  if (type === "pressure") {
    return `
      <label class="${full}">${label}
        <select name="${key}">
          ${["低", "中", "高"].map(option => `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (type === "userRole") {
    return `
      <label class="${full}">${label}
        <select name="${key}" data-user-role>
          <option value="homestay" ${value === "homestay" ? "selected" : ""}>民宿端</option>
          <option value="scenicSpot" ${value === "scenicSpot" ? "selected" : ""}>景区端</option>
          <option value="newBusiness" ${value === "newBusiness" ? "selected" : ""}>新业态端</option>
          <option value="farmhouse" ${value === "farmhouse" ? "selected" : ""}>农家乐端</option>
          <option value="admin" ${value === "admin" ? "selected" : ""}>管理员</option>
        </select>
      </label>
    `;
  }
  if (type === "userEntitySelect") {
    return `<label class="${full}">${label}<select name="${key}" data-user-entity>${userEntityOptions(item?.role || "homestay", value)}</select></label>`;
  }
  return `<label class="${full}">${label}<input name="${key}" type="${type}" value="${escapeAttr(value)}" /></label>`;
}

function userEntityOptions(role, selectedId = "") {
  if (role === "admin") return `<option value="">全镇管理</option>`;
  const list = listForType(role);
  return list.map(item => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${item.name}</option>`).join("");
}

function entityOptionHtml(type, selectedId = "") {
  if (type === "activity") return `<option value="activity">活动事项</option>`;
  const list = listForType(type);
  return list.map(item => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${item.name}</option>`).join("");
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function makeUsername(name) {
  const initialMap = {
    茶: "c", 山: "s", 小: "x", 院: "y", 溪: "x", 谷: "g", 人: "r", 家: "j",
    云: "y", 岭: "l", 居: "j", 民: "m", 宿: "s", 丹: "d", 赤: "c", 水: "s",
    大: "d", 岚: "l", 镇: "z", 竹: "z", 海: "h", 亭: "t", 梅: "m", 园: "y",
    湖: "h", 湾: "w", 村: "c", 庄: "z", 客: "k", 栈: "z", 景: "j", 区: "q",
    管: "g", 理: "l", 员: "y", 新: "x", 业: "y", 态: "t", 农: "n", 乐: "l",
    咖: "k", 啡: "f", 漂: "p", 流: "l", 露: "l", 营: "y", 基: "j", 地: "d"
  };
  const initials = String(name || "")
    .split("")
    .map(char => /[a-z0-9]/i.test(char) ? char.toLowerCase() : initialMap[char] || "")
    .join("")
    .replace(/[^a-z0-9]/g, "");
  return initials || `user${Date.now().toString().slice(-4)}`;
}

function syncUserDefaults() {
  const role = document.querySelector("[name='role']")?.value || "homestay";
  const entitySelect = document.querySelector("[data-user-entity]");
  if (!entitySelect) return;
  const currentEntityId = entitySelect.value;
  entitySelect.innerHTML = userEntityOptions(role, currentEntityId);
  const selectedText = entitySelect.options[entitySelect.selectedIndex]?.text || "";
  const displayName = document.querySelector("[name='displayName']");
  const username = document.querySelector("[name='username']");
  if (displayName && !state.editing?.item) displayName.value = role === "admin" ? "管理员" : selectedText;
  if (username && !state.editing?.item) username.value = makeUsername(role === "admin" ? "管理员" : selectedText);
}

function readForm(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  for (const key of Object.keys(payload)) {
    if (numberFields.has(key)) payload[key] = Number(payload[key] || 0);
  }
  if (state.editing?.scope === "maintain" && state.activeMaintainTab === "users") {
    if (payload.role === "admin") payload.entityId = "";
    return payload;
  }
  return normalizeOperationPayload(payload);
}

function normalizeOperationPayload(payload) {
  if (!payload.targetType) return payload;
  payload.vehicleTraffic = 0;
  if (payload.targetType === "homestay") {
    payload.visitors = 0;
    payload.activityDate = "";
    payload.activityName = "";
  }
  if (payload.targetType === "scenicSpot") {
    payload.occupancyRate = 0;
    payload.guestCount = 0;
    payload.activityDate = "";
    payload.activityName = "";
  }
  if (payload.targetType === "newBusiness" || payload.targetType === "farmhouse") {
    payload.occupancyRate = 0;
    payload.guestCount = 0;
    payload.activityDate = "";
    payload.activityName = "";
  }
  if (payload.targetType === "activity") {
    payload.targetId = "activity";
    payload.occupancyRate = 0;
    payload.guestCount = 0;
  }
  return payload;
}

function validateOperationPayload(payload) {
  if (!payload.month) return "请选择记录月份。";
  if (!payload.targetType) return "请选择对象类型。";
  if (!payload.targetId) return "请选择具体对象。";
  for (const field of ["occupancyRate", "guestCount", "visitors", "revenue"]) {
    if (Number(payload[field] || 0) < 0) return "录入数据不能为负数。";
  }
  if (payload.targetType === "homestay" && Number(payload.occupancyRate || 0) > 100) {
    return "民宿入住率不能超过 100%。";
  }
  if (payload.targetType === "activity") {
    if (!String(payload.activityName || "").trim()) return "活动记录需要填写活动名称。";
    if (!payload.activityDate) return "活动记录需要填写活动日期。";
    if (!String(payload.activityDate).startsWith(payload.month)) return "活动日期应在记录月份内。";
  }
  return "";
}

function validateDailyPayload(payload) {
  if (!payload.date) return "请选择日期。";
  if (Number(payload.vehicleTraffic || 0) < 0 || Number(payload.visitors || 0) < 0) {
    return "日参考数据不能为负数。";
  }
  return "";
}

async function saveDialog(event) {
  event.preventDefault();
  const payload = readForm(event.currentTarget);
  const editing = state.editing;
  const resource = editing.scope === "operation" ? "operationRecords" : editing.scope === "daily" ? "dailyReferences" : state.activeMaintainTab;

  const message = resource === "operationRecords"
    ? validateOperationPayload(payload)
    : resource === "dailyReferences" ? validateDailyPayload(payload) : "";
  if (message) {
    alert(message);
    return;
  }

  try {
    if (editing.item) {
      await api(`/api/${resource}/${editing.item.id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api(`/api/${resource}`, { method: "POST", body: JSON.stringify(payload) });
    }
    document.querySelector("#editDialog").close();
    await loadAll();
    if (resource === "users" && isAdmin()) {
      state.data.users = enrichUsers(await api("/api/users"), state.data.homestays, state.data.scenicSpots, state.data.newBusinesses, state.data.farmhouses);
      renderMaintainTable();
    }
  } catch (error) {
    alert(error.message);
  }
}

async function deleteItem(scope, id) {
  const resource = scope === "operation" ? "operationRecords" : scope === "daily" ? "dailyReferences" : state.activeMaintainTab;
  if (!confirm("确定删除这条数据吗？")) return;
  await api(`/api/${resource}/${id}`, { method: "DELETE" });
  await loadAll();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dalan-tourism-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function setDefaultMonth() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const input = document.querySelector("#entryMonth");
  if (input && !input.value) input.value = month;
}

document.querySelector("#editForm").addEventListener("submit", saveDialog);
document.querySelector("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    const result = await api("/api/login", { method: "POST", body: JSON.stringify(payload) });
    state.user = result.user;
    hideLogin();
    state.selectedEntityId = "";
    await loadAll();
  } catch (error) {
    alert(error.message);
  }
});
document.querySelector(".demo-accounts").addEventListener("click", event => {
  const button = event.target.closest("[data-demo-user]");
  if (!button) return;
  document.querySelector("#loginForm [name='username']").value = button.dataset.demoUser;
  document.querySelector("#loginForm [name='password']").value = button.dataset.demoPass;
});
document.querySelector("#addBtn").addEventListener("click", () => openMaintainDialog());
document.querySelector("#refreshBtn").addEventListener("click", loadAll);
document.querySelector("#exportBtn").addEventListener("click", exportData);
document.querySelector("#passwordBtn").addEventListener("click", () => {
  document.querySelector("#passwordForm").reset();
  document.querySelector("#passwordDialog").showModal();
});
document.querySelector("#logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
  state.user = null;
  showLogin();
});
document.querySelector("#openOperationBtn").addEventListener("click", openSelectedOperationDialog);
document.querySelector("#openDailyBtn").addEventListener("click", () => openDailyDialog());
document.querySelector("#entryMonth").addEventListener("change", renderSelectedEntityBox);
document.querySelector("#entryTypeSelect").addEventListener("change", event => {
  if (!isAdmin()) return;
  state.entryType = event.target.value;
  state.selectedEntityId = "";
  renderEntrySelectors();
  renderSelectedEntityBox();
});
document.querySelector("#entryEntitySelect").addEventListener("change", event => {
  state.selectedEntityId = event.target.value;
  renderSelectedEntityBox();
});
document.querySelector("#analysisMonthSelect").addEventListener("change", event => {
  state.analysisMonth = event.target.value;
  api("/api/analysis").then(renderAnalysis).catch(error => alert(error.message));
});

document.querySelector("#feedbackMonthSelect").addEventListener("change", event => {
  state.feedbackMonth = event.target.value;
  state.feedbackGeneratedAt = "";
  renderNetworkFeedback();
});

document.querySelector("#generateFeedbackBtn").addEventListener("click", () => {
  const now = new Date();
  state.feedbackGeneratedAt = `手动搜索并生成于 ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  renderNetworkFeedback();
});

document.querySelector("#analysisMonthRows").addEventListener("click", event => {
  const editId = event.target.dataset.analysisEdit;
  if (!editId) return;
  const record = state.data.operationRecords.find(item => item.id === editId);
  if (record) openOperationDialog(record);
});

document.querySelector("#editDialog").addEventListener("click", event => {
  if (event.target.matches("[data-close-dialog]")) document.querySelector("#editDialog").close();
});

document.querySelector("#passwordDialog").addEventListener("click", event => {
  if (event.target.matches("[data-close-password]")) document.querySelector("#passwordDialog").close();
});

document.querySelector("#passwordForm").addEventListener("submit", async event => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await api("/api/changePassword", { method: "POST", body: JSON.stringify(payload) });
    document.querySelector("#passwordDialog").close();
    alert("密码已修改");
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector("#editFields").addEventListener("change", event => {
  if (event.target.matches("[data-dialog-target-type]")) {
    const nextType = event.target.value;
    const existing = state.editing?.item || {};
    const seed = {
      ...existing,
      targetType: nextType,
      targetId: nextType === "activity" ? "activity" : entityOptionHtml(nextType) ? getListForType(nextType)[0]?.id : "",
      month: document.querySelector("[name='month']")?.value || existing.month || document.querySelector("#entryMonth").value
    };
    openOperationDialog(seed, state.editing?.item?.id ? state.editing.item : null);
  }
  if (event.target.matches("[data-user-role], [data-user-entity]")) syncUserDefaults();
});

function getListForType(type) {
  if (type === "activity") return [{ id: "activity", name: "活动事项" }];
  return listForType(type);
}

document.querySelector(".module-nav").addEventListener("click", event => {
  const button = event.target.closest(".module-tab");
  if (!button) return;
  if (button.dataset.view === "feedbackView" && !isAdmin()) return;
  state.activeView = button.dataset.view;
  document.querySelectorAll(".module-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === state.activeView));
  setMetricsVisibility();
  if (state.activeView === "feedbackView") renderNetworkFeedback();
});

document.querySelector(".tabs").addEventListener("click", event => {
  const button = event.target.closest(".tab");
  if (!button) return;
  if (!isAdmin()) return;
  state.activeMaintainTab = button.dataset.tab;
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab === button));
  renderMaintainTable();
});

document.querySelector("#dataRows").addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openMaintainDialog(state.data[state.activeMaintainTab].find(item => item.id === editId));
  if (deleteId) deleteItem("maintain", deleteId);
});

document.querySelector("#operationRows").addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openOperationDialog(state.data.operationRecords.find(item => item.id === editId));
  if (deleteId) deleteItem("operation", deleteId);
});

document.querySelector("#dailyRows").addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openDailyDialog(state.data.dailyReferences.find(item => item.id === editId));
  if (deleteId) deleteItem("daily", deleteId);
});

setDefaultMonth();
boot().catch(error => alert(error.message));
