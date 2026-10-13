// онлайн запись

const params = new URLSearchParams(location.search);
const specs = Store.getSpecialists().filter((s) => s.active !== false);
const frames = Store.getFrames();
let bookings = Store.getBookings();

const STEPS = ["Специалист", "Услуга", "Дата и время", "Контакты"];
const DAYS_AHEAD = 30;

const state = {
  step: 1,
  specialist: null, // "any" или id специалиста
  service: null,
  date: null,
  time: null,
  frameId: null,
  rescheduleId: null,
};

// начальное состояние из ссылки
(function initFromParams() {
  const sp = params.get("specialist");
  if (sp === "any") state.specialist = "any";
  else if (sp && specs.some((s) => s.id === +sp)) state.specialist = +sp;

  const service = params.get("service");
  if (SERVICES[service]) state.service = service;

  const frame = frames.find((f) => f.id === +params.get("frame"));
  if (frame) {
    state.frameId = frame.id;
    if (!state.service) state.service = "fitting";
  }

  const old = bookings.find((b) => b.id === +params.get("reschedule"));
  if (old && old.status !== "cancelled") {
    state.rescheduleId = old.id;
    if (!state.specialist && specs.some((s) => s.id === old.specialistId)) state.specialist = old.specialistId;
    if (!state.service) state.service = old.service;
    if (!state.frameId) state.frameId = old.frameId;
  }
})();

// хелперы
const getSpec = (id) => specs.find((s) => s.id === id);

function freeSlots(key) {
  if (state.specialist === "any" || state.specialist === null) return Schedule.anyFreeSlots(specs, key, bookings);
  return Schedule.freeSlots(getSpec(state.specialist), key, bookings);
}
function firstFreeDate() {
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const key = addDays(i);
    if (freeSlots(key).length) return key;
  }
  return null;
}
// сбрасываем выбранное время, если у нового специалиста оно занято
function validateTime() {
  if (state.date && state.time && !freeSlots(state.date).includes(state.time)) state.time = null;
}
function isDone(n) {
  if (n === 1) return state.specialist !== null;
  if (n === 2) return !!state.service;
  if (n === 3) return !!(state.date && state.time);
  return false;
}
function go(n) {
  if (n === 4 && !(isDone(1) && isDone(2) && isDone(3))) return nextStep();
  state.step = n;
  render();
  const top = $(".booking-main").getBoundingClientRect().top;
  if (top < 80) window.scrollBy({ top: top - 96, behavior: "smooth" });
}
function nextStep() {
  for (let n = 1; n <= 3; n++) if (!isDone(n)) return go(n);
  go(4);
}

// отрисовка
function render() {
  renderStepper();
  renderSummary();
  renderNotice();
  const views = { 1: viewSpecialists, 2: viewServices, 3: viewDateTime, 4: viewContacts };
  $("#stepBody").innerHTML = views[state.step]();
  if (state.step === 4) bindContactForm();
}

function renderStepper() {
  const ready = isDone(1) && isDone(2) && isDone(3);
  $("#stepper").innerHTML = STEPS.map((title, i) => {
    const n = i + 1;
    const cls = [n === state.step && "active", isDone(n) && "done"].filter(Boolean).join(" ");
    return `<button class="st ${cls}" data-go="${n}" ${n === 4 && !ready ? "disabled" : ""}>
      <span class="st-num">${isDone(n) && n !== state.step ? icon("check", 14) : n}</span><span class="st-title">${title}</span>
    </button>`;
  }).join('<span class="st-line"></span>');
}

function renderNotice() {
  const old = bookings.find((b) => b.id === state.rescheduleId);
  $("#notice").innerHTML = old ? `
    <div class="notice">${icon("calendar", 18)}
      <span>Перенос записи с <b>${formatDateShort(old.date)}, ${old.time}</b>. Старая запись отменится после подтверждения новой.</span>
    </div>` : "";
}

function summaryRow(n, ic, label, value) {
  return `<button class="sum-row ${value ? "filled" : ""}" data-go="${n}">
    <span class="sum-ic">${ic}</span>
    <span class="sum-text"><span class="hint">${label}</span><b>${value || "Не выбрано"}</b></span>
    <span class="sum-edit">${value ? "Изменить" : ""}</span>
  </button>`;
}

