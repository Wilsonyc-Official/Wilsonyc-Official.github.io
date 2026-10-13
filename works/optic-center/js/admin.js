// админка

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const SESSION_KEY = "oc_admin";

let frames = Store.getFrames();
let bookings = Store.getBookings();
let specs = Store.getSpecialists();
let editingFrameId = null;
let editingBookingId = null;
let editingSpecId = null;

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2500);
}
const options = (dict, selected) =>
  Object.entries(dict).map(([k, v]) => `<option value="${k}" ${k === selected ? "selected" : ""}>${v}</option>`).join("");
const frameTitle = (id) => {
  const f = frames.find((x) => x.id === id);
  return f ? `${esc(f.brand)} ${esc(f.name)}` : "";
};
const getSpec = (id) => specs.find((s) => s.id === id);
const specTitle = (id) => (getSpec(id) ? esc(shortName(getSpec(id).name)) : "—");
const serviceName = (k) => (SERVICES[k] ? SERVICES[k].name : k);

function reload() {
  frames = Store.getFrames();
  bookings = Store.getBookings();
  specs = Store.getSpecialists();
  renderAll();
}
function saveBookings() { Store.saveBookings(bookings); renderAll(); }
function saveFrames() { Store.saveFrames(frames); renderAll(); }
function saveSpecs() { Store.saveSpecialists(specs); renderAll(); }

// вход
function isLogged() {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return false; }
}
function showApp(logged) {
  $("#loginScreen").hidden = logged;
  $("#adminApp").hidden = !logged;
  if (logged) renderAll();
}
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

// навигация
function showView(view) {
  $$(".side-link[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $$("[data-section]").forEach((s) => (s.hidden = s.dataset.section !== view));
}
$$(".side-link[data-view]").forEach((b) => (b.onclick = () => showView(b.dataset.view)));

// обзор
function bars(rows) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return rows.map(([label, n, suffix = ""]) => `
    <div class="bar-row"><span>${label}</span><div class="bar"><i style="width:${(n / max) * 100}%"></i></div><b>${n}${suffix}</b></div>`).join("");
}

