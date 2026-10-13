// данные и хранилище (все в localStorage, без сервера)
// потом можно заменить на запросы к api

// демо, все данные выдуманные
const DEMO_MODE = true;
const DEMO_DISCLAIMER = "Независимый демонстрационный прототип. Не является официальным сайтом";

const STORAGE_KEYS = {
  frames: "oc3_frames",
  bookings: "oc3_bookings",
  specialists: "oc3_specialists",
  client: "oc3_client",
};
// старые ключи, чистим при сбросе
const LEGACY_KEYS = ["oc2_frames", "oc2_bookings", "oc2_specialists", "oc2_client"];
try { LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }

const CONTACTS = {
  phone: "Демо-проект",
  address: "ул. Примерная, 1",
  hours: "Ежедневно 10:00–19:00",
};

// в демо блокирую fetch/xhr, чтобы ничего никуда не отправлялось
if (DEMO_MODE) {
  const blocked = () => console.info("[Демо] Сетевой запрос заблокирован: прототип ничего не отправляет");
  window.fetch = () => { blocked(); return Promise.reject(new Error("Demo mode: network disabled")); };
  if (navigator.sendBeacon) navigator.sendBeacon = () => { blocked(); return false; };
  XMLHttpRequest.prototype.send = function () { blocked(); this.abort(); };
}

const SHAPES = {
  round: "Круглые",
  oval: "Овальные",
  rectangle: "Прямоугольные",
  square: "Квадратные",
  wayfarer: "Вайфареры",
  aviator: "Авиаторы",
  cateye: "Кошачий глаз",
};
const MATERIALS = { metal: "Металл", acetate: "Ацетат", titanium: "Титан", plastic: "Пластик" };
const GENDERS = { unisex: "Унисекс", female: "Женские", male: "Мужские", kids: "Детские" };

const SERVICES = {
  check: { name: "Проверка зрения", price: "1 000 ₽", duration: "30 мин", text: "Компьютерная диагностика, подбор коррекции, рецепт на очки." },
  glasses: { name: "Подбор очков", price: "бесплатно", duration: "30 мин", text: "Подберём линзы и оправу по рецепту и форме лица." },
  lenses: { name: "Подбор контактных линз", price: "1 500 ₽", duration: "45 мин", text: "Подбор линз, обучение надеванию и уходу." },
  fitting: { name: "Примерка оправы", price: "бесплатно", duration: "20 мин", text: "Отложим выбранную оправу до вашего визита." },
  repair: { name: "Ремонт очков", price: "от 300 ₽", duration: "20 мин", text: "Замена винтов и носоупоров, правка оправы." },
};

// статусы записи: для администратора и для клиента
const STATUSES = { new: "Новая", confirmed: "Подтверждена", done: "Выполнена", cancelled: "Отменена" };
const CLIENT_STATUSES = { new: "Ожидает подтверждения", confirmed: "Подтверждена", done: "Завершена", cancelled: "Отменена" };

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const WEEKDAYS_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

// окна приёма каждые 30 минут с 10:00 до 18:30
const TIME_SLOTS = [];
for (let h = 10; h < 19; h++) TIME_SLOTS.push(`${h}:00`, `${h}:30`);