function renderSummary() {
  const spec = getSpec(state.specialist);
  const service = SERVICES[state.service];
  const frame = frames.find((f) => f.id === state.frameId);
  let specValue = "";
  let specIcon = icon("users", 20);
  if (state.specialist === "any") specValue = "Любой специалист";
  else if (spec) { specValue = esc(spec.name); specIcon = avatarHTML(spec, 40); }

  $("#summary").innerHTML = `
    <div class="summary-company">
      <span class="summary-logo">ОЦ</span>
      <div><b>«Оптик-Центр»</b><span class="hint">${CONTACTS.address}</span></div>
    </div>
    <h3>Ваша запись</h3>
    ${summaryRow(1, specIcon, "Специалист", specValue)}
    ${summaryRow(2, icon(service ? SERVICE_ICON[state.service] : "frame", 20), "Услуга", service ? service.name : "")}
    ${summaryRow(3, icon("calendar", 20), "Дата и время", state.date && state.time ? `${formatDateShort(state.date)}, ${state.time}` : "")}
    ${frame ? `
      <div class="sum-frame">
        ${frameSVG(frame)}
        <div><span class="hint">Оправа для примерки</span><b>${esc(frame.brand)} ${esc(frame.name)}</b><span>${money(frame.price)}</span></div>
        <button class="sum-remove" data-remove-frame aria-label="Убрать оправу">×</button>
      </div>` : ""}
    ${service ? `<div class="sum-total"><span>Стоимость услуги</span><b>${service.price}</b></div>` : ""}
    <p class="hint sum-note">Оплата в салоне после приёма. Отменить или перенести запись можно в личном кабинете.</p>`;
}

// шаг 1 - специалист
function viewSpecialists() {
  const promos = `
    <div class="promos">
      <a class="promo" href="catalog.html">${icon("percent", 18)} Скидка до 70% на определённые виды оправ <span>›</span></a>
      <button class="promo" data-promo-check>${icon("eye", 18)} Проверка зрения — 1 000 ₽ <span>›</span></button>
      <button class="promo" data-promo-gift>${icon("gift", 18)} Подарочный сертификат <span>›</span></button>
    </div>`;

  const rows = specs.map((s) => {
    const near = Schedule.nearest(s, bookings, DAYS_AHEAD);
    const selected = state.specialist === s.id;
    return `
      <div class="spec-row ${near ? "" : "disabled"} ${selected ? "selected" : ""}" data-spec="${s.id}">
        ${avatarHTML(s, 56)}
        <div class="spec-main">
          <div class="spec-top">
            <div class="spec-who">
              <div class="spec-name">${esc(s.name)}</div>
              <div class="hint">${esc(s.role)}</div>
              ${starsHTML(s)}
            </div>
            <button class="info-btn" data-info="${s.id}" aria-label="О специалисте">${icon("info", 22)}</button>
            <span class="radio"></span>
          </div>
          ${near ? `
            <div class="spec-near">Ближайшее время для записи <b>${formatDateShort(near.date)}</b>:</div>
            <div class="quick-slots">
              ${near.slots.slice(0, 5).map((t) => `<button class="qslot" data-quick="${s.id}|${near.date}|${t}">${t}</button>`).join("")}
              <button class="qslot other" data-other="${s.id}|${near.date}">Другое время</button>
            </div>`
          : `<div class="spec-near muted">Нет свободного времени для онлайн-записи</div>`}
        </div>
      </div>`;
  }).join("");

  return `
    <h2 class="step-title">Выбрать специалиста</h2>
    ${promos}
    <div class="spec-list">
      <div class="spec-row any ${state.specialist === "any" ? "selected" : ""}" data-any>
        <span class="avatar avatar-any" style="width:56px;height:56px">${icon("users", 24)}</span>
        <div class="spec-main"><div class="spec-top">
          <div class="spec-who"><div class="spec-name">Любой специалист</div><div class="hint">Запишем к врачу, у которого есть свободное время</div></div>
          <span class="radio"></span>
        </div></div>
      </div>
      ${rows}
    </div>`;
}

// шаг 2 - услуга
function viewServices() {
  return `
    <div class="step-nav"><button class="back-btn" data-go="1">${icon("back", 18)} Назад</button></div>
    <h2 class="step-title">Выбрать услугу</h2>
    <div class="option-list">
      ${Object.entries(SERVICES).map(([key, s]) => `
        <button class="option ${state.service === key ? "selected" : ""}" data-service="${key}">
          <span class="option-ic">${icon(SERVICE_ICON[key])}</span>
          <span class="option-main"><b>${s.name}</b><span class="hint">${s.text}</span></span>
          <span class="option-side"><b>${s.price}</b><span class="hint">${s.duration}</span></span>
          <span class="radio"></span>
        </button>`).join("")}
    </div>`;
}

