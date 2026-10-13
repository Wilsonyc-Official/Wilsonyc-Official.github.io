// данные и хранилище (все в localStorage, без сервера)
// потом можно заменить на запросы к api

// демо, все данные выдуманные
const DEMO_MODE = true;
const DEMO_DISCLAIMER = "Демо-версия сайта. Адреса, мастера, цены и записи вымышлены — это не настоящий салон";

const STORAGE_KEYS = {
  branches: "tm1_branches",
  services: "tm1_services",
  masters: "tm1_masters",
  bookings: "tm1_bookings",
  users: "tm1_users",
  session: "tm1_session",
  draft: "tm1_draft",
  reviews: "tm1_reviews",
};

// в демо блокирую fetch/xhr, чтобы ничего никуда не отправлялось
if (DEMO_MODE) {
  const blocked = () => console.info("[Демо] Сетевой запрос заблокирован: прототип ничего не отправляет");
  window.fetch = () => { blocked(); return Promise.reject(new Error("Demo mode: network disabled")); };
  if (navigator.sendBeacon) navigator.sendBeacon = () => { blocked(); return false; };
  XMLHttpRequest.prototype.send = function () { blocked(); this.abort(); };
}

// ключ api яндекс карт (в демо пустой)
const YANDEX_MAPS_API_KEY = "";

const CONTACTS = {
  phone: "+7 (000) 000-00-00",
  city: "Якутск",
  hours: "Ежедневно 09:00–21:00",
};

// филиалы (вымышленные адреса в Якутске)
const DEFAULT_BRANCHES = [
  { id: 1, name: "Тайм на Ленина", address: "пр. Ленина, 24", district: "Центр", lat: 62.0272, lng: 129.7318, open: "09:00", close: "21:00", active: true, note: "Рядом с площадью Ленина" },
  { id: 2, name: "Тайм Сайсары", address: "ул. Петра Алексеева, 51", district: "Сайсарский округ", lat: 62.0352, lng: 129.7062, open: "10:00", close: "20:00", active: true, note: "Вход со двора, парковка" },
  { id: 3, name: "Тайм 202 мкр", address: "202 мкр, корп. 9", district: "202 микрорайон", lat: 62.0068, lng: 129.6765, open: "09:00", close: "21:00", active: true, note: "1 этаж, отдельный вход" },
  { id: 4, name: "Тайм Строительный", address: "ул. Орджоникидзе, 38", district: "Строительный округ", lat: 62.0315, lng: 129.7445, open: "10:00", close: "21:00", active: true, note: "ТЦ, 2 этаж" },
  { id: 5, name: "Тайм Автодорожный", address: "ул. Автодорожная, 17", district: "Автодорожный округ", lat: 62.0487, lng: 129.7238, open: "10:00", close: "20:00", active: true, note: "Рядом с остановкой" },
// id в яндекс картах и 2гис, заполняются в админке
].map((b) => ({ yandexOrgId: "", dgisFirmId: "", ...b }));

// ссылки на филиал во внешних картах
function branchLinks(b) {
  const y = b.yandexOrgId && String(b.yandexOrgId).trim();
  const g = b.dgisFirmId && String(b.dgisFirmId).trim();
  return {
    map: `https://yandex.ru/maps/?pt=${b.lng},${b.lat}&z=17&l=map`,
    route: `https://yandex.ru/maps/?rtext=~${b.lat},${b.lng}&rtt=auto`,
    yandexReviews: y ? `https://yandex.ru/maps/org/${encodeURIComponent(y)}/reviews/` : "",
    yandexWidget: y ? `https://yandex.ru/maps-reviews-widget/${encodeURIComponent(y)}?comments` : "",
    dgisReviews: g ? `https://2gis.ru/yakutsk/firm/${encodeURIComponent(g)}/tab/reviews` : "",
  };
}

// услуги
// в каждой категории 10 работ с фото
// фото в images/gallery/
const photo = (cat, n) => `images/gallery/${cat}-${String(n).padStart(2, "0")}.jpg`;

