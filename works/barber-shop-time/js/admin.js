// админка

const SESSION_KEY = "tm1_admin";
const VIEW_TITLES = {
  overview: "Обзор", bookings: "Записи", schedule: "Расписание", masters: "Мастера",
  branches: "Филиалы", services: "Услуги и цены", reviews: "Отзывы", clients: "Клиенты",
};

let view = "overview";
let data = {};
const filters = { branch: "", status: "", period: "upcoming", q: "" };
const sched = { branch: 1, date: todayKey() };
let adminMap = null;

function reload() {
  data = {
    branches: Store.getBranches(),
    services: Store.getServices(),
    masters: Store.getMasters(),
    bookings: Store.getBookings(),
    users: Store.getUsers(),
    reviews: Store.getReviews(),
  };
}
const branchById = (id) => data.branches.find((b) => b.id === id);
const masterById = (id) => data.masters.find((m) => m.id === id);
const serviceById = (id) => data.services.find((s) => s.id === id);
const styleOf = (b) => { const s = serviceById(b.serviceId); return s ? s.styles[b.styleIdx] : null; };
const options = (list, selected, empty) =>
  (empty ? `<option value="">${empty}</option>` : "") +
  list.map(([v, l]) => `<option value="${v}" ${String(v) === String(selected) ? "selected" : ""}>${esc(l)}</option>`).join("");
const statusBadge = (s) => `<span class="badge badge-${s}">${STATUSES[s]}</span>`;

// вход
function isLogged() {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return false; }
}
function showApp(logged) {
  $("#loginScreen").hidden = logged;
  $("#adminApp").hidden = !logged;
  if (logged) { reload(); renderView(); }
}
$("#fillAdmin").onclick = () => { $("#lUser").value = "admin"; $("#lPass").value = "admin"; };
$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("#lUser").value.trim() === "admin" && $("#lPass").value === "admin") {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (err) { /* ignore */ }
    showApp(true);
  } else {
    $("#lError").textContent = "Неверный логин или пароль";
  }
});
$("#logout").onclick = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  showApp(false);
};
$("#resetDemo").onclick = () => {
  if (!confirm("Сбросить все демо-данные? Записи, клиенты, мастера и цены вернутся к исходным.")) return;
  Store.reset();
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) { /* ignore */ }
  reload(); renderView(); toast("Демо-данные сброшены");
};

// навигация
$("#adminNav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]");
  if (!b) return;
  view = b.dataset.view;
  document.body.classList.remove("admin-nav-open");
  renderView();
});
$("#adminBurger").onclick = () => document.body.classList.toggle("admin-nav-open");
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal" || e.target.closest("[data-modal-close]")) closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

function renderView() {
  $$("#adminNav [data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#viewTitle").textContent = VIEW_TITLES[view];
  adminMap = null;
  ({ overview, bookings: bookingsView, schedule, masters: mastersView, branches: branchesView, services: servicesView, reviews: reviewsView, clients })[view]();
  const pending = data.reviews.filter((r) => r.status === "pending").length;
  $("#pendingCount").textContent = pending || "";
}