function renderDashboard() {
  const today = todayKey();
  $("#todayLabel").textContent = formatDate(today);
  const active = bookings.filter((b) => b.status !== "cancelled");
  const todays = active.filter((b) => b.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const newOnes = bookings.filter((b) => b.status === "new");
  const upcoming = active.filter((b) => b.date >= today && b.status !== "done");

  $("#stats").innerHTML = [
    ["Новых заявок", newOnes.length],
    ["Записей сегодня", todays.length],
    ["Предстоящих записей", upcoming.length],
    ["Оправ в наличии", `${frames.filter((f) => f.inStock).length} / ${frames.length}`],
  ].map(([label, val]) => `<div class="stat"><span>${label}</span><b>${val}</b></div>`).join("");

  const item = (b, showDate) => `
    <div class="day-item">
      <time>${b.time}</time>
      <div><b>${esc(b.name)}</b><small>${serviceName(b.service)} · ${specTitle(b.specialistId)}${showDate ? " · " + formatDateShort(b.date) : ""}</small></div>
      <span class="badge badge-${b.status}">${STATUSES[b.status]}</span>
    </div>`;
  $("#todayList").innerHTML = todays.length ? todays.map((b) => item(b)).join("") : `<p class="hint">На сегодня записей нет</p>`;
  $("#newList").innerHTML = newOnes.length
    ? [...newOnes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((b) => item(b, true)).join("")
    : `<p class="hint">Все заявки обработаны 👍</p>`;

  // загрузка специалистов на 7 дней
  const week = Array.from({ length: 7 }, (_, i) => addDays(i));
  $("#specBars").innerHTML = bars(specs.filter((s) => s.active !== false).map((s) =>
    [esc(shortName(s.name)), active.filter((b) => b.specialistId === s.id && week.includes(b.date)).length]));

  $("#serviceBars").innerHTML = bars(Object.keys(SERVICES)
    .map((k) => [serviceName(k), active.filter((b) => b.service === k).length])
    .sort((a, b) => b[1] - a[1]));

  const nc = $("#newCount");
  nc.hidden = !newOnes.length;
  nc.textContent = newOnes.length;
}

// записи
function renderBookings() {
  const q = $("#bSearch").value.trim().toLowerCase();
  const status = $("#bStatus").value;
  const spec = $("#bSpec").value;
  const period = $("#bPeriod").value;
  const today = todayKey();

  const list = bookings.filter((b) => {
    if (status && b.status !== status) return false;
    if (spec && b.specialistId !== +spec) return false;
    if (period === "upcoming" && b.date < today) return false;
    if (period === "today" && b.date !== today) return false;
    if (period === "past" && b.date >= today) return false;
    if (q && !`${b.name} ${b.phone}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => {
    const k = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    return period === "past" ? -k : k;
  });

  $("#bookingsBody").innerHTML = list.length ? list.map((b) => {
    const s = getSpec(b.specialistId);
    return `
    <tr>
      <td><b>${b.time}</b><br><span class="hint">${formatDateShort(b.date)}</span></td>
      <td><b>${esc(b.name)}</b><br><span class="hint">${esc(b.phone)}</span>
        ${b.comment ? `<br><span class="hint">💬 ${esc(b.comment)}</span>` : ""}</td>
      <td>${s ? `<div class="cell-spec">${avatarHTML(s, 30)}<span>${esc(shortName(s.name))}</span></div>` : "—"}</td>
      <td>${serviceName(b.service)}</td>
      <td>${b.frameId ? frameTitle(b.frameId) || "<span class='hint'>удалена</span>" : "—"}</td>
      <td><select data-status="${b.id}" class="badge-${b.status}">${options(STATUSES, b.status)}</select></td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" data-edit-booking="${b.id}">Изменить</button>
        <button class="btn btn-ghost btn-sm" data-del-booking="${b.id}" title="Удалить">🗑</button>
      </div></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7" class="hint" style="text-align:center; padding: 30px">Записей не найдено</td></tr>`;
}

$("#bStatus").innerHTML += options(STATUSES);
["#bSearch", "#bStatus", "#bPeriod", "#bSpec"].forEach((id) => $(id).addEventListener("input", renderBookings));

$("#bookingsBody").addEventListener("change", (e) => {
  const id = +e.target.dataset.status;
  if (!id) return;
  const b = bookings.find((x) => x.id === id);
  b.status = e.target.value;
  saveBookings();
  toast(`Статус: ${STATUSES[b.status]}`);
});
$("#bookingsBody").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit-booking]");
  const del = e.target.closest("[data-del-booking]");
  if (edit) openBookingForm(+edit.dataset.editBooking);
  if (del && confirm("Удалить запись?")) {
    bookings = bookings.filter((b) => b.id !== +del.dataset.delBooking);
    saveBookings();
    toast("Запись удалена");
  }
});

// список времени с пометкой занятых окон выбранного специалиста
function fillTimeOptions(form, keepTime) {
  const specId = +form.specialistId.value;
  const taken = Schedule.taken(specId, form.date.value, bookings, editingBookingId);
  const works = Schedule.works(getSpec(specId), form.date.value || todayKey());
  form.time.innerHTML = TIME_SLOTS.map((t) =>
    `<option value="${t}">${t}${taken.has(t) ? " — занято" : ""}</option>`).join("");
  form.time.value = keepTime;
  $("#bookingError").textContent = form.date.value && !works ? "Внимание: у специалиста в этот день нет приёма по графику" : "";
}

function openBookingForm(id) {
  editingBookingId = id || null;
  const b = bookings.find((x) => x.id === id) ||
    { name: "", phone: "", service: "check", status: "confirmed", date: todayKey(), time: TIME_SLOTS[0],
      specialistId: (specs.find((s) => s.active !== false) || {}).id, frameId: null, comment: "" };
  const form = $("#bookingEditForm").elements;
  $("#bookingFormTitle").textContent = id ? "Редактировать запись" : "Новая запись";
  form.service.innerHTML = Object.entries(SERVICES).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join("");
  form.status.innerHTML = options(STATUSES);
  form.specialistId.innerHTML = specs.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  form.frameId.innerHTML = `<option value="">— не выбрана —</option>` +
    frames.map((f) => `<option value="${f.id}">${esc(f.brand)} ${esc(f.name)} (${sizeLabel(f)})</option>`).join("");
  ["name", "phone", "service", "status", "date", "comment"].forEach((k) => (form[k].value = b[k] ?? ""));
  form.specialistId.value = b.specialistId ?? "";
  form.frameId.value = b.frameId ?? "";
  fillTimeOptions(form, b.time);
  $("#bookingModal").classList.add("open");
}
$("#addBooking").onclick = () => openBookingForm(null);
["specialistId", "date"].forEach((n) =>
  $("#bookingEditForm").elements[n].addEventListener("change", () => {
    const form = $("#bookingEditForm").elements;
    fillTimeOptions(form, form.time.value);
  }));

$("#bookingEditForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target.elements;
  const data = {
    name: form.name.value.trim(), phone: form.phone.value.trim(), service: form.service.value,
    status: form.status.value, date: form.date.value, time: form.time.value,
    specialistId: +form.specialistId.value,
    frameId: form.frameId.value ? +form.frameId.value : null, comment: form.comment.value.trim(),
  };
  if (!data.name || !data.phone || !data.date) {
    $("#bookingError").textContent = "Заполните имя, телефон и дату";
    return;
  }
  const clash = bookings.find((b) => b.id !== editingBookingId && b.specialistId === data.specialistId &&
    b.date === data.date && b.time === data.time && b.status !== "cancelled");
  if (clash && data.status !== "cancelled") {
    $("#bookingError").textContent = `Это время у специалиста уже занято: ${clash.name}`;
    return;
  }
  if (editingBookingId) Object.assign(bookings.find((b) => b.id === editingBookingId), data);
  else bookings.push({ id: Date.now(), createdAt: Date.now(), ...data });
  saveBookings();
  closeModals();
  toast("Запись сохранена");
});

// специалисты
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function renderSpecs() {
  const today = todayKey();
  $("#specsBody").innerHTML = specs.map((s) => {
    const ahead = bookings.filter((b) => b.specialistId === s.id && b.date >= today && b.status !== "cancelled" && b.status !== "done").length;
    const n = (s.reviews || []).length;
    return `
    <tr>
      <td class="thumb" style="width: 56px">${avatarHTML(s, 44)}</td>
      <td><b>${esc(s.name)}</b><br><span class="hint">${esc(s.role)}${s.experience ? " · " + esc(s.experience) : ""}</span></td>
      <td><div class="week week-sm">${WEEK_ORDER.map((d) => `<span class="${s.workDays.includes(d) ? "on" : ""}">${WEEKDAYS[d]}</span>`).join("")}</div></td>
      <td>${n ? `★ ${(s.reviews.reduce((a, r) => a + r.rating, 0) / n).toFixed(1)} · ${n}` : "—"}</td>
      <td>${ahead}</td>
      <td><button class="badge ${s.active !== false && s.workDays.length ? "badge-in" : "badge-out"}" style="border:0; cursor:pointer" data-toggle-spec="${s.id}">
        ${s.active === false ? "Скрыт" : s.workDays.length ? "Доступна" : "Нет приёма"}</button></td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" data-edit-spec="${s.id}">Изменить</button>
        <button class="btn btn-ghost btn-sm" data-del-spec="${s.id}" title="Удалить">🗑</button>
      </div></td>
    </tr>`;
  }).join("");

  const sel = $("#bSpec");
  const current = sel.value;
  sel.innerHTML = `<option value="">Все специалисты</option>` + specs.map((s) => `<option value="${s.id}">${esc(shortName(s.name))}</option>`).join("");
  sel.value = current;
}

$("#specsBody").addEventListener("click", (e) => {
  const toggle = e.target.closest("[data-toggle-spec]");
  const edit = e.target.closest("[data-edit-spec]");
  const del = e.target.closest("[data-del-spec]");
  if (toggle) {
    const s = getSpec(+toggle.dataset.toggleSpec);
    s.active = s.active === false;
    saveSpecs();
    toast(s.active ? "Специалист показан на сайте" : "Специалист скрыт с сайта");
  }
  if (edit) openSpecForm(+edit.dataset.editSpec);
  if (del) {
    const s = getSpec(+del.dataset.delSpec);
    if (confirm(`Удалить специалиста «${s.name}»? Его записи останутся в истории.`)) {
      specs = specs.filter((x) => x !== s);
      saveSpecs();
      toast("Специалист удалён");
    }
  }
});

function readSpecForm() {
  const form = $("#specForm").elements;
  return {
    name: form.name.value.trim(), role: form.role.value.trim(), experience: form.experience.value.trim(),
    photo: form.photo.value.trim(), color: form.color.value, bio: form.bio.value.trim(),
    active: form.active.checked,
    workDays: $$("#workDays input:checked").map((i) => +i.value),
  };
}
function updateSpecPreview() {
  const d = readSpecForm();
  $("#specPreview").innerHTML = `${avatarHTML({ ...d, name: d.name || "Новый специалист" }, 64)}
    <div><b>${esc(d.name || "ФИО специалиста")}</b><span class="hint">${esc(d.role || "Должность")}</span></div>`;
}

function openSpecForm(id) {
  editingSpecId = id || null;
  const s = getSpec(id) || { name: "", role: "Врач-офтальмолог", experience: "", photo: "", color: "#c8161d", bio: "", workDays: [1, 2, 3, 4, 5], active: true };
  const form = $("#specForm").elements;
  $("#specFormTitle").textContent = id ? "Редактировать специалиста" : "Новый специалист";
  ["name", "role", "experience", "photo", "color", "bio"].forEach((k) => (form[k].value = s[k] ?? ""));
  form.active.checked = s.active !== false;
  $("#workDays").innerHTML = WEEK_ORDER.map((d) => `
    <label><input type="checkbox" value="${d}" ${s.workDays.includes(d) ? "checked" : ""}><span>${WEEKDAYS[d]}</span></label>`).join("");
  $("#specError").textContent = "";
  updateSpecPreview();
  $("#specModal").classList.add("open");
}
$("#addSpec").onclick = () => openSpecForm(null);
$("#specForm").addEventListener("input", updateSpecPreview);
$("#specForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = readSpecForm();
  if (!data.name || !data.role) {
    $("#specError").textContent = "Заполните ФИО и должность";
    return;
  }
  if (editingSpecId) Object.assign(getSpec(editingSpecId), data);
  else specs.push({ id: Math.max(0, ...specs.map((s) => s.id)) + 1, reviews: [], ...data });
  saveSpecs();
  closeModals();
  toast("Специалист сохранён — изменения уже на сайте");
});