const DEFAULT_SERVICES = [
  {
    id: "men", name: "Мужские стрижки", mark: "⭐", icon: "scissors",
    text: "Классика и модные фейды. Мытьё головы и укладка включены.",
    styles: [
      ["Классическая мужская", 1200, 45], ["Андеркат", 1500, 60], ["Фейд", 1600, 60], ["Кроп", 1500, 60],
      ["Канадка", 1300, 45], ["Полубокс", 1100, 40], ["Бокс", 1000, 30], ["Помпадур", 1700, 60],
      ["Британка", 1500, 60], ["Под машинку", 700, 30],
    ],
  },
  {
    id: "kids", name: "Детские стрижки", mark: "✨", icon: "child",
    text: "Для детей до 12 лет. Терпеливые мастера и мультики на планшете.",
    styles: [
      ["Классическая для мальчика", 800, 30], ["Детский фейд", 1000, 40], ["Шапочка", 900, 40], ["Каре для девочки", 1000, 40],
      ["Боб для девочки", 1000, 40], ["Детская канадка", 900, 40], ["Стрижка с рисунком", 1200, 45], ["Под машинку", 500, 20],
      ["Чёлка и кончики", 500, 20], ["Каскад для девочки", 1100, 45],
    ],
  },
  {
    id: "women", name: "Женские стрижки", mark: "⭐", icon: "scissors",
    text: "Стрижки любой длины с учётом типа волос и формы лица.",
    styles: [
      ["Каре", 2000, 60], ["Боб-каре", 2200, 60], ["Каскад", 2300, 75], ["Пикси", 1900, 60],
      ["Лесенка", 2000, 60], ["Гарсон", 1800, 60], ["Шегги", 2400, 75], ["Удлинённое каре", 2100, 60],
      ["Стрижка кончиков", 1000, 30], ["Рапсодия", 2300, 75],
    ],
  },
  {
    id: "styling", name: "Укладка волос & Прически", mark: "✨", icon: "sparkle",
    text: "Укладки на каждый день, вечерние и свадебные причёски.",
    styles: [
      ["Голливудская волна", 3000, 90], ["Локоны", 2500, 60], ["Пучок", 2000, 60], ["Колосок", 1200, 40],
      ["Французская коса", 1500, 45], ["Свадебная причёска", 6000, 120], ["Вечерняя причёска", 4000, 90], ["Укладка брашинг", 1500, 45],
      ["Ракушка", 2500, 60], ["Бохо-коса", 2200, 60],
    ],
  },
  {
    id: "color", name: "Женское окрашивание", mark: "⭐", icon: "palette",
    text: "Профессиональные красители, уход Olaplex в подарок.",
    styles: [
      ["Окрашивание в один тон", 4000, 120], ["Балаяж", 8000, 210], ["Шатуш", 7500, 180], ["Мелирование", 6000, 180],
      ["AirTouch", 9500, 240], ["Тонирование", 3500, 90], ["Омбре", 7000, 180], ["Блонд", 9000, 240],
      ["Окрашивание корней", 3000, 90], ["Креативное окрашивание", 8500, 210],
    ],
  },
  {
    id: "keratin", name: "Кератин / Ботокс / Нанопластика", mark: "⭐", icon: "drop",
    text: "Восстановление волос: гладкость, блеск и защита до 6 месяцев.",
    styles: [
      ["Кератиновое выпрямление", 6000, 180], ["Ботокс для волос", 4500, 120], ["Нанопластика", 7500, 210], ["Холодное восстановление", 3500, 90],
      ["Кератин на короткие волосы", 4500, 150], ["Кератин на длинные волосы", 8500, 240], ["Ботокс для блонда", 5000, 120], ["Полировка волос", 1500, 45],
      ["Глазирование", 3000, 90], ["SPA-уход для волос", 2500, 60],
    ],
  },
  {
    id: "brows", name: "Брови / ресницы", mark: "⭐", icon: "eye",
    text: "Коррекция, окрашивание, ламинирование и наращивание.",
    styles: [
      ["Коррекция бровей", 700, 30], ["Окрашивание бровей", 800, 30], ["Ламинирование бровей", 1800, 60], ["Долговременная укладка", 1600, 60],
      ["Ламинирование ресниц", 2000, 75], ["Наращивание: классика", 2500, 120], ["Наращивание: 2D", 3000, 150], ["Наращивание: 3D", 3500, 150],
      ["Окрашивание ресниц", 600, 20], ["Комплекс брови + ресницы", 3200, 105],
    ],
  },
].map((s) => ({
  ...s,
  styles: s.styles.map(([name, price, duration], i) => ({ name, price, duration, photo: photo(s.id, i + 1) })),
}));