const DEFAULT_FRAMES = [
  { id: 1, name: "Milano", brand: "Ray-Ban", shape: "wayfarer", material: "acetate", gender: "unisex", color: "#1d1d1f", price: 8900, oldPrice: 10500, lensWidth: 52, bridge: 18, temple: 145, lensHeight: 41, frameWidth: 140, inStock: true, description: "Классический вайфарер из итальянского ацетата. Подходит для большинства типов лица." },
  { id: 2, name: "Aurora", brand: "Vogue", shape: "cateye", material: "acetate", gender: "female", color: "#7a2e3b", price: 7400, lensWidth: 53, bridge: 17, temple: 140, lensHeight: 42, frameWidth: 139, inStock: true, description: "Женственная оправа «кошачий глаз» в бордовом цвете." },
  { id: 3, name: "Pilot", brand: "Ray-Ban", shape: "aviator", material: "metal", gender: "male", color: "#b08d57", price: 9900, lensWidth: 58, bridge: 14, temple: 140, lensHeight: 50, frameWidth: 140, inStock: true, description: "Легендарные авиаторы в золотистом металле с регулируемыми носоупорами." },
  { id: 4, name: "Lennon", brand: "Oliver Peoples", shape: "round", material: "titanium", gender: "unisex", color: "#5b5f66", price: 18500, lensWidth: 47, bridge: 22, temple: 145, lensHeight: 44, frameWidth: 132, inStock: true, description: "Лёгкая круглая оправа из титана — всего 14 г." },
  { id: 5, name: "Office Pro", brand: "Silhouette", shape: "rectangle", material: "titanium", gender: "male", color: "#2b3a55", price: 14200, lensWidth: 54, bridge: 17, temple: 145, lensHeight: 34, frameWidth: 138, inStock: true, description: "Строгая прямоугольная оправа для работы за компьютером." },
  { id: 6, name: "Bella", brand: "Prada", shape: "square", material: "acetate", gender: "female", color: "#8b5a2b", price: 21900, oldPrice: 24900, lensWidth: 51, bridge: 18, temple: 140, lensHeight: 45, frameWidth: 136, inStock: true, description: "Массивная квадратная оправа черепахового окраса." },
  { id: 7, name: "Kiddo", brand: "Nano Vista", shape: "oval", material: "plastic", gender: "kids", color: "#2f80ed", price: 4900, lensWidth: 44, bridge: 16, temple: 125, lensHeight: 33, frameWidth: 116, inStock: true, description: "Гибкая небьющаяся детская оправа на 5–9 лет." },
  { id: 8, name: "Soft Oval", brand: "Lindberg", shape: "oval", material: "titanium", gender: "female", color: "#c08497", price: 26500, lensWidth: 50, bridge: 19, temple: 140, lensHeight: 36, frameWidth: 132, inStock: false, description: "Безвинтовая титановая оправа премиум-класса." },
  { id: 9, name: "Urban", brand: "Carrera", shape: "rectangle", material: "acetate", gender: "unisex", color: "#2d6a4f", price: 6900, lensWidth: 55, bridge: 16, temple: 145, lensHeight: 38, frameWidth: 141, inStock: true, description: "Современная оправа в глубоком зелёном цвете." },
  { id: 10, name: "Classic Round", brand: "Optic Line", shape: "round", material: "metal", gender: "unisex", color: "#1d1d1f", price: 3900, lensWidth: 49, bridge: 20, temple: 140, lensHeight: 45, frameWidth: 133, inStock: true, description: "Доступная металлическая круглая оправа — бестселлер салона." },
  { id: 11, name: "Diva", brand: "Dolce & Gabbana", shape: "cateye", material: "acetate", gender: "female", color: "#1d1d1f", price: 23400, lensWidth: 54, bridge: 16, temple: 140, lensHeight: 44, frameWidth: 142, inStock: true, description: "Выразительная чёрная оправа с золотыми вставками на заушниках." },
  { id: 12, name: "Sport Flex", brand: "Oakley", shape: "wayfarer", material: "plastic", gender: "male", color: "#3a3f47", price: 11200, lensWidth: 55, bridge: 17, temple: 143, lensHeight: 40, frameWidth: 142, inStock: false, description: "Лёгкая оправа из O-Matter для активного образа жизни." },
];

// даты
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

// демо-данные
const DEFAULT_SPECIALISTS = [
  {
    id: 1, name: "Соколова Ирина Андреевна", role: "Врач-офтальмолог", experience: "", photo: "", color: "#c8161d",
    workDays: [2, 3, 4, 5, 6], active: true,
    bio: "Проводит комплексную диагностику зрения, подбирает очки и контактные линзы для взрослых и детей.",
    reviews: [{ author: "Демо-отзыв", rating: 5, text: "Очень внимательный врач, всё подробно объяснила. Очки подобрали отлично!", date: addDays(-14) }],
  },
  {
    id: 2, name: "Лебедева Ольга Викторовна", role: "Врач-офтальмолог", experience: "", photo: "", color: "#8b5cf6",
    workDays: [1, 3, 5, 6], active: true,
    bio: "Диагностика и коррекция зрения, подбор очков для работы за компьютером и вождения.",
    reviews: [],
  },
  {
    id: 3, name: "Орлова Марина Павловна", role: "Врач-офтальмолог", experience: "", photo: "", color: "#0e9f6e",
    workDays: [1, 2, 3, 4, 5], active: true,
    bio: "Подбор контактных линз, в том числе для первого опыта ношения. Консультации по уходу за линзами.",
    reviews: [{ author: "Демо-отзыв", rating: 5, text: "Быстро и профессионально подобрали линзы, всё объяснили.", date: addDays(-30) }],
  },
  {
    id: 4, name: "Белова Елена Игоревна", role: "Оптометрист", experience: "", photo: "", color: "#f59e0b",
    workDays: [], active: true,
    bio: "Проверка остроты зрения, подбор очковой коррекции, консультации по выбору линз.",
    reviews: [],
  },
];

// демо клиент для входа
// номера ненастоящие (000)
const DEMO_CLIENT_PHONE = "+7 (000) 000-00-01";

