// общее для всех страниц

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const BRAND_HTML = `<span class="brand-text">ОПТИ<span class="brand-lens">К</span><span class="brand-dash">-</span><span class="brand-lens">Ц</span>ЕНТР</span>`;

const NAV = [
  ["index.html", "Главная"],
  ["catalog.html", "Каталог оправ"],
  ["team.html", "Специалисты"],
  ["about.html", "О нас"],
];

const ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.6 0 4.5 1.6 4.5 4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  glasses: '<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M10 15a2 2 0 0 1 4 0M2 15l1.5-7H6M22 15l-1.5-7H18"/>',
  lens: '<circle cx="12" cy="12" r="9"/><path d="M5 9c4-3 10-3 14 0"/>',
  frame: '<rect x="2" y="9" width="8" height="7" rx="2"/><rect x="14" y="9" width="8" height="7" rx="2"/><path d="M10 11.5h4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
};
const SERVICE_ICON = { check: "eye", glasses: "glasses", lenses: "lens", fitting: "frame", repair: "wrench" };

function icon(name, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

// шапка, меню, подвал
function renderLayout() {
  const page = location.pathname.split("/").pop() || "index.html";
  const client = Store.getClient();
  const navLinks = NAV.map(([href, label]) =>
    `<a href="${href}" class="${href === page ? "active" : ""}">${label}</a>`).join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="header" id="header">
      <div class="container">
        <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
        <a href="index.html" class="brand" aria-label="Оптик-Центр — на главную">${BRAND_HTML}</a>
        <nav class="nav">${navLinks}</nav>
        <div class="header-right">
          <span class="header-phone demo-label">${CONTACTS.phone}</span>
          <a href="account.html" class="header-account ${page === "account.html" ? "active" : ""}" title="Личный кабинет">
            ${icon("user", 20)}<span>${client && client.name ? esc(client.name.split(" ")[0]) : "Кабинет"}</span>
          </a>
          <a href="booking.html" class="btn btn-pill">Записаться</a>
        </div>
      </div>
    </header>
    <div class="drawer-backdrop" data-drawer-close></div>
    <aside class="drawer" aria-label="Меню">
      <button class="drawer-close" data-drawer-close aria-label="Закрыть">×</button>
      <a href="index.html" class="brand">${BRAND_HTML}</a>
      ${NAV.map(([href, label]) => `<a class="link ${href === page ? "active" : ""}" href="${href}">${label}</a>`).join("")}
      <a class="link" href="booking.html">Онлайн-запись</a>
      <a class="link" href="account.html">Личный кабинет</a>
      <div class="drawer-foot">
        <span class="drawer-phone demo-label">${CONTACTS.phone}</span>
        <p class="hint">${CONTACTS.address} · ${CONTACTS.hours}</p>
        <a href="booking.html" class="btn btn-pill">Записаться на приём</a>
      </div>
    </aside>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <a href="index.html" class="brand brand-sm">${BRAND_HTML}</a>
          <p>Салон оптики: проверка зрения, подбор очков и контактных линз, ремонт.</p>
        </div>
        <div>
          <h4>Сайт</h4>
          ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
        </div>
        <div>
          <h4>Клиентам</h4>
          <a href="booking.html">Онлайн-запись</a>
          <a href="account.html">Личный кабинет</a>
          <a href="catalog.html#size">Как выбрать размер</a>
        </div>
        <div>
          <h4>Контакты</h4>
          <span class="demo-label">${CONTACTS.phone}</span>
          <span>${CONTACTS.address}</span>
          <span>${CONTACTS.hours}</span>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Оптик-Центр · ${DEMO_DISCLAIMER}</span>
        <a href="admin.html">Вход для сотрудников</a>
      </div>
    </footer>
    <div class="modal-backdrop" id="modal"><div class="modal">
      <button class="modal-close" data-close aria-label="Закрыть">×</button>
      <div id="modalContent"></div>
    </div></div>
    <div class="toast" id="toast"></div>`);
  mountDemoBar();

  const header = $("#header");
  // на красной шапке кнопка белая, иначе не видно
  if ($(".page-head-red")) document.body.classList.add("red-head");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $("#burger").onclick = () => document.body.classList.add("drawer-open");
  $$("[data-drawer-close], .drawer a").forEach((el) =>
    el.addEventListener("click", () => document.body.classList.remove("drawer-open")));

  $("#modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.body.classList.remove("drawer-open");
    }
  });
}

// уведомления и модальное окно
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 3500);
}
function openModal(html, width = 860) {
  $("#modalContent").innerHTML = html;
  $("#modal .modal").style.maxWidth = width + "px";
  $("#modal").classList.add("open");
}
function closeModal() {
  const m = $("#modal");
  if (m) m.classList.remove("open");
}

// оправы
function dimsSVG(f) {
  return `<svg class="dims-svg" viewBox="0 0 260 150" width="100%">
    <g transform="translate(20,34)">${frameSVG(f).replace('width="100%"', 'width="200" height="84"')}</g>
    <g stroke="#98a2b3" stroke-width="1">
      <path d="M23 22 H217 M23 16 V28 M217 16 V28"/>
      <path d="M40 132 H110 M40 126 V138 M110 126 V138"/>
      <path d="M110 132 H130 M130 126 V138"/>
      <path d="M232 52 V102 M226 52 H238 M226 102 H238"/>
    </g>
    <text x="120" y="12" text-anchor="middle">${f.frameWidth} мм — ширина оправы</text>
    <text x="75" y="149" text-anchor="middle">${f.lensWidth} мм</text>
    <text x="120" y="149" text-anchor="middle">${f.bridge}</text>
    <text x="242" y="81">${f.lensHeight}</text>
  </svg>`;
}

function frameCardHTML(f) {
  const badge = !f.inStock
    ? `<span class="card-badge out">Под заказ</span>`
    : f.oldPrice ? `<span class="card-badge">−${Math.round((1 - f.price / f.oldPrice) * 100)}%</span>` : "";
  return `
    <article class="card" data-frame="${f.id}">
      <div class="card-img">${badge}${frameSVG(f)}</div>
      <div class="card-body">
        <div class="card-brand">${esc(f.brand)} · ${SHAPES[f.shape] || ""}</div>
        <div class="card-name">${esc(f.name)}</div>
        <div class="card-size" title="Ширина линзы □ переносица — заушник">📏 ${sizeLabel(f)} · ширина ${f.frameWidth} мм</div>
        <div class="card-foot">
          <div><span class="price-now">${money(f.price)}</span>${f.oldPrice ? `<span class="price-old">${money(f.oldPrice)}</span>` : ""}</div>
          <span class="btn btn-outline btn-sm btn-pill">Подробнее</span>
        </div>
      </div>
    </article>`;
}

// клик по карточке открывает подробности
function bindFrameCards(container) {
  container.addEventListener("click", (e) => {
    const card = e.target.closest("[data-frame]");
    if (card) openProduct(+card.dataset.frame);
  });
}

function openProduct(id) {
  const f = Store.getFrames().find((x) => x.id === id);
  if (!f) return;
  openModal(`
    <div class="product">
      <div>
        <div class="product-img">${frameSVG(f)}</div>
        <h4 style="margin: 20px 0 6px">Габариты</h4>
        ${dimsSVG(f)}
      </div>
      <div>
        <div class="card-brand">${esc(f.brand)}</div>
        <h2 style="font-size: 28px">${esc(f.name)}</h2>
        <div style="margin-bottom: 12px">
          <span class="price-now" style="font-size: 26px">${money(f.price)}</span>
          ${f.oldPrice ? `<span class="price-old">${money(f.oldPrice)}</span>` : ""}
        </div>
        <span class="badge ${f.inStock ? "badge-in" : "badge-out"}">${f.inStock ? "В наличии в салоне" : "Под заказ, 3–5 дней"}</span>
        <p class="hint" style="font-size: 15px">${esc(f.description)}</p>
        <table class="specs">
          <tr><td>Размер</td><td>${sizeLabel(f)}</td></tr>
          <tr><td>Ширина линзы</td><td>${f.lensWidth} мм</td></tr>
          <tr><td>Высота линзы</td><td>${f.lensHeight} мм</td></tr>
          <tr><td>Переносица</td><td>${f.bridge} мм</td></tr>
          <tr><td>Длина заушника</td><td>${f.temple} мм</td></tr>
          <tr><td>Общая ширина оправы</td><td>${f.frameWidth} мм</td></tr>
          <tr><td>Форма</td><td>${SHAPES[f.shape] || "—"}</td></tr>
          <tr><td>Материал</td><td>${MATERIALS[f.material] || "—"}</td></tr>
          <tr><td>Для кого</td><td>${GENDERS[f.gender] || "—"}</td></tr>
        </table>
        <a class="btn btn-block btn-pill" href="booking.html?service=fitting&frame=${f.id}">Записаться на примерку</a>
        <p class="hint" style="text-align: center">Примерка бесплатная, оправу отложим до вашего визита</p>
      </div>
    </div>`);
}

// специалисты
function rating(spec) {
  const r = spec.reviews || [];
  return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
}
function starsHTML(spec) {
  const n = (spec.reviews || []).length;
  if (!n) return "";
  const r = Math.round(rating(spec));
  return `<div class="stars"><span>${"★".repeat(r)}<i>${"★".repeat(5 - r)}</i></span>
    ${n} ${plural(n, ["отзыв", "отзыва", "отзывов"])}</div>`;
}

function openSpecialistInfo(spec, onBook) {
  const reviews = spec.reviews || [];
  const days = spec.workDays.length
    ? [1, 2, 3, 4, 5, 6, 0].map((d) => `<span class="${spec.workDays.includes(d) ? "on" : ""}">${WEEKDAYS[d]}</span>`).join("")
    : "";
  openModal(`
    <div class="spec-info">
      <div class="spec-info-head">
        ${avatarHTML(spec, 96)}
        <div>
          <h2>${esc(spec.name)}</h2>
          <div class="hint">${esc(spec.role)}${spec.experience ? ` · стаж ${esc(spec.experience)}` : ""}</div>
          ${starsHTML(spec)}
        </div>
      </div>
      <p>${esc(spec.bio)}</p>
      ${days ? `<h4>Дни приёма</h4><div class="week">${days}</div>` : `<p class="hint">Сейчас нет свободного времени для онлайн-записи. Это демо-проект: запись по телефону недоступна.</p>`}
      <h4>Отзывы</h4>
      ${reviews.length ? reviews.map((r) => `
        <div class="review">
          <div><b>${esc(r.author)}</b> <span class="stars"><span>${"★".repeat(r.rating)}</span></span>
            <span class="hint">${formatDateShort(r.date)}</span></div>
          <p>${esc(r.text)}</p>
        </div>`).join("") : `<p class="hint">Пока нет отзывов</p>`}
      ${spec.workDays.length ? `<button class="btn btn-block btn-pill" id="specInfoBook" style="margin-top: 16px">Записаться к специалисту</button>` : ""}
    </div>`, 560);
  const btn = $("#specInfoBook");
  if (btn) btn.onclick = () => {
    closeModal();
    if (onBook) onBook(spec);
    else location.href = `booking.html?specialist=${spec.id}`;
  };
}

// карточка специалиста
function teamCardHTML(spec, bookings) {
  const near = Schedule.nearest(spec, bookings);
  return `
    <article class="team-card">
      ${avatarHTML(spec, 88)}
      <h3>${esc(spec.name)}</h3>
      <div class="hint">${esc(spec.role)}</div>
      ${starsHTML(spec) || `<div class="stars muted">Пока нет отзывов</div>`}
      <div class="team-near ${near ? "" : "none"}">
        ${icon("calendar", 16)}
        <span>${near ? `Ближайшая запись:<br><b>${formatDateShort(near.date)}, ${near.slots[0]}</b>` : "Нет свободного времени онлайн"}</span>
      </div>
      <div class="team-actions">
        <button class="btn btn-ghost btn-sm btn-pill" data-spec-info="${spec.id}">Подробнее</button>
        ${near ? `<a class="btn btn-sm btn-pill" href="booking.html?specialist=${spec.id}">Записаться</a>` : ""}
      </div>
    </article>`;
}
function bindTeamCards(container, specs) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-spec-info]");
    if (btn) openSpecialistInfo(specs.find((s) => s.id === +btn.dataset.specInfo));
  });
}

renderLayout();