// мастера
const DEFAULT_MASTERS = [
  { id: 1, name: "Айталина Петрова", role: "Топ-стилист", branchId: 1, services: ["women", "color", "styling", "keratin"], workDays: [1, 2, 3, 4, 5], color: "#c2410c", rating: 4.9, active: true },
  { id: 2, name: "Сергей Иванов", role: "Барбер", branchId: 1, services: ["men", "kids"], workDays: [2, 3, 4, 5, 6], color: "#1d4ed8", rating: 4.8, active: true },
  { id: 3, name: "Сардаана Николаева", role: "Бровист-лэшмейкер", branchId: 1, services: ["brows"], workDays: [1, 3, 5, 6, 0], color: "#be185d", rating: 5.0, active: true },
  { id: 4, name: "Туйаара Егорова", role: "Парикмахер-универсал", branchId: 2, services: ["women", "men", "kids", "styling"], workDays: [1, 2, 4, 5, 6], color: "#047857", rating: 4.7, active: true },
  { id: 5, name: "Николай Слепцов", role: "Барбер", branchId: 2, services: ["men", "kids"], workDays: [0, 1, 3, 5, 6], color: "#4338ca", rating: 4.9, active: true },
  { id: 6, name: "Мария Васильева", role: "Колорист", branchId: 2, services: ["color", "keratin", "women"], workDays: [2, 3, 4, 5, 6], color: "#a16207", rating: 4.9, active: true },
  { id: 7, name: "Анна Семёнова", role: "Стилист", branchId: 3, services: ["women", "styling", "color"], workDays: [1, 2, 3, 4, 6], color: "#7c3aed", rating: 4.8, active: true },
  { id: 8, name: "Дмитрий Захаров", role: "Барбер", branchId: 3, services: ["men", "kids"], workDays: [0, 2, 3, 4, 5, 6], color: "#0e7490", rating: 4.6, active: true },
  { id: 9, name: "Нюргуяна Попова", role: "Мастер по восстановлению волос", branchId: 3, services: ["keratin", "brows"], workDays: [1, 3, 4, 5, 0], color: "#9d174d", rating: 4.9, active: true },
  { id: 10, name: "Ольга Федорова", role: "Парикмахер-универсал", branchId: 4, services: ["women", "men", "kids", "styling", "color"], workDays: [1, 2, 3, 5, 6], color: "#b45309", rating: 4.8, active: true },
  { id: 11, name: "Кюннэй Алексеева", role: "Бровист", branchId: 4, services: ["brows"], workDays: [2, 4, 5, 6, 0], color: "#db2777", rating: 4.9, active: true },
  { id: 12, name: "Артём Григорьев", role: "Барбер", branchId: 5, services: ["men", "kids"], workDays: [1, 2, 3, 4, 5], color: "#2563eb", rating: 4.7, active: true },
  { id: 13, name: "Елена Иннокентьева", role: "Стилист-колорист", branchId: 5, services: ["women", "color", "keratin", "styling", "brows"], workDays: [0, 2, 3, 4, 6], color: "#15803d", rating: 4.8, active: true },
  { id: 14, name: "Виктория Сидорова", role: "Стилист", branchId: 1, services: ["women", "styling", "kids", "color"], workDays: [0, 3, 4, 5, 6], color: "#0f766e", rating: 4.8, active: true },
];