// каталог
function renderFrames() {
  const q = $("#cSearch").value.trim().toLowerCase();
  const stock = $("#cStock").value;
  const list = frames.filter((f) => {
    if (stock === "in" && !f.inStock) return false;
    if (stock === "out" && f.inStock) return false;
    if (q && !`${f.brand} ${f.name}`.toLowerCase().includes(q)) return false;
    return true;
  });
  $("#framesBody").innerHTML = list.length ? list.map((f) => `
    <tr>
      <td class="thumb">${frameSVG(f)}</td>
      <td><b>${esc(f.name)}</b><br><span class="hint">${esc(f.brand)}</span></td>
      <td>${SHAPES[f.shape] || "—"}<br><span class="hint">${MATERIALS[f.material] || ""} · ${GENDERS[f.gender] || ""}</span></td>
      <td>${sizeLabel(f)}<br><span class="hint">ширина ${f.frameWidth} мм</span></td>
      <td><b>${money(f.price)}</b>${f.oldPrice ? `<br><span class="price-old" style="margin:0">${money(f.oldPrice)}</span>` : ""}</td>
      <td><button class="badge ${f.inStock ? "badge-in" : "badge-out"}" style="border:0; cursor:pointer" data-toggle="${f.id}" title="Переключить">
        ${f.inStock ? "В наличии" : "Под заказ"}</button></td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" data-edit-frame="${f.id}">Изменить</button>
        <button class="btn btn-ghost btn-sm" data-del-frame="${f.id}" title="Удалить">🗑</button>
      </div></td>
    </tr>`).join("") : `<tr><td colspan="7" class="hint" style="text-align:center; padding: 30px">Оправ не найдено</td></tr>`;
}
["#cSearch", "#cStock"].forEach((id) => $(id).addEventListener("input", renderFrames));