// обзор
function overview() {
  const today = todayKey(), weekEnd = addDays(7);
  const active = data.bookings.filter((b) => b.status !== "cancelled");
  const todayList = active.filter((b) => b.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const week = active.filter((b) => b.date >= today && b.date < weekEnd);
  const fresh = data.bookings.filter((b) => b.status === "new");
  const revenue = week.reduce((s, b) => s + b.price, 0);
  const byBranch = data.branches.map((br) => [br, week.filter((b) => b.branchId === br.id).length]);
  const max = Math.max(1, ...byBranch.map(([, n]) => n));
  const byService = data.services.map((s) => [s, active.filter((b) => b.serviceId === s.id).length]).sort((a, b) => b[1] - a[1]);

  $("#view").innerHTML = `
    <div class="kpis">
      <div class="kpi"><small>Записей сегодня</small><b>${todayList.length}</b></div>
      <div class="kpi"><small>На 7 дней вперёд</small><b>${week.length}</b></div>
      <div class="kpi accent"><small>Новые, ждут подтверждения</small><b>${fresh.length}</b></div>
      <div class="kpi"><small>Ожидаемая выручка за неделю</small><b>${rub(revenue)}</b></div>
    </div>
    <div class="admin-cols">
      <div class="panel">
        <h3>Сегодня, ${formatDateShort(today)}</h3>
        ${todayList.length ? `<ul class="today-list">${todayList.map((b) => `
          <li><b>${b.time}</b><span>${esc(b.name)} · ${esc(styleOf(b)?.name || "")}<small>${esc(branchById(b.branchId)?.name || "")} · ${esc(masterById(b.masterId)?.name || "")}</small></span>${statusBadge(b.status)}</li>`).join("")}</ul>`
          : `<p class="empty">На сегодня записей нет. Оформите тестовую запись на сайте — она появится здесь.</p>`}
        ${fresh.length ? `<button class="btn btn-accent btn-sm" id="goNew">Новые записи (${fresh.length})</button>` : ""}
      </div>
      <div class="panel">
        <h3>Загрузка филиалов на неделю</h3>
        <div class="bars">${byBranch.map(([br, n]) => `
          <div class="bar-row"><span>${esc(br.name)}</span><div class="bar"><i style="width:${(n / max) * 100}%"></i></div><b>${n}</b></div>`).join("")}</div>
        <h3 class="mt">Популярные направления</h3>
        <div class="bars">${byService.map(([s, n]) => `
          <div class="bar-row"><span>${esc(s.name)}</span><div class="bar alt"><i style="width:${(n / Math.max(1, byService[0][1])) * 100}%"></i></div><b>${n}</b></div>`).join("")}</div>
      </div>
    </div>`;
  const g = $("#goNew");
  if (g) g.onclick = () => { Object.assign(filters, { status: "new", period: "all" }); view = "bookings"; renderView(); };
}

// записи
function filteredBookings() {
  const today = todayKey();
  const q = filters.q.trim().toLowerCase();
  return data.bookings.filter((b) => {
    if (filters.branch && b.branchId !== Number(filters.branch)) return false;
    if (filters.status && b.status !== filters.status) return false;
    if (filters.period === "today" && b.date !== today) return false;
    if (filters.period === "upcoming" && b.date < today) return false;
    if (filters.period === "past" && b.date >= today) return false;
    if (q && !`${b.name} ${b.phone} ${formatPhone(b.phone)}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => {
    const k = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    return filters.period === "past" ? -k : k;
  });
}

function bookingsView() {
  const list = filteredBookings();
  $("#view").innerHTML = `
    <div class="toolbar">
      <select id="fBranch">${options(data.branches.map((b) => [b.id, b.name]), filters.branch, "Все филиалы")}</select>
      <select id="fStatus">${options(Object.entries(STATUSES), filters.status, "Все статусы")}</select>
      <select id="fPeriod">${options([["upcoming", "Предстоящие"], ["today", "Сегодня"], ["past", "Прошедшие"], ["all", "Все даты"]], filters.period)}</select>
      <input id="fQ" placeholder="Поиск: имя или телефон" value="${esc(filters.q)}">
      <button class="btn btn-accent btn-sm" id="addBooking">+ Новая запись</button>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Дата и время</th><th>Клиент</th><th>Услуга</th><th>Филиал / мастер</th><th>Сумма</th><th>Статус</th><th></th></tr></thead>
        <tbody>${list.length ? list.map((b) => `
          <tr>
            <td><b>${formatDateShort(b.date)}</b><br>${b.time}</td>
            <td>${esc(b.name)}<br><small>${formatPhone(b.phone)}</small></td>
            <td>${esc(styleOf(b)?.name || "—")}<br><small>${esc(serviceById(b.serviceId)?.name || "")}</small>${b.comment ? `<br><small class="comment">«${esc(b.comment)}»</small>` : ""}</td>
            <td>${esc(branchById(b.branchId)?.name || "—")}<br><small>${esc(masterById(b.masterId)?.name || "—")}${b.anyMaster ? " · «любой»" : ""}</small></td>
            <td>${rub(b.price)}</td>
            <td><select class="status-select s-${b.status}" data-status="${b.id}">${options(Object.entries(STATUSES), b.status)}</select></td>
            <td class="row-actions"><button class="link-btn" data-edit="${b.id}">Изменить</button><button class="link-btn danger" data-del="${b.id}">Удалить</button></td>
          </tr>`).join("") : `<tr><td colspan="7" class="empty">Записей по фильтру нет</td></tr>`}</tbody>
      </table>
    </div>
    <p class="hint">Найдено: ${list.length}</p>`;

  $("#fBranch").onchange = (e) => { filters.branch = e.target.value; bookingsView(); };
  $("#fStatus").onchange = (e) => { filters.status = e.target.value; bookingsView(); };
  $("#fPeriod").onchange = (e) => { filters.period = e.target.value; bookingsView(); };
  $("#fQ").oninput = (e) => {
    filters.q = e.target.value;
    clearTimeout(bookingsView.t);
    bookingsView.t = setTimeout(() => { bookingsView(); const i = $("#fQ"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250);
  };
  $("#addBooking").onclick = () => editBooking(null);
}

function saveBookings() { Store.saveBookings(data.bookings); }

function editBooking(id) {
  const b = id ? data.bookings.find((x) => x.id === id) : {
    name: "", phone: "", branchId: data.branches[0].id, serviceId: data.services[0].id, styleIdx: 0,
    masterId: null, date: todayKey(), time: "", status: "confirmed", comment: "",
  };
  openModal(`
    <h3>${id ? "Редактировать запись" : "Новая запись"}</h3>
    <form id="bForm" class="form-grid">
      <label class="field"><span>Имя клиента</span><input id="bName" value="${esc(b.name)}" required></label>
      <label class="field"><span>Телефон</span><input id="bPhone" value="${esc(b.phone ? formatPhone(b.phone) : "")}" placeholder="+7 (___) ___-__-__"></label>
      <label class="field"><span>Филиал</span><select id="bBranch">${options(data.branches.map((x) => [x.id, x.name]), b.branchId)}</select></label>
      <label class="field"><span>Направление</span><select id="bService">${options(data.services.map((x) => [x.id, x.name]), b.serviceId)}</select></label>
      <label class="field"><span>Услуга</span><select id="bStyle"></select></label>
      <label class="field"><span>Мастер</span><select id="bMaster"></select></label>
      <label class="field"><span>Дата</span><input id="bDate" type="date" value="${b.date}"></label>
      <label class="field"><span>Время</span><select id="bTime"></select></label>
      <label class="field"><span>Статус</span><select id="bStatus">${options(Object.entries(STATUSES), b.status)}</select></label>
      <label class="field wide"><span>Комментарий</span><input id="bComment" value="${esc(b.comment)}"></label>
      <p class="form-error wide" id="bError"></p>
      <div class="wide modal-actions"><button type="button" class="btn btn-outline" data-modal-close>Отмена</button><button class="btn btn-accent">Сохранить</button></div>
    </form>`);
  bindPhoneMask($("#bPhone"));

  const fillStyles = () => {
    const s = serviceById($("#bService").value);
    $("#bStyle").innerHTML = options(s.styles.map((st, i) => [i, `${st.name} — ${rub(st.price)}`]), $("#bService").value === b.serviceId ? b.styleIdx : 0);
  };
  const fillMasters = () => {
    const list = data.masters.filter((m) => m.active && m.branchId === Number($("#bBranch").value) && m.services.includes($("#bService").value));
    $("#bMaster").innerHTML = list.length ? options(list.map((m) => [m.id, m.name]), b.masterId) : `<option value="">Нет мастеров</option>`;
  };
  const fillTimes = () => {
    const m = masterById(Number($("#bMaster").value));
    const st = serviceById($("#bService").value).styles[Number($("#bStyle").value)];
    const br = branchById(Number($("#bBranch").value));
    let slots = m && st && $("#bDate").value ? masterSlots(m, br, $("#bDate").value, st.duration, data.bookings, b.id) : [];
    if (id && b.time && !slots.includes(b.time) && $("#bDate").value === b.date && m && m.id === b.masterId) slots = [b.time, ...slots];
    $("#bTime").innerHTML = slots.length ? options(slots.map((t) => [t, t]), b.time) : `<option value="">Нет свободного времени</option>`;
  };
  const refresh = () => { fillMasters(); fillTimes(); };
  fillStyles(); refresh();
  $("#bService").onchange = () => { fillStyles(); refresh(); };
  $("#bBranch").onchange = refresh;
  $("#bStyle").onchange = fillTimes;
  $("#bMaster").onchange = fillTimes;
  $("#bDate").onchange = fillTimes;

  $("#bForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = normPhone($("#bPhone").value);
    if (!$("#bName").value.trim()) return ($("#bError").textContent = "Укажите имя клиента");
    if (!phone) return ($("#bError").textContent = "Введите телефон полностью");
    if (!$("#bMaster").value || !$("#bTime").value) return ($("#bError").textContent = "Выберите мастера и свободное время");
    const st = serviceById($("#bService").value).styles[Number($("#bStyle").value)];
    const user = data.users.find((u) => u.phone === phone);
    const upd = {
      name: $("#bName").value.trim(), phone, userId: user ? user.id : null,
      branchId: Number($("#bBranch").value), serviceId: $("#bService").value, styleIdx: Number($("#bStyle").value),
      masterId: Number($("#bMaster").value), date: $("#bDate").value, time: $("#bTime").value,
      duration: st.duration, price: st.price, status: $("#bStatus").value, comment: $("#bComment").value.trim(),
    };
    if (id) Object.assign(b, upd);
    else data.bookings.push({ id: Date.now(), anyMaster: false, createdAt: Date.now(), ...upd });
    saveBookings(); closeModal(); renderView(); toast(id ? "Запись обновлена" : "Запись добавлена");
  });
}

// расписание (день по мастерам)
function schedule() {
  const br = branchById(sched.branch) || data.branches[0];
  const ms = data.masters.filter((m) => m.branchId === br.id && m.active);
  const open = timeToMin(br.open), close = timeToMin(br.close);
  const rows = [];
  for (let t = open; t < close; t += SLOT_STEP) rows.push(t);
  const dayBookings = data.bookings.filter((b) => b.branchId === br.id && b.date === sched.date && b.status !== "cancelled");
  const wd = parseKey(sched.date).getDay();
  const rowH = 34;

  $("#view").innerHTML = `
    <div class="toolbar">
      <select id="sBranch">${options(data.branches.map((b) => [b.id, b.name]), br.id)}</select>
      <button class="btn btn-outline btn-sm" id="sPrev">←</button>
      <input type="date" id="sDate" value="${sched.date}">
      <button class="btn btn-outline btn-sm" id="sNext">→</button>
      <button class="btn btn-outline btn-sm" id="sToday">Сегодня</button>
      <span class="hint">${formatDate(sched.date)} · ${br.open}–${br.close}</span>
    </div>
    <div class="sched-wrap">
      <div class="sched" style="--cols:${ms.length};--rowh:${rowH}px">
        <div class="sched-times">
          <div class="sched-head"></div>
          ${rows.map((t) => `<div class="sched-time">${t % 60 === 0 ? minToTime(t) : ""}</div>`).join("")}
        </div>
        ${ms.map((m) => `
          <div class="sched-col ${m.workDays.includes(wd) ? "" : "off"}">
            <div class="sched-head">${avatar(m, 30)}<span>${esc(m.name.split(" ")[0])}</span></div>
            <div class="sched-body" style="height:${rows.length * rowH}px">
              ${m.workDays.includes(wd) ? "" : `<div class="sched-off">Выходной</div>`}
              ${dayBookings.filter((b) => b.masterId === m.id).map((b) => {
                const top = ((timeToMin(b.time) - open) / SLOT_STEP) * rowH;
                const h = Math.max(rowH, (b.duration / SLOT_STEP) * rowH) - 3;
                return `<button class="sched-item s-${b.status}" style="top:${top}px;height:${h}px" data-edit="${b.id}">
                  <b>${b.time} ${esc(b.name)}</b><span>${esc(styleOf(b)?.name || "")}</span></button>`;
              }).join("")}
            </div>
          </div>`).join("")}
      </div>
    </div>
    <p class="hint">В расписании показаны записи с сайта и добавленные вручную. Нажмите на запись, чтобы изменить её.</p>`;
  $("#sBranch").onchange = (e) => { sched.branch = Number(e.target.value); schedule(); };
  $("#sDate").onchange = (e) => { if (e.target.value) { sched.date = e.target.value; schedule(); } };
  $("#sPrev").onclick = () => { sched.date = addDays(-1, sched.date); schedule(); };
  $("#sNext").onclick = () => { sched.date = addDays(1, sched.date); schedule(); };
  $("#sToday").onclick = () => { sched.date = todayKey(); schedule(); };
}

// мастера
function mastersView() {
  $("#view").innerHTML = `
    <div class="toolbar"><button class="btn btn-accent btn-sm" id="addMaster">+ Добавить мастера</button></div>
    <div class="admin-cards">${data.masters.map((m) => `
      <div class="admin-card ${m.active ? "" : "inactive"}">
        <div class="admin-card-head">${avatar(m, 48)}<div><b>${esc(m.name)}</b><small>${esc(m.role)}</small></div></div>
        <span>${icon("pin", 14)} ${esc(branchById(m.branchId)?.name || "—")}</span>
        <span>${icon("calendar", 14)} ${[1, 2, 3, 4, 5, 6, 0].filter((d) => m.workDays.includes(d)).map((d) => WEEKDAYS[d]).join(", ") || "нет рабочих дней"}</span>
        <span class="chips">${m.services.map((s) => `<span class="chip">${esc(serviceById(s)?.name || s)}</span>`).join("")}</span>
        <div class="admin-card-foot">${m.active ? "" : `<span class="badge badge-cancelled">Скрыт</span>`}
          <button class="link-btn" data-edit-master="${m.id}">Изменить</button></div>
      </div>`).join("")}</div>`;
  $("#addMaster").onclick = () => editMaster(null);
}

function editMaster(id) {
  const m = id ? masterById(id) : { name: "", role: "Парикмахер", branchId: data.branches[0].id, services: [], workDays: [1, 2, 3, 4, 5], color: "#c2410c", rating: 5, active: true };
  openModal(`
    <h3>${id ? "Редактировать мастера" : "Новый мастер"}</h3>
    <form id="mForm" class="form-grid">
      <label class="field"><span>Имя и фамилия</span><input id="mName" value="${esc(m.name)}"></label>
      <label class="field"><span>Должность</span><input id="mRole" value="${esc(m.role)}"></label>
      <label class="field"><span>Филиал</span><select id="mBranch">${options(data.branches.map((b) => [b.id, b.name]), m.branchId)}</select></label>
      <label class="field"><span>Цвет аватара</span><input id="mColor" type="color" value="${m.color}"></label>
      <fieldset class="field wide"><span>Услуги</span><div class="checks">
        ${data.services.map((s) => `<label><input type="checkbox" name="mSrv" value="${s.id}" ${m.services.includes(s.id) ? "checked" : ""}> ${esc(s.name)}</label>`).join("")}
      </div></fieldset>
      <fieldset class="field wide"><span>Рабочие дни</span><div class="checks days">
        ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label><input type="checkbox" name="mDay" value="${d}" ${m.workDays.includes(d) ? "checked" : ""}> ${WEEKDAYS[d]}</label>`).join("")}
      </div></fieldset>
      <label class="check-line wide"><input type="checkbox" id="mActive" ${m.active ? "checked" : ""}> Показывать в онлайн-записи</label>
      <p class="form-error wide" id="mError"></p>
      <div class="wide modal-actions"><button type="button" class="btn btn-outline" data-modal-close>Отмена</button><button class="btn btn-accent">Сохранить</button></div>
    </form>`);
  $("#mForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const services = $$("input[name=mSrv]:checked").map((x) => x.value);
    if (!$("#mName").value.trim()) return ($("#mError").textContent = "Укажите имя");
    if (!services.length) return ($("#mError").textContent = "Отметьте хотя бы одну услугу");
    const upd = {
      name: $("#mName").value.trim(), role: $("#mRole").value.trim(), branchId: Number($("#mBranch").value),
      color: $("#mColor").value, services, workDays: $$("input[name=mDay]:checked").map((x) => Number(x.value)),
      active: $("#mActive").checked,
    };
    if (id) Object.assign(m, upd);
    else data.masters.push({ id: Math.max(0, ...data.masters.map((x) => x.id)) + 1, rating: 5, ...upd });
    Store.saveMasters(data.masters); closeModal(); renderView(); toast("Мастер сохранён");
  });
}

// филиалы
function branchesView() {
  $("#view").innerHTML = `
    <div class="admin-cols">
      <div class="admin-cards one">${data.branches.map((b) => `
        <div class="admin-card ${b.active ? "" : "inactive"}">
          <div class="admin-card-head"><span class="branch-pin">${icon("pin", 20)}</span><div><b>${esc(b.name)}</b><small>${esc(b.address)} · ${esc(b.district)}</small></div></div>
          <span>${icon("clock", 14)} ${b.open}–${b.close} · мастеров: ${data.masters.filter((m) => m.branchId === b.id && m.active).length}</span>
          <span class="chips"><span class="chip ${b.yandexOrgId ? "chip-on" : ""}">Яндекс: ${b.yandexOrgId ? "привязан" : "не указан"}</span><span class="chip ${b.dgisFirmId ? "chip-on" : ""}">2ГИС: ${b.dgisFirmId ? "привязан" : "не указан"}</span></span>
          <div class="admin-card-foot">${b.active ? "" : `<span class="badge badge-cancelled">Закрыт для записи</span>`}
            <button class="link-btn" data-edit-branch="${b.id}">Изменить</button></div>
        </div>`).join("")}</div>
      <div class="map admin-map" id="adminMap"></div>
    </div>
    <p class="hint">Демо: адреса и координаты филиалов вымышлены.</p>`;
  adminMap = createBranchMap($("#adminMap"), data.branches);
}

function editBranch(id) {
  const b = branchById(id);
  openModal(`
    <h3>Филиал</h3>
    <form id="brForm" class="form-grid">
      <label class="field"><span>Название</span><input id="brName" value="${esc(b.name)}"></label>
      <label class="field"><span>Район</span><input id="brDistrict" value="${esc(b.district)}"></label>
      <label class="field wide"><span>Адрес</span><input id="brAddress" value="${esc(b.address)}"></label>
      <label class="field"><span>Открытие</span><input id="brOpen" type="time" step="1800" value="${b.open}"></label>
      <label class="field"><span>Закрытие</span><input id="brClose" type="time" step="1800" value="${b.close}"></label>
      <label class="field"><span>Широта</span><input id="brLat" type="number" step="0.0001" value="${b.lat}"></label>
      <label class="field"><span>Долгота</span><input id="brLng" type="number" step="0.0001" value="${b.lng}"></label>
      <label class="field"><span>ID в Яндекс Картах</span><input id="brYandex" value="${esc(b.yandexOrgId || "")}" placeholder="например, 1234567890"></label>
      <label class="field"><span>ID в 2ГИС</span><input id="brDgis" value="${esc(b.dgisFirmId || "")}" placeholder="например, 70000001012345678"></label>
      <p class="hint wide id-help">ID — число из адреса карточки: yandex.ru/maps/org/название/<b>1234567890</b>/ и 2gis.ru/yakutsk/firm/<b>70000001012345678</b>. После этого на сайте заработают кнопки «Оставить отзыв» и виджет отзывов Яндекса.</p>
      <label class="check-line wide"><input type="checkbox" id="brActive" ${b.active ? "checked" : ""}> Доступен для онлайн-записи</label>
      <p class="form-error wide" id="brError"></p>
      <div class="wide modal-actions"><button type="button" class="btn btn-outline" data-modal-close>Отмена</button><button class="btn btn-accent">Сохранить</button></div>
    </form>`);
  $("#brForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (timeToMin($("#brOpen").value) >= timeToMin($("#brClose").value)) return ($("#brError").textContent = "Время закрытия должно быть позже открытия");
    Object.assign(b, {
      name: $("#brName").value.trim() || b.name, district: $("#brDistrict").value.trim(), address: $("#brAddress").value.trim() || b.address,
      open: $("#brOpen").value, close: $("#brClose").value,
      lat: Number($("#brLat").value) || b.lat, lng: Number($("#brLng").value) || b.lng, active: $("#brActive").checked,
      yandexOrgId: $("#brYandex").value.trim(), dgisFirmId: $("#brDgis").value.trim(),
    });
    Store.saveBranches(data.branches); closeModal(); renderView(); toast("Филиал сохранён");
  });
}

// услуги и цены
let serviceTab = null;
function servicesView() {
  serviceTab = serviceTab || data.services[0].id;
  const s = serviceById(serviceTab);
  $("#view").innerHTML = `
    <div class="tabs">${data.services.map((x) => `<button class="tab ${x.id === serviceTab ? "active" : ""}" data-stab="${x.id}">${esc(x.name)}</button>`).join("")}</div>
    <form id="sForm" class="panel">
      <label class="field"><span>Описание направления</span><input id="sText" value="${esc(s.text)}"></label>
      <div class="table-wrap">
        <table class="table price-table">
          <thead><tr><th></th><th>Услуга</th><th>Цена, ₽</th><th>Длительность, мин</th></tr></thead>
          <tbody>${s.styles.map((st, i) => `
            <tr>
              <td><img src="${st.photo}" alt="" class="thumb"></td>
              <td><input data-f="name" data-i="${i}" value="${esc(st.name)}"></td>
              <td><input data-f="price" data-i="${i}" type="number" min="0" step="50" value="${st.price}"></td>
              <td><input data-f="duration" data-i="${i}" type="number" min="15" step="15" value="${st.duration}"></td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="modal-actions"><button class="btn btn-accent">Сохранить цены</button></div>
    </form>`;
  $("#sForm").addEventListener("submit", (e) => {
    e.preventDefault();
    s.text = $("#sText").value.trim();
    $$("#sForm [data-f]").forEach((inp) => {
      const st = s.styles[Number(inp.dataset.i)];
      const f = inp.dataset.f;
      st[f] = f === "name" ? inp.value.trim() || st.name : Math.max(f === "duration" ? 15 : 0, Number(inp.value) || 0);
    });
    Store.saveServices(data.services); toast("Цены сохранены — они уже на сайте");
  });
}

// отзывы
const rFilters = { status: "", branch: "", source: "" };

function reviewsView() {
  const list = data.reviews.filter((r) =>
    (!rFilters.status || r.status === rFilters.status) && (!rFilters.branch || r.branchId === Number(rFilters.branch))
    && (!rFilters.source || r.source === rFilters.source)).sort((a, b) => b.date.localeCompare(a.date));
  const pub = reviewStats(data.reviews.filter((r) => r.status === "published"));
  $("#view").innerHTML = `
    <div class="kpis">
      <div class="kpi"><small>Средняя оценка</small><b>${pub.avg.toFixed(1)} ★</b></div>
      <div class="kpi"><small>Опубликовано</small><b>${pub.count}</b></div>
      <div class="kpi accent"><small>Ждут модерации</small><b>${data.reviews.filter((r) => r.status === "pending").length}</b></div>
      <div class="kpi"><small>С Яндекса / 2ГИС</small><b>${data.reviews.filter((r) => r.source === "yandex").length} / ${data.reviews.filter((r) => r.source === "2gis").length}</b></div>
    </div>
    <div class="toolbar">
      <select id="rfStatus">${options(Object.entries(REVIEW_STATUSES), rFilters.status, "Все статусы")}</select>
      <select id="rfBranch">${options(data.branches.map((b) => [b.id, b.name]), rFilters.branch, "Все филиалы")}</select>
      <select id="rfSource">${options(Object.entries(REVIEW_SOURCES), rFilters.source, "Все источники")}</select>
      <span class="toolbar-spacer"></span>
      <button class="btn btn-outline btn-sm" id="rExportJson">Экспорт JSON</button>
      <button class="btn btn-outline btn-sm" id="rExportCsv">Экспорт CSV (Excel)</button>
      <button class="btn btn-accent btn-sm" id="rImport">Импорт…</button>
      <input type="file" id="rFile" accept=".json,.csv,text/csv,application/json" hidden>
    </div>
    <div class="admin-reviews">${list.length ? list.map((r) => `
      <div class="admin-review st-${r.status}">
        <div class="admin-review-head">
          <span class="stars">${stars(r.rating)}</span>
          <b>${esc(r.author)}</b>
          <small>${new Date(r.date).toLocaleDateString("ru-RU")} · ${esc(branchById(r.branchId)?.name || "—")}${masterById(r.masterId) ? ` · ${esc(masterById(r.masterId).name)}` : ""}</small>
          <span class="source-badge src-${r.source}">${REVIEW_SOURCES[r.source]}${r.externalId ? ` #${esc(r.externalId)}` : ""}</span>
          <span class="badge badge-${r.status === "published" ? "done" : r.status === "pending" ? "new" : "cancelled"}">${REVIEW_STATUSES[r.status]}</span>
        </div>
        <p>${esc(r.text)}</p>
        ${r.reply ? `<div class="review-reply"><b>Ответ салона</b><p>${esc(r.reply)}</p></div>` : ""}
        <div class="row-actions">
          ${r.status !== "published" ? `<button class="link-btn" data-rstatus="${r.id}:published">Опубликовать</button>` : ""}
          ${r.status !== "hidden" ? `<button class="link-btn" data-rstatus="${r.id}:hidden">Скрыть</button>` : ""}
          <button class="link-btn" data-rreply="${r.id}">${r.reply ? "Изменить ответ" : "Ответить"}</button>
          <button class="link-btn danger" data-rdel="${r.id}">Удалить</button>
        </div>
      </div>`).join("") : `<p class="empty">Отзывов по фильтру нет</p>`}</div>
    <details class="panel format-help">
      <summary>Формат файла для импорта / экспорта</summary>
      <p>Поддерживаются JSON и CSV (разделитель «;», кодировка UTF-8). Колонки:</p>
      <code>${REVIEW_FIELDS.join(" ; ")}</code>
      <ul>
        <li><b>source</b> — <code>site</code>, <code>yandex</code> или <code>2gis</code>; <b>externalId</b> — ID отзыва на площадке. По паре source + externalId повторный импорт обновляет отзыв, а не дублирует.</li>
        <li><b>branchId</b> или <b>branchAddress</b> — к какому филиалу относится отзыв.</li>
        <li><b>rating</b> — от 1 до 5, <b>date</b> — дата в формате 2026-10-11, <b>status</b> — <code>published</code>, <code>pending</code> или <code>hidden</code>.</li>
      </ul>
      <p class="hint">Яндекс Карты и 2ГИС не дают загружать отзывы к себе от имени салона — их пишут сами клиенты.
        Поэтому файл используется, чтобы перенести отзывы <b>с площадок на сайт</b> (выгрузка из кабинета Яндекс Бизнеса / 2ГИС или от агрегатора)
        и чтобы выгрузить отзывы сайта в Excel. Клиентов после визита сайт просит продублировать отзыв на картах — кнопками со ссылками на карточки филиалов.</p>
    </details>`;

  $("#rfStatus").onchange = (e) => { rFilters.status = e.target.value; reviewsView(); };
  $("#rfBranch").onchange = (e) => { rFilters.branch = e.target.value; reviewsView(); };
  $("#rfSource").onchange = (e) => { rFilters.source = e.target.value; reviewsView(); };
  $("#rExportJson").onclick = () => download(`taim-reviews-${todayKey()}.json`, ReviewIO.toJSON(list, data.branches), "application/json");
  $("#rExportCsv").onclick = () => download(`taim-reviews-${todayKey()}.csv`, ReviewIO.toCSV(list, data.branches), "text/csv;charset=utf-8");
  $("#rImport").onclick = () => $("#rFile").click();
  $("#rFile").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { list: merged, stats } = ReviewIO.merge(data.reviews, ReviewIO.parse(String(reader.result)), data.branches);
        data.reviews = merged;
        saveReviews();
        toast(`Импорт: добавлено ${stats.added}, обновлено ${stats.updated}, пропущено ${stats.skipped}`);
      } catch (err) {
        toast("Не удалось прочитать файл — проверьте формат");
      }
    };
    reader.readAsText(file, "utf-8");
  };
}