// статусы
const STATUSES = { new: "Новая", confirmed: "Подтверждена", done: "Выполнена", cancelled: "Отменена" };
const CLIENT_STATUSES = { new: "Ожидает подтверждения", confirmed: "Подтверждена", done: "Завершена", cancelled: "Отменена" };

// даты
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const WEEKDAYS_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function dateKey(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(n, from) {
  const d = from ? parseKey(from) : new Date();
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
function todayKey() { return dateKey(new Date()); }
// суббота, 10 октября
function formatDate(key) {
  const d = parseKey(key);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
// пн, 12 окт
function formatDateShort(key) {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function formatDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return [h ? `${h} ч` : "", m ? `${m} мин` : ""].filter(Boolean).join(" ");
}
const rub = (n) => `${Number(n).toLocaleString("ru-RU")} ₽`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

// телефон к виду +7XXXXXXXXXX
function normPhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "8" || d[0] === "7")) d = d.slice(1);
  return d.length === 10 ? `+7${d}` : "";
}
function formatPhone(p) {
  const d = normPhone(p).slice(2);
  return d ? `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}` : p;
}

// демо-записи
const DEMO_USER = { id: 1, name: "Анна Смирнова", phone: "+70000000001", password: "demo", createdAt: Date.now() - 90 * 86400000 };
const DEFAULT_USERS = [
  DEMO_USER,
  { id: 2, name: "Игорь Петров", phone: "+70000000002", password: "demo", createdAt: Date.now() - 40 * 86400000 },
  { id: 3, name: "Мария Кузнецова", phone: "+70000000003", password: "demo", createdAt: Date.now() - 12 * 86400000 },
  { id: 4, name: "Дмитрий Волков", phone: "+70000000004", password: "demo", createdAt: Date.now() - 5 * 86400000 },
];

function defaultBookings() {
  const now = Date.now();
  const b = (n, userId, branchId, serviceId, styleIdx, masterId, date, time, status, extra = {}) => {
    const st = DEFAULT_SERVICES.find((s) => s.id === serviceId).styles[styleIdx];
    const u = DEFAULT_USERS.find((x) => x.id === userId);
    return {
      id: now - n * 1000, userId, name: u.name, phone: u.phone, branchId, serviceId, styleIdx, masterId,
      anyMaster: false, date, time, duration: st.duration, price: st.price, status, comment: "",
      createdAt: now - n * 3600000, ...extra,
    };
  };
  return [
    b(1, 1, 1, "women", 1, 1, nextWorkDay(1, 2), "12:00", "confirmed"),
    b(2, 1, 1, "brows", 2, 3, addDays(-18), "15:00", "done"),
    b(3, 1, 2, "color", 1, 6, addDays(-60), "11:00", "done"),
    b(4, 2, 1, "men", 2, 2, nextWorkDay(2, 0), "17:00", "new", { comment: "Покороче на висках" }),
    b(5, 3, 3, "styling", 5, 7, nextWorkDay(7, 3), "10:00", "new", { anyMaster: true, comment: "Свадьба в субботу" }),
    b(6, 4, 5, "men", 0, 12, nextWorkDay(12, 1), "14:30", "confirmed"),
    b(7, 2, 4, "kids", 0, 10, addDays(-3), "16:00", "done"),
    b(8, 3, 2, "keratin", 0, 6, addDays(-1), "13:00", "cancelled"),
  ];
}
// ближайший рабочий день мастера не раньше чем через n дней
function nextWorkDay(masterId, n) {
  const m = DEFAULT_MASTERS.find((x) => x.id === masterId);
  for (let i = n; i < n + 8; i++) {
    const k = addDays(i);
    if (m.workDays.includes(parseKey(k).getDay())) return k;
  }
  return addDays(n);
}

// отзывы
// формат отзыва одинаковый для сайта, яндекса и 2гис
// externalId нужен, чтобы при импорте не было дублей
const REVIEW_SOURCES = { site: "Сайт", yandex: "Яндекс Карты", "2gis": "2ГИС" };
const REVIEW_STATUSES = { pending: "На модерации", published: "Опубликован", hidden: "Скрыт" };