$("#framesBody").addEventListener("click", (e) => {
  const toggle = e.target.closest("[data-toggle]");
  const edit = e.target.closest("[data-edit-frame]");
  const del = e.target.closest("[data-del-frame]");
  if (toggle) {
    const f = frames.find((x) => x.id === +toggle.dataset.toggle);
    f.inStock = !f.inStock;
    saveFrames();
  }
  if (edit) openFrameForm(+edit.dataset.editFrame);
  if (del) {
    const f = frames.find((x) => x.id === +del.dataset.delFrame);
    if (confirm(`Удалить оправу «${f.brand} ${f.name}»?`)) {
      frames = frames.filter((x) => x !== f);
      saveFrames();
      toast("Оправа удалена");
    }
  }
});

const FRAME_NUM_FIELDS = ["price", "oldPrice", "lensWidth", "bridge", "temple", "lensHeight", "frameWidth"];

function readFrameForm() {
  const form = $("#frameForm").elements;
  const data = {
    brand: form.brand.value.trim(), name: form.name.value.trim(),
    shape: form.shape.value, material: form.material.value, gender: form.gender.value,
    color: form.color.value, inStock: form.inStock.checked, description: form.description.value.trim(),
  };
  FRAME_NUM_FIELDS.forEach((k) => (data[k] = form[k].value ? Math.max(0, Math.round(+form[k].value)) : 0));
  if (!data.oldPrice || data.oldPrice <= data.price) delete data.oldPrice;
  return data;
}
function updatePreview() {
  $("#framePreview").innerHTML = frameSVG(readFrameForm());
}