// шаг 3 - дата и время
function viewDateTime() {
  if (!state.date || !freeSlots(state.date).length) state.date = firstFreeDate();
  const spec = getSpec(state.specialist);
  const who = spec
    ? `${avatarHTML(spec, 40)}<div><b>${esc(spec.name)}</b><span class="hint">${esc(spec.role)}</span></div>`
    : `<span class="avatar avatar-any" style="width:40px;height:40px">${icon("users", 20)}</span><div><b>Любой специалист</b><span class="hint">Покажем время всех врачей</span></div>`;

  const days = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const key = addDays(i);
    const d = parseKey(key);
    const free = freeSlots(key).length;
    days.push(`
      <button class="day ${key === state.date ? "active" : ""} ${d.getDay() === 0 || d.getDay() === 6 ? "weekend" : ""}"
        data-date="${key}" ${free ? "" : "disabled"}>
        <span>${i === 0 ? "сег" : i === 1 ? "зав" : WEEKDAYS[d.getDay()]}</span>
        <b>${d.getDate()}</b>
        <span>${MONTHS_SHORT[d.getMonth()]}</span>
      </button>`);
  }

  let slotsHTML = `<div class="empty">Нет свободного времени в ближайшие ${DAYS_AHEAD} дней. Выберите другого специалиста.</div>`;
  if (state.date) {
    const slots = freeSlots(state.date);
    const groups = [
      ["Утро", slots.filter((t) => timeToMin(t) < 12 * 60)],
      ["День", slots.filter((t) => timeToMin(t) >= 12 * 60 && timeToMin(t) < 17 * 60)],
      ["Вечер", slots.filter((t) => timeToMin(t) >= 17 * 60)],
    ].filter(([, list]) => list.length);
    slotsHTML = `<div class="date-label">${formatDate(state.date)}</div>` + groups.map(([label, list]) => `
      <div class="slot-group">
        <div class="slot-group-label">${label}</div>
        <div class="slots">${list.map((t) => `<button class="slot ${t === state.time ? "active" : ""}" data-time="${t}">${t}</button>`).join("")}</div>
      </div>`).join("");
  }

  return `
    <div class="step-nav"><button class="back-btn" data-go="2">${icon("back", 18)} Назад</button></div>
    <h2 class="step-title">Выбрать дату и время</h2>
    <div class="who">${who}<button class="link-btn" data-go="1">Сменить</button></div>
    <div class="date-strip-wrap">
      <button class="strip-arrow" data-strip="-1" aria-label="Раньше">‹</button>
      <div class="date-strip" id="dateStrip">${days.join("")}</div>
      <button class="strip-arrow" data-strip="1" aria-label="Позже">›</button>
    </div>
    ${slotsHTML}`;
}

// шаг 4 - контакты
function viewContacts() {
  const client = Store.getClient() || {};
  return `
    <div class="step-nav"><button class="back-btn" data-go="3">${icon("back", 18)} Назад</button></div>
    <h2 class="step-title">Ваши контакты</h2>
    <form id="contactForm" novalidate>
      <div class="row">
        <div class="field"><label for="cName">Имя *</label><input id="cName" autocomplete="name" placeholder="Как к вам обращаться" value="${esc(client.name || "")}"></div>
        <div class="field"><label for="cPhone">Телефон *</label><input id="cPhone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" value="${esc(client.phone || "")}"></div>
      </div>
      <div class="field"><label for="cComment">Комментарий</label>
        <textarea id="cComment" placeholder="Например: нужна справка для водительских прав"></textarea></div>
      <label class="check" style="margin-bottom: 16px"><input type="checkbox" disabled> Напомнить о визите по SMS за день до приёма <span class="hint">(в демо-проекте не отправляется)</span></label>
      <div class="demo-note">Демо-проект: заявка сохранится только в этом браузере и никуда не отправится. Используйте вымышленные имя и телефон.</div>
      <div class="error" id="cError"></div>
      <button class="btn btn-block btn-pill btn-lg" type="submit">Записаться</button>
      <p class="hint" style="text-align: center; margin-bottom: 0">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
    </form>`;
}

function bindContactForm() {
  const phone = $("#cPhone");
  phone.addEventListener("input", () => (phone.value = formatPhone(phone.value)));
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#cName").value.trim();
    const phoneValue = phone.value.trim();
    let err = "";
    if (!name) err = "Укажите имя";
    else if (digits(phoneValue).length !== 11) err = "Укажите телефон полностью";
    $("#cError").textContent = err;
    if (err) return;

    // проверяем еще раз, вдруг время уже заняли
    bookings = Store.getBookings();
    const spec = state.specialist === "any"
      ? Schedule.freeSpecialist(specs, state.date, state.time, bookings)
      : (Schedule.freeSlots(getSpec(state.specialist), state.date, bookings).includes(state.time) ? getSpec(state.specialist) : null);
    if (!spec) {
      state.time = null;
      toast("Это время только что заняли — выберите другое");
      return go(3);
    }

    const booking = {
      id: Date.now(),
      name, phone: formatPhone(phoneValue),
      service: state.service,
      specialistId: spec.id,
      date: state.date, time: state.time,
      frameId: state.frameId,
      comment: $("#cComment").value.trim(),
      status: "new",
      createdAt: Date.now(),
    };
    bookings.push(booking);
    if (state.rescheduleId) {
      const old = bookings.find((b) => b.id === state.rescheduleId);
      if (old) old.status = "cancelled";
    }
    Store.saveBookings(bookings);
    Store.setClient({ phone: booking.phone, name });
    showSuccess(booking, spec);
  });
}