function defaultReviews() {
  const day = 86400000, now = Date.now();
  const r = (n, data) => ({
    id: now - n * 1000, source: "site", externalId: "", userId: null, bookingId: null,
    masterId: null, serviceId: null, reply: "", replyDate: null, status: "published",
    date: new Date(now - data.daysAgo * day).toISOString(), ...data,
  });
  return [
    r(1, { daysAgo: 2, branchId: 1, author: "Анна С.", rating: 5, serviceId: "women", masterId: 1, userId: 1, text: "Записалась онлайн за минуту, пришла — мастер уже ждал. Каре получилось ровно таким, как на фото.", reply: "Анна, спасибо! Ждём вас снова.", replyDate: new Date(now - day).toISOString() }),
    r(2, { daysAgo: 4, branchId: 2, author: "Николай", rating: 5, serviceId: "men", masterId: 5, text: "Хожу на фейд каждые три недели. Удобно, что можно выбрать «любого мастера» и попасть в тот же день." }),
    r(3, { daysAgo: 6, branchId: 3, author: "Сардана", rating: 5, serviceId: "keratin", masterId: 9, text: "Сделала нанопластику — волосы гладкие уже третий месяц. Сыну тут же подстригли чёлку." }),
    r(4, { daysAgo: 9, branchId: 1, author: "Игорь П.", rating: 4, serviceId: "men", masterId: 2, text: "Подстригли хорошо, но пришлось подождать минут десять — мастер задержался с предыдущим клиентом." }),
    r(5, { daysAgo: 12, branchId: 4, author: "Мария", rating: 5, serviceId: "brows", masterId: 11, text: "Ламинирование бровей — супер, держится уже месяц. Очень аккуратная работа." }),
    r(6, { daysAgo: 15, branchId: 5, author: "Елена", rating: 5, serviceId: "color", masterId: 13, text: "Балаяж мечты! Цвет подобрали с первого раза, волосы после окрашивания мягкие." }),
    r(7, { daysAgo: 20, branchId: 2, author: "Ольга В.", rating: 3, serviceId: "color", masterId: 6, text: "Цвет понравился, но процедура заняла на час больше, чем обещали.", reply: "Ольга, извините за ожидание. Передали замечание мастеру и скорректировали время записи на окрашивание.", replyDate: new Date(now - 19 * day).toISOString() }),
    r(8, { daysAgo: 25, branchId: 3, author: "Артур", rating: 5, serviceId: "kids", masterId: 8, text: "Сын боится стрижек, а тут включили мультики и всё прошло спокойно. Спасибо!" }),
    r(9, { daysAgo: 31, branchId: 1, author: "Кира", rating: 5, source: "yandex", externalId: "demo-y-1001", text: "Хороший салон в центре, всегда чисто и приятно пахнет кофе." }),
    r(10, { daysAgo: 40, branchId: 4, author: "Денис", rating: 4, source: "2gis", externalId: "demo-g-2001", text: "Стригусь тут второй год. Иногда сложно попасть вечером, но мастера отличные." }),
    r(11, { daysAgo: 1, branchId: 5, author: "Виктор", rating: 5, serviceId: "men", masterId: 12, status: "pending", text: "Отличная стрижка, приду ещё!" }),
  ];
}

// импорт и экспорт отзывов (JSON и CSV для Excel)
const REVIEW_FIELDS = ["id", "source", "externalId", "branchId", "branchAddress", "author", "rating", "text", "date", "reply", "replyDate", "status"];

