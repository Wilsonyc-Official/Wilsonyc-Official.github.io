// общее для всех страниц (шапка, подвал, модалки, иконки)

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const BRAND_HTML = `<span class="brand-mark">${"<svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3.5 2'/></svg>"}</span><span class="brand-text">ТАЙМ<small>парикмахерская</small></span>`;

const NAV = [
  ["index.html#about", "О нас"],
  ["index.html#services", "Услуги"],
  ["index.html#gallery", "Работы"],
  ["index.html#branches", "Филиалы"],
  ["index.html#masters", "Мастера"],
  ["reviews.html", "Отзывы"],
];

const ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.6 0 4.5 1.6 4.5 4.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  child: '<circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 21l4-6 4 6M7 12h10"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.6 0-1.1-.9-1.4-.9-2.4 0-.8.6-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.1-4-7.5-9-7.5z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
};

function icon(name, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function avatar(master, size = 56) {
  return `<span class="avatar" style="--c:${master.color};width:${size}px;height:${size}px;font-size:${Math.round(size / 2.6)}px">${esc(initials(master.name))}</span>`;
}

// карточка отзыва (главная + страница отзывов)
function reviewCard(r, { branches = [], services = [], masters = [] } = {}) {
  const b = branches.find((x) => x.id === r.branchId);
  const s = services.find((x) => x.id === r.serviceId);
  const m = masters.find((x) => x.id === r.masterId);
  const d = new Date(r.date);
  const meta = [s && s.name, m && `мастер ${m.name}`].filter(Boolean).join(" · ");
  return `
    <figure class="review">
      <div class="review-head">
        <span class="review-avatar">${esc((r.author || "?")[0].toUpperCase())}</span>
        <div><b>${esc(r.author)}</b><small>${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</small></div>
        <span class="source-badge src-${r.source}">${REVIEW_SOURCES[r.source]}</span>
      </div>
      <div class="stars" aria-label="Оценка ${r.rating} из 5">${stars(r.rating)}</div>
      <blockquote>${esc(r.text)}</blockquote>
      <figcaption>${b ? `${icon("pin", 14)} ${esc(b.name)}` : ""}${meta ? ` · ${esc(meta)}` : ""}</figcaption>
      ${r.reply ? `<div class="review-reply"><b>Ответ салона</b><p>${esc(r.reply)}</p></div>` : ""}
    </figure>`;
}

// шапка, меню, подвал
function renderLayout() {
  const page = location.pathname.split("/").pop() || "index.html";
  const user = Store.currentUser();
  const navLinks = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="topbar">
    <div class="demo-bar" role="note">
      <b>ДЕМО</b><span>${DEMO_DISCLAIMER}</span>
    </div>
    <header class="header" id="header">
      <div class="container">
        <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
        <a href="index.html" class="brand" aria-label="Тайм — на главную">${BRAND_HTML}</a>
        <nav class="nav">${navLinks}</nav>
        <div class="header-right">
          <a href="account.html" class="header-account ${page === "account.html" ? "active" : ""}" title="Личный кабинет">
            ${icon("user", 20)}<span>${user ? esc(user.name.split(" ")[0]) : "Войти"}</span>
          </a>
          <a href="booking.html" class="btn btn-accent btn-sm">Записаться</a>
        </div>
      </div>
    </header>
    </div>
    <div class="drawer-backdrop" data-drawer-close></div>
    <aside class="drawer" aria-label="Меню">
      <button class="drawer-close" data-drawer-close aria-label="Закрыть">×</button>
      <a href="index.html" class="brand">${BRAND_HTML}</a>
      ${NAV.map(([href, label]) => `<a class="link" href="${href}" data-drawer-close>${label}</a>`).join("")}
      <a class="link" href="account.html">${user ? "Личный кабинет" : "Вход / регистрация"}</a>
      <a class="link muted" href="admin.html">Админ-панель</a>
      <div class="drawer-foot">
        <p class="hint">${CONTACTS.city} · ${CONTACTS.hours}</p>
        <a href="booking.html" class="btn btn-accent">Записаться онлайн</a>
      </div>
    </aside>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <a href="index.html" class="brand brand-light">${BRAND_HTML}</a>
          <p class="footer-text">Сеть парикмахерских в Якутске: стрижки, окрашивание, уход за волосами, брови и ресницы.</p>
        </div>
        <div>
          <h4>Клиентам</h4>
          <a href="booking.html">Онлайн-запись</a>
          <a href="account.html">Личный кабинет</a>
          <a href="index.html#branches">Филиалы на карте</a>
          <a href="reviews.html">Отзывы</a>
        </div>
        <div>
          <h4>Сотрудникам</h4>
          <a href="admin.html">Админ-панель</a>
          <a href="#" data-credits>Источники фотографий</a>
        </div>
        <div>
          <h4>Контакты</h4>
          <p>${CONTACTS.city}</p>
          <p>${CONTACTS.hours}</p>
          <p class="demo-label">Телефон: демо-проект</p>
        </div>
      </div>
      <div class="container footer-demo">
        <b>Это демонстрационная версия сайта.</b> Парикмахерская «Тайм», адреса филиалов, мастера, цены, отзывы и записи
        вымышлены и созданы для показа возможностей. Данные хранятся только в вашем браузере и никуда не отправляются.
        Фотографии — с фотостока Pexels (бесплатная лицензия), список — в разделе
        <a href="#" data-credits>«Источники фотографий»</a>.
      </div>
    </footer>
    <div class="modal-backdrop" id="modal" hidden>
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal-close" data-modal-close aria-label="Закрыть">×</button>
        <div id="modalBody"></div>
      </div>
    </div>
    <div class="toast" id="toast" role="status"></div>`);

  $$("i[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 22); });

  const toggleDrawer = (open) => document.body.classList.toggle("drawer-open", open);
  $("#burger").onclick = () => toggleDrawer(true);
  $$("[data-drawer-close]").forEach((el) => el.addEventListener("click", () => toggleDrawer(false)));

  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $$("[data-credits]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); openCredits(); }));
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal" || e.target.closest("[data-modal-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); toggleDrawer(false); } });
}

function openModal(html) {
  $("#modalBody").innerHTML = html;
  $("#modal").hidden = false;
  document.body.classList.add("modal-open");
}
function closeModal() {
  const m = $("#modal");
  if (!m || m.hidden) return;
  m.hidden = true;
  document.body.classList.remove("modal-open");
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

function openCredits() {
  const rows = CREDITS.length
    ? CREDITS.map((c) => `<li><b>${esc(c.file)}</b> — ${esc(c.license)} ·
        <a href="${esc(c.src)}" target="_blank" rel="noopener">фото #${c.id} на Pexels</a></li>`).join("")
    : "<li>Список источников пуст.</li>";
  openModal(`
    <h3>Источники фотографий</h3>
    <p class="hint">Все фото взяты с фотостока Pexels (бесплатная лицензия Pexels) и используются
      только для демонстрации. Люди на фото не связаны с салоном «Тайм».</p>
    <ul class="credits">${rows}</ul>`);
}

// карта филиалов (Яндекс Карты)
// яндекс карты api 2.1, по клику на метку выбирается филиал
// для прода нужен ключ YANDEX_MAPS_API_KEY в data.js
// если api не загрузилось, запасной вариант через iframe
let ymapsPromise = null;
function loadYmaps() {
  if (ymapsPromise) return ymapsPromise;
  ymapsPromise = new Promise((resolve, reject) => {
    const done = () => window.ymaps.ready(() => resolve(window.ymaps), reject);
    if (window.ymaps) return done();
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${YANDEX_MAPS_API_KEY ? `&apikey=${encodeURIComponent(YANDEX_MAPS_API_KEY)}` : ""}`;
    s.async = true;
    s.onload = () => (window.ymaps ? done() : reject(new Error("ymaps missing")));
    s.onerror = () => reject(new Error("ymaps load error"));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error("ymaps timeout")), 12000);
  });
  return ymapsPromise;
}

const PIN = { normal: "islands#nightDotIconWithCaption", active: "islands#orangeDotIconWithCaption" };

function yandexApiMap(ym, canvas, branches, selectedId, onPick) {
  const map = new ym.Map(canvas, { center: [62.0281, 129.7126], zoom: 12, controls: ["zoomControl", "fullscreenControl"] });
  map.behaviors.disable("scrollZoom");
  const marks = {};
  branches.forEach((b) => {
    const pm = new ym.Placemark([b.lat, b.lng], { iconCaption: b.name, hintContent: `${b.name}, ${b.address}` },
      { preset: b.id === selectedId ? PIN.active : PIN.normal, hasBalloon: false, cursor: "pointer" });
    pm.events.add("click", () => onPick(b.id));
    map.geoObjects.add(pm);
    marks[b.id] = pm;
  });
  const fitAll = () => {
    if (branches.length > 1) map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 });
    else if (branches.length) map.setCenter([branches[0].lat, branches[0].lng], 15);
  };
  fitAll();
  const select = (id) => {
    Object.entries(marks).forEach(([bid, pm]) => pm.options.set("preset", Number(bid) === id ? PIN.active : PIN.normal));
    const b = branches.find((x) => x.id === id);
    if (b) map.setCenter([b.lat, b.lng], Math.max(map.getZoom(), 14), { duration: 400 });
  };
  if (selectedId) select(selectedId);
  return { select };
}

function yandexWidgetUrl(branches, selected) {
  const pts = branches.map((b) => `${b.lng},${b.lat}`).join("~");
  let ll, z;
  if (selected) { ll = `${selected.lng},${selected.lat}`; z = 15; }
  else if (branches.length === 1) { ll = `${branches[0].lng},${branches[0].lat}`; z = 15; }
  else {
    const avg = (k) => branches.reduce((s, b) => s + b[k], 0) / branches.length;
    ll = `${avg("lng").toFixed(4)},${avg("lat").toFixed(4)}`;
    z = 12;
  }
  return `https://yandex.ru/map-widget/v1/?ll=${ll}&z=${z}&pt=${pts}&l=map`;
}

function yandexWidgetMap(canvas, branches, selectedId) {
  canvas.innerHTML = `<iframe class="map-frame" title="Филиалы на Яндекс Картах" loading="lazy" allowfullscreen></iframe>`;
  const frame = $(".map-frame", canvas);
  const select = (id) => { frame.src = yandexWidgetUrl(branches, branches.find((x) => x.id === id)); };
  select(selectedId);
  return { select };
}

// onSelect(id) вызывается по клику на метку
function createBranchMap(el, branches, { selectedId = null, onSelect = null } = {}) {
  el.innerHTML = `
    <div class="map-canvas"><div class="map-loading">Загружаем карту…</div></div>
    <div class="map-demo-tag">Демо: адреса вымышлены</div>
    <div class="map-links" hidden></div>`;
  const canvas = $(".map-canvas", el);
  const links = $(".map-links", el);
  let current = selectedId, impl = null;

  const showLinks = (id) => {
    const b = branches.find((x) => x.id === id);
    links.hidden = !b;
    if (!b) return;
    const l = branchLinks(b);
    links.innerHTML = `<b>${esc(b.name)}</b><span>${esc(b.address)} · ${b.open}–${b.close}</span>
      <a href="${l.map}" target="_blank" rel="noopener">Открыть в Яндекс Картах</a>
      <a href="${l.route}" target="_blank" rel="noopener">Маршрут</a>`;
  };
  const ctrl = {
    select(id) {
      current = id;
      showLinks(id);
      if (impl) impl.select(id);
    },
  };
  const onPick = (id) => (onSelect ? onSelect(id) : ctrl.select(id));

  showLinks(current);
  loadYmaps()
    .then((ym) => { canvas.innerHTML = ""; impl = yandexApiMap(ym, canvas, branches, current, onPick); })
    .catch(() => { impl = yandexWidgetMap(canvas, branches, current); });
  return ctrl;
}

// маска телефона +7 (XXX) XXX-XX-XX
function bindPhoneMask(input) {
  input.addEventListener("input", () => {
    let d = input.value.replace(/\D/g, "");
    if (d[0] === "8" || d[0] === "7") d = d.slice(1);
    d = d.slice(0, 10);
    let out = "+7";
    if (d.length) out += ` (${d.slice(0, 3)}`;
    if (d.length >= 3) out += ")";
    if (d.length > 3) out += ` ${d.slice(3, 6)}`;
    if (d.length > 6) out += `-${d.slice(6, 8)}`;
    if (d.length > 8) out += `-${d.slice(8, 10)}`;
    input.value = out;
  });
}


if (document.body.dataset.layout !== "none") renderLayout();