function defaultBookings() {
  const now = Date.now();
  const b = (n, data) => ({ id: now - n, comment: "", frameId: null, createdAt: now - n * 3600000, ...data });
  return [
    b(1, { name: "Анна Смирнова", phone: DEMO_CLIENT_PHONE, service: "check", specialistId: 3, date: addDays(3), time: "11:00", status: "confirmed" }),
    b(2, { name: "Анна Смирнова", phone: DEMO_CLIENT_PHONE, service: "glasses", specialistId: 1, date: addDays(-20), time: "15:30", status: "done", frameId: 2 }),
    b(3, { name: "Анна Смирнова", phone: DEMO_CLIENT_PHONE, service: "lenses", specialistId: 3, date: addDays(-64), time: "12:00", status: "done" }),
    b(4, { name: "Игорь Петров", phone: "+7 (000) 000-00-02", service: "fitting", specialistId: 1, date: addDays(0), time: "15:00", frameId: 3, comment: "Хочу примерить в двух цветах", status: "new" }),
    b(5, { name: "Мария Кузнецова", phone: "+7 (000) 000-00-03", service: "lenses", specialistId: 3, date: addDays(2), time: "12:00", comment: "Первый раз ношу линзы", status: "new" }),
    b(6, { name: "Дмитрий Волков", phone: "+7 (000) 000-00-04", service: "glasses", specialistId: 2, date: addDays(2), time: "17:30", frameId: 5, status: "confirmed" }),
    b(7, { name: "Елена Соколова", phone: "+7 (000) 000-00-05", service: "repair", specialistId: 1, date: addDays(-1), time: "10:30", comment: "Сломался заушник", status: "done" }),
    b(8, { name: "Олег Морозов", phone: "+7 (000) 000-00-06", service: "check", specialistId: 2, date: addDays(-2), time: "16:00", status: "cancelled" }),
    b(9, { name: "Светлана Егорова", phone: "+7 (000) 000-00-07", service: "check", specialistId: 1, date: addDays(3), time: "10:00", status: "confirmed" }),
    b(10, { name: "Павел Николаев", phone: "+7 (000) 000-00-08", service: "check", specialistId: 1, date: addDays(3), time: "10:30", status: "new" }),
  ];
}

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

const Store = {
  getFrames: () => load(STORAGE_KEYS.frames, () => DEFAULT_FRAMES.map((f) => ({ ...f }))),
  saveFrames: (frames) => save(STORAGE_KEYS.frames, frames),
  getSpecialists: () => load(STORAGE_KEYS.specialists, () => JSON.parse(JSON.stringify(DEFAULT_SPECIALISTS))),
  saveSpecialists: (list) => save(STORAGE_KEYS.specialists, list),
  getBookings: () => load(STORAGE_KEYS.bookings, defaultBookings),
  saveBookings: (list) => save(STORAGE_KEYS.bookings, list),
  addBooking(b) {
    const list = Store.getBookings();
    list.push(b);
    Store.saveBookings(list);
  },
  getClient() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.client)); } catch (e) { return null; }
  },
  setClient: (client) => save(STORAGE_KEYS.client, client),
  logoutClient() {
    try { localStorage.removeItem(STORAGE_KEYS.client); } catch (e) { /* ignore */ }
  },
  // сброс всех демо данных
  reset() {
    try {
      [...Object.values(STORAGE_KEYS), ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  },
};

// плашка демо-проекта
// плашку можно свернуть, запоминается в localStorage
const DEMO_BAR_KEY = "oc3_demo_bar_collapsed";

function mountDemoBar() {
  let collapsed = false;
  try { collapsed = localStorage.getItem(DEMO_BAR_KEY) === "1"; } catch (e) { /* ignore */ }
  document.body.insertAdjacentHTML("beforeend", `
    <div class="demo-bar ${collapsed ? "collapsed" : ""}" id="demoBar" role="note">
      <button class="demo-bar-chip" data-demo-toggle aria-label="Показать пометку о демо-проекте">Демо</button>
      <div class="demo-bar-body">
        <span class="demo-bar-tag">Демо</span>
        <span class="demo-bar-text">${DEMO_DISCLAIMER}. Все данные вымышлены, заявки никуда не отправляются.</span>
        <button class="demo-bar-reset" data-demo-reset>↺ Сбросить демоданные</button>
        <button class="demo-bar-close" data-demo-toggle aria-label="Свернуть">×</button>
      </div>
    </div>`);
  const bar = document.getElementById("demoBar");
  bar.querySelectorAll("[data-demo-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    const isCollapsed = bar.classList.toggle("collapsed");
    try { localStorage.setItem(DEMO_BAR_KEY, isCollapsed ? "1" : "0"); } catch (e) { /* ignore */ }
  }));
  bar.querySelector("[data-demo-reset]").addEventListener("click", resetDemoData);
}

// сброс и перезагрузка
function resetDemoData() {
  if (!confirm("Сбросить демоданные? Каталог, специалисты и записи вернутся к исходному состоянию, вход в личный кабинет будет сброшен.")) return;
  Store.reset();
  location.reload();
}