const ReviewIO = {
  toRows(reviews, branches) {
    return reviews.map((r) => {
      const b = branches.find((x) => x.id === r.branchId);
      return { ...Object.fromEntries(REVIEW_FIELDS.map((f) => [f, r[f] ?? ""])), branchAddress: b ? b.address : "" };
    });
  },
  toJSON(reviews, branches) {
    return JSON.stringify({ format: "taim-reviews", version: 1, exportedAt: new Date().toISOString(), reviews: ReviewIO.toRows(reviews, branches) }, null, 2);
  },
  // csv через ; и с BOM, иначе excel ломает кириллицу
  toCSV(reviews, branches) {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = ReviewIO.toRows(reviews, branches).map((r) => REVIEW_FIELDS.map((f) => q(r[f])).join(";"));
    return "﻿" + [REVIEW_FIELDS.join(";"), ...rows].join("\r\n");
  },
  parseCSV(text) {
    text = text.replace(/^﻿/, "");
    const sep = text.split("\n")[0].includes(";") ? ";" : ",";
    const rows = [];
    let row = [], cell = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') inQ = false;
        else cell += c;
      } else if (c === '"') inQ = true;
      else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = rows.shift().map((h) => h.trim());
    return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
  },
  parse(text) {
    const t = text.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      const data = JSON.parse(t);
      return Array.isArray(data) ? data : data.reviews || [];
    }
    return ReviewIO.parseCSV(text);
  },
  // мерж отзывов: если такой source+externalId уже есть, обновляем, иначе добавляем
  merge(existing, incoming, branches) {
    const list = existing.slice();
    const stats = { added: 0, updated: 0, skipped: 0 };
    incoming.forEach((raw, i) => {
      const rating = Math.round(Number(raw.rating));
      const text = String(raw.text || "").trim();
      const source = REVIEW_SOURCES[raw.source] ? raw.source : "site";
      let branchId = Number(raw.branchId);
      if (!branches.some((b) => b.id === branchId)) {
        const byAddr = branches.find((b) => raw.branchAddress && b.address.toLowerCase() === String(raw.branchAddress).trim().toLowerCase());
        branchId = byAddr ? byAddr.id : null;
      }
      if (!(rating >= 1 && rating <= 5) || !text || !branchId) { stats.skipped++; return; }
      const date = raw.date && !isNaN(new Date(raw.date)) ? new Date(raw.date).toISOString() : new Date().toISOString();
      const review = {
        source, externalId: String(raw.externalId || "").trim(), branchId, author: String(raw.author || "Гость").trim(),
        rating, text, date, reply: String(raw.reply || "").trim(), replyDate: raw.replyDate || null,
        status: REVIEW_STATUSES[raw.status] ? raw.status : "published",
      };
      const found = list.find((r) => (review.externalId && r.source === source && r.externalId === review.externalId)
        || (raw.id && String(r.id) === String(raw.id)));
      if (found) { Object.assign(found, review); stats.updated++; }
      else { list.push({ id: Date.now() + i, userId: null, bookingId: null, masterId: null, serviceId: null, ...review }); stats.added++; }
    });
    return { list, stats };
  },
};

// средняя оценка и распределение по звёздам
function reviewStats(reviews) {
  const dist = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { dist[r.rating - 1]++; });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return { count: reviews.length, avg, dist };
}
const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const reviewsWord = (n) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? "отзыв" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "отзыва" : "отзывов";
};

// хранилище
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* нет localStorage, берем дефолт */ }
  const value = fallback();
  save(key, value);
  return value;
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
const clone = (v) => JSON.parse(JSON.stringify(v));