function openFrameForm(id) {
  editingFrameId = id || null;
  const f = frames.find((x) => x.id === id) ||
    { brand: "", name: "", shape: "rectangle", material: "acetate", gender: "unisex", color: "#1d1d1f",
      price: "", lensWidth: 52, bridge: 18, temple: 140, lensHeight: 40, frameWidth: 138, inStock: true, description: "" };
  const form = $("#frameForm").elements;
  $("#frameFormTitle").textContent = id ? "Редактировать оправу" : "Новая оправа";
  form.shape.innerHTML = options(SHAPES);
  form.material.innerHTML = options(MATERIALS);
  form.gender.innerHTML = options(GENDERS);
  ["brand", "name", "shape", "material", "gender", "color", "description", ...FRAME_NUM_FIELDS]
    .forEach((k) => (form[k].value = f[k] ?? ""));
  form.inStock.checked = f.inStock;
  $("#frameError").textContent = "";
  updatePreview();
  $("#frameModal").classList.add("open");
}
$("#addFrame").onclick = () => openFrameForm(null);
$("#frameForm").addEventListener("input", updatePreview);

$("#frameForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = readFrameForm();
  if (!data.brand || !data.name || !data.price) {
    $("#frameError").textContent = "Заполните бренд, модель и цену";
    return;
  }
  if (editingFrameId) {
    const i = frames.findIndex((f) => f.id === editingFrameId);
    frames[i] = { id: editingFrameId, ...data };
  } else {
    frames.push({ id: Math.max(0, ...frames.map((f) => f.id)) + 1, ...data });
  }
  saveFrames();
  closeModals();
  toast("Оправа сохранена — изменения уже на сайте");
});

// модальные окна
function closeModals() {
  $$(".modal-backdrop").forEach((m) => m.classList.remove("open"));
}
$$(".modal-backdrop").forEach((m) => m.addEventListener("click", (e) => {
  if (e.target === m || e.target.hasAttribute("data-close")) closeModals();
}));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

// прочее
$("#resetDemo").onclick = resetDemoData;
mountDemoBar();

function renderAll() {
  renderSpecs();
  renderDashboard();
  renderBookings();
  renderFrames();
}

// обновляем, если записи добавили в другой вкладке
window.addEventListener("storage", reload);

showApp(isLogged());