function saveReviews() { Store.saveReviews(data.reviews); renderView(); }

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function replyReview(id) {
  const r = data.reviews.find((x) => x.id === id);
  openModal(`
    <h3>Ответ на отзыв</h3>
    <div class="review-quote"><span class="stars">${stars(r.rating)}</span> <b>${esc(r.author)}</b><p>${esc(r.text)}</p></div>
    <form id="replyForm">
      <label class="field"><span>Ответ салона (виден всем)</span><textarea id="replyText" rows="4" maxlength="1000">${esc(r.reply)}</textarea></label>
      <label class="check-line"><input type="checkbox" id="replyPublish" ${r.status === "published" ? "checked" : ""}> Опубликовать отзыв</label>
      <div class="modal-actions"><button type="button" class="btn btn-outline" data-modal-close>Отмена</button><button class="btn btn-accent">Сохранить</button></div>
    </form>`);
  $("#replyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    r.reply = $("#replyText").value.trim();
    r.replyDate = r.reply ? new Date().toISOString() : null;
    if ($("#replyPublish").checked) r.status = "published";
    else if (r.status === "published") r.status = "hidden";
    closeModal(); saveReviews(); toast("Ответ сохранён");
  });
}

// клиенты
function clients() {
  const rows = data.users.map((u) => {
    const bs = data.bookings.filter((b) => b.userId === u.id);
    const done = bs.filter((b) => b.status === "done");
    const last = bs.map((b) => b.date).sort().pop();
    return { u, total: bs.length, sum: done.reduce((s, b) => s + b.price, 0), last };
  }).sort((a, b) => b.u.createdAt - a.u.createdAt);
  $("#view").innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Клиент</th><th>Телефон</th><th>Регистрация</th><th>Записей</th><th>Последняя</th><th>Потратил</th></tr></thead>
        <tbody>${rows.map(({ u, total, sum, last }) => `
          <tr><td><b>${esc(u.name)}</b></td><td>${formatPhone(u.phone)}</td><td>${new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
          <td>${total}</td><td>${last ? formatDateShort(last) : "—"}</td><td>${rub(sum)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    <p class="hint">Клиенты регистрируются при онлайн-записи. Демо: все номера вымышленные.</p>`;
}

// события
$("#view").addEventListener("change", (e) => {
  const s = e.target.closest("[data-status]");
  if (!s) return;
  const b = data.bookings.find((x) => x.id === Number(s.dataset.status));
  b.status = s.value;
  saveBookings();
  s.className = `status-select s-${b.status}`;
  toast(`Статус: ${STATUSES[b.status]}`);
});
$("#view").addEventListener("click", (e) => {
  const t = e.target;
  const edit = t.closest("[data-edit]");
  if (edit) return editBooking(Number(edit.dataset.edit));
  const del = t.closest("[data-del]");
  if (del && confirm("Удалить запись без возможности восстановления?")) {
    data.bookings = data.bookings.filter((x) => x.id !== Number(del.dataset.del));
    saveBookings(); renderView(); toast("Запись удалена");
    return;
  }
  const em = t.closest("[data-edit-master]");
  if (em) return editMaster(Number(em.dataset.editMaster));
  const eb = t.closest("[data-edit-branch]");
  if (eb) return editBranch(Number(eb.dataset.editBranch));
  const rs = t.closest("[data-rstatus]");
  if (rs) {
    const [id, status] = rs.dataset.rstatus.split(":");
    data.reviews.find((x) => x.id === Number(id)).status = status;
    saveReviews(); toast(status === "published" ? "Отзыв опубликован" : "Отзыв скрыт");
    return;
  }
  const rr = t.closest("[data-rreply]");
  if (rr) return replyReview(Number(rr.dataset.rreply));
  const rd = t.closest("[data-rdel]");
  if (rd && confirm("Удалить отзыв без возможности восстановления?")) {
    data.reviews = data.reviews.filter((x) => x.id !== Number(rd.dataset.rdel));
    saveReviews(); toast("Отзыв удалён");
    return;
  }
  const st = t.closest("[data-stab]");
  if (st) { serviceTab = st.dataset.stab; servicesView(); }
});

showApp(isLogged());