const Store = {
  getBranches: () => load(STORAGE_KEYS.branches, () => clone(DEFAULT_BRANCHES)),
  saveBranches: (v) => save(STORAGE_KEYS.branches, v),
  getServices: () => load(STORAGE_KEYS.services, () => clone(DEFAULT_SERVICES)),
  saveServices: (v) => save(STORAGE_KEYS.services, v),
  getMasters: () => load(STORAGE_KEYS.masters, () => clone(DEFAULT_MASTERS)),
  saveMasters: (v) => save(STORAGE_KEYS.masters, v),
  getBookings: () => load(STORAGE_KEYS.bookings, defaultBookings),
  saveBookings: (v) => save(STORAGE_KEYS.bookings, v),
  addBooking(b) {
    const list = Store.getBookings();
    list.push(b);
    Store.saveBookings(list);
  },
  getReviews: () => load(STORAGE_KEYS.reviews, defaultReviews),
  saveReviews: (v) => save(STORAGE_KEYS.reviews, v),
  getUsers: () => load(STORAGE_KEYS.users, () => clone(DEFAULT_USERS)),
  saveUsers: (v) => save(STORAGE_KEYS.users, v),

  // авторизация (в демо пароль хранится прямо в браузере)
  currentUser() {
    let id = null;
    try { id = Number(localStorage.getItem(STORAGE_KEYS.session)); } catch (e) { /* ignore */ }
    return id ? Store.getUsers().find((u) => u.id === id) || null : null;
  },
  login(phone, password) {
    const p = normPhone(phone);
    const u = Store.getUsers().find((x) => x.phone === p);
    if (!u) return { error: "Аккаунт с таким номером не найден" };
    if (u.password !== password) return { error: "Неверный пароль" };
    try { localStorage.setItem(STORAGE_KEYS.session, String(u.id)); } catch (e) { /* ignore */ }
    return { user: u };
  },
  register(name, phone, password) {
    const p = normPhone(phone);
    if (!name.trim()) return { error: "Укажите имя" };
    if (!p) return { error: "Введите номер полностью: +7 и 10 цифр" };
    if (password.length < 4) return { error: "Пароль — не короче 4 символов" };
    const users = Store.getUsers();
    if (users.some((x) => x.phone === p)) return { error: "Этот номер уже зарегистрирован — войдите" };
    const u = { id: Math.max(0, ...users.map((x) => x.id)) + 1, name: name.trim(), phone: p, password, createdAt: Date.now() };
    users.push(u);
    Store.saveUsers(users);
    try { localStorage.setItem(STORAGE_KEYS.session, String(u.id)); } catch (e) { /* ignore */ }
    return { user: u };
  },
  logout() {
    try { localStorage.removeItem(STORAGE_KEYS.session); } catch (e) { /* ignore */ }
  },

  // черновик записи, чтобы не терялся при переходе на вход
  getDraft() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.draft)) || {}; } catch (e) { return {}; }
  },
  saveDraft(d) {
    try { sessionStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(d)); } catch (e) { /* ignore */ }
  },
  clearDraft() {
    try { sessionStorage.removeItem(STORAGE_KEYS.draft); } catch (e) { /* ignore */ }
  },

  // полный сброс демо-данных
  reset() {
    try { Object.values(STORAGE_KEYS).forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); } catch (e) { /* ignore */ }
  },
};

// расписание
const SLOT_STEP = 30;

// фейковая занятость мастеров, чтобы расписание не было пустым
function hashBusy(masterId, date, time) {
  let h = 2166136261;
  for (const c of `${masterId}|${date}|${time}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100) < 28;
}

// свободные слоты мастера на дату (duration в минутах)
function masterSlots(master, branch, date, duration, bookings, ignoreId) {
  if (!master.active || !master.workDays.includes(parseKey(date).getDay())) return [];
  const open = timeToMin(branch.open), close = timeToMin(branch.close);
  const busy = bookings
    .filter((b) => b.masterId === master.id && b.date === date && b.status !== "cancelled" && b.id !== ignoreId)
    .map((b) => [timeToMin(b.time), timeToMin(b.time) + b.duration]);
  const now = new Date();
  const nowMin = date === todayKey() ? now.getHours() * 60 + now.getMinutes() + 30 : -1;
  const slots = [];
  for (let t = open; t + duration <= close; t += SLOT_STEP) {
    if (t < nowMin) continue;
    if (busy.some(([s, e]) => t < e && t + duration > s)) continue;
    let fake = false;
    for (let x = t; x < t + duration; x += SLOT_STEP) if (hashBusy(master.id, date, minToTime(x))) { fake = true; break; }
    if (fake) continue;
    slots.push(minToTime(t));
  }
  return slots;
}

// источники фото, см. credits.js
const CREDITS = window.PHOTO_CREDITS || [];