// расписание
const Schedule = {
  works(spec, key) {
    return !!spec && spec.active !== false && spec.workDays.includes(parseKey(key).getDay());
  },
  isPast(key, time) {
    const today = todayKey();
    if (key < today) return true;
    if (key > today) return false;
    const now = new Date();
    return timeToMin(time) <= now.getHours() * 60 + now.getMinutes();
  },
  taken(specId, key, bookings, ignoreId) {
    return new Set(bookings
      .filter((b) => b.specialistId === specId && b.date === key && b.status !== "cancelled" && b.id !== ignoreId)
      .map((b) => b.time));
  },
  // свободные окна конкретного специалиста на дату
  freeSlots(spec, key, bookings, ignoreId) {
    if (!Schedule.works(spec, key)) return [];
    const taken = Schedule.taken(spec.id, key, bookings, ignoreId);
    return TIME_SLOTS.filter((t) => !taken.has(t) && !Schedule.isPast(key, t));
  },
  // свободные окна у любого специалиста
  anyFreeSlots(specs, key, bookings) {
    const set = new Set();
    specs.forEach((s) => Schedule.freeSlots(s, key, bookings).forEach((t) => set.add(t)));
    return TIME_SLOTS.filter((t) => set.has(t));
  },
  // кто из специалистов свободен в это время (для Любой специалист)
  freeSpecialist(specs, key, time, bookings) {
    return specs.find((s) => Schedule.freeSlots(s, key, bookings).includes(time)) || null;
  },
  // ближайшая дата со свободными окнами
  nearest(spec, bookings, days = 30) {
    for (let i = 0; i < days; i++) {
      const key = addDays(i);
      const slots = Schedule.freeSlots(spec, key, bookings);
      if (slots.length) return { date: key, slots };
    }
    return null;
  },
};

// утилиты
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(n) {
  return Number(n).toLocaleString("ru-RU") + " ₽";
}
function sizeLabel(f) {
  return `${f.lensWidth}□${f.bridge}-${f.temple}`;
}
function digits(phone) {
  return String(phone || "").replace(/\D/g, "").replace(/^8/, "7");
}
function plural(n, forms) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}
function formatPhone(value) {
  let d = value.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  let out = "+7";
  if (d.length > 1) out += " (" + d.slice(1, 4);
  if (d.length >= 4) out += ")";
  if (d.length > 4) out += " " + d.slice(4, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  return out;
}
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
}
// Соколова Ирина Андреевна -> Соколова И. А.
function shortName(name) {
  const [last, first, middle] = String(name || "").trim().split(/\s+/);
  return [last, first && first[0] + ".", middle && middle[0] + "."].filter(Boolean).join(" ");
}

// аватар: фото или инициалы
function avatarHTML(spec, size = 56) {
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px;--av:${esc(spec.color || "#c8161d")}`;
  return spec.photo
    ? `<img class="avatar" src="${esc(spec.photo)}" alt="" style="${style}">`
    : `<span class="avatar" style="${style}">${esc(initials(spec.name))}</span>`;
}

// левая линза, правая отзеркалена
const LENS_PATHS = {
  round: '<circle cx="55" cy="42" r="28"/>',
  oval: '<ellipse cx="55" cy="42" rx="34" ry="23"/>',
  rectangle: '<rect x="20" y="25" width="70" height="36" rx="8"/>',
  square: '<rect x="22" y="16" width="66" height="52" rx="13"/>',
  wayfarer: '<path d="M17 20 L93 22 Q95 23 93 34 L86 58 Q83 66 74 66 L36 66 Q27 66 24 58 L17 30 Q15 20 17 20 Z"/>',
  aviator: '<path d="M20 23 Q55 13 91 23 Q95 45 81 62 Q67 74 47 70 Q25 65 20 42 Z"/>',
  cateye: '<path d="M14 16 Q42 24 92 25 Q95 46 83 60 Q71 70 51 68 Q29 65 22 47 Q17 33 14 16 Z"/>',
};

// svg оправы
function frameSVG(frame) {
  const lens = LENS_PATHS[frame.shape] || LENS_PATHS.rectangle;
  const thin = frame.material === "metal" || frame.material === "titanium";
  const sw = thin ? 3 : 6;
  const c = esc(frame.color);
  return `<svg viewBox="0 0 200 84" width="100%" aria-hidden="true">
    <g fill="${c}" fill-opacity=".07" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round">
      ${lens}
      <g transform="translate(200,0) scale(-1,1)">${lens}</g>
    </g>
    <path d="M89 35 Q100 25 111 35" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M18 28 L3 25 M182 28 L197 25" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M34 34 Q40 28 48 27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
  </svg>`;
}