function showSuccess(b, spec) {
  const accountLabel = $(".header-account span");
  if (accountLabel) accountLabel.textContent = b.name.split(" ")[0];
  $("#stepper").innerHTML = "";
  $("#notice").innerHTML = "";
  $("#summary").hidden = true;
  $(".booking-layout").classList.add("done");
  $("#stepBody").innerHTML = `
    <div class="success">
      <div class="success-ic">${icon("check", 40)}</div>
      <h2>Вы записаны!</h2>
      <p class="hint">Это демонстрация: заявка сохранена только в вашем браузере, администратору и на номер ${esc(b.phone)} ничего не отправлено. Её можно увидеть в личном кабинете и в панели управления.</p>
      <div class="success-card">
        <div class="success-spec">${avatarHTML(spec, 52)}<div><b>${esc(spec.name)}</b><span class="hint">${esc(spec.role)}</span></div></div>
        <div class="success-rows">
          <div><span class="hint">Услуга</span><b>${SERVICES[b.service].name}</b></div>
          <div><span class="hint">Дата и время</span><b>${formatDate(b.date)}, ${b.time}</b></div>
          <div><span class="hint">Адрес</span><b>${CONTACTS.address}</b></div>
          <div><span class="hint">Стоимость</span><b>${SERVICES[b.service].price}</b></div>
        </div>
      </div>
      <div class="slide-actions" style="justify-content: center">
        <a href="account.html" class="btn btn-pill">Мои записи</a>
        <a href="index.html" class="btn btn-outline btn-pill">На главную</a>
      </div>
    </div>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// события
function selectSpecialist(value) {
  state.specialist = value;
  validateTime();
  nextStep();
}

document.addEventListener("click", (e) => {
  const t = e.target;
  const info = t.closest("[data-info]");
  if (info) return openSpecialistInfo(getSpec(+info.dataset.info), (s) => selectSpecialist(s.id));

  const quick = t.closest("[data-quick]");
  if (quick) {
    const [id, date, time] = quick.dataset.quick.split("|");
    Object.assign(state, { specialist: +id, date, time });
    return nextStep();
  }
  const other = t.closest("[data-other]");
  if (other) {
    const [id, date] = other.dataset.other.split("|");
    Object.assign(state, { specialist: +id, date, time: null });
    return go(3);
  }
  if (t.closest("[data-any]")) return selectSpecialist("any");
  const row = t.closest(".spec-row[data-spec]");
  if (row && !row.classList.contains("disabled")) return selectSpecialist(+row.dataset.spec);

  if (t.closest("[data-promo-check]")) {
    state.service = "check";
    toast("Услуга «Проверка зрения» выбрана");
    return render();
  }
  if (t.closest("[data-promo-gift]")) return toast("Демо-проект: подарочные сертификаты не оформляются");

  const service = t.closest("[data-service]");
  if (service) {
    state.service = service.dataset.service;
    return nextStep();
  }

  const day = t.closest("[data-date]");
  if (day && !day.disabled) {
    state.date = day.dataset.date;
    validateTime();
    const scroll = $("#dateStrip").scrollLeft;
    render();
    $("#dateStrip").scrollLeft = scroll;
    return;
  }
  const slot = t.closest("[data-time]");
  if (slot) {
    state.time = slot.dataset.time;
    return nextStep();
  }
  const strip = t.closest("[data-strip]");
  if (strip) return $("#dateStrip").scrollBy({ left: +strip.dataset.strip * 300, behavior: "smooth" });

  if (t.closest("[data-remove-frame]")) {
    state.frameId = null;
    return renderSummary();
  }
  const step = t.closest("[data-go]");
  if (step && !step.disabled) return go(+step.dataset.go);
});

// если что-то уже выбрано, начинаем с первого пустого шага
state.step = 1;
if (state.specialist !== null) {
  validateTime();
  nextStep();
} else {
  render();
}
// прокрутка ленты дат к выбранному дню
const activeDay = $(".day.active");
if (activeDay) activeDay.scrollIntoView({ block: "nearest", inline: "center" });
