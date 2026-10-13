// онлайн запись (5 шагов)

const B_SERVICES = Store.getServices();
const B_BRANCHES = Store.getBranches().filter((b) => b.active);
const B_MASTERS = Store.getMasters().filter((m) => m.active);

const STEPS = ["Филиал", "Услуга", "Мастер", "Дата и время", "Подтверждение"];
const DAYS_AHEAD = 21;

// состояние записи, черновик сохраняется в localStorage
const state = Object.assign(
  { step: 0, branchId: null, serviceId: null, styleIdx: null, masterId: null, date: null, time: null, comment: "", authTab: "login" },
  Store.getDraft(),
);
state.done = null;

// если пришли с главной: ?service=men&style=2
const params = new URLSearchParams(location.search);
if (params.get("service") && B_SERVICES.some((s) => s.id === params.get("service"))) {
  if (state.serviceId !== params.get("service")) Object.assign(state, { step: 0, masterId: null, date: null, time: null });
  state.serviceId = params.get("service");
  const st = Number(params.get("style"));
  state.styleIdx = params.has("style") && st >= 0 && st < 10 ? st : null;
  history.replaceState(null, "", "booking.html");
}

const getBranch = () => B_BRANCHES.find((b) => b.id === state.branchId);
const getService = () => B_SERVICES.find((s) => s.id === state.serviceId);
const getStyle = () => (getService() && state.styleIdx !== null ? getService().styles[state.styleIdx] : null);
const getMaster = (id = state.masterId) => B_MASTERS.find((m) => m.id === id);
const branchOffers = (bid, sid) => B_MASTERS.some((m) => m.branchId === bid && m.services.includes(sid));
const mastersFor = () => B_MASTERS.filter((m) => m.branchId === state.branchId && m.services.includes(state.serviceId));

function persist() {
  const { done, ...draft } = state;
  Store.saveDraft(draft);
}
function go(step) {
  state.step = step;
  persist();
  render();
  const top = $(".booking-main").getBoundingClientRect().top + window.scrollY - 90;
  if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
}

// свободное время на дату (по мастеру или по всем)
function slotsFor(date) {
  const st = getStyle();
  if (!st) return [];
  const bookings = Store.getBookings();
  const list = state.masterId === "any" ? mastersFor() : [getMaster()].filter(Boolean);
  const set = new Set();
  list.forEach((m) => masterSlots(m, getBranch(), date, st.duration, bookings).forEach((t) => set.add(t)));
  return [...set].sort((a, b) => timeToMin(a) - timeToMin(b));
}

// отрисовка
let branchMap = null;

function render() {
  if (state.done) return renderDone();
  $("#stepper").innerHTML = STEPS.map((name, i) => `
    <li class="${i === state.step ? "current" : ""} ${i < state.step ? "passed" : ""}">
      <button ${i < state.step ? `data-go="${i}"` : "disabled"}><span>${i < state.step ? icon("check", 14) : i + 1}</span>${name}</button>
    </li>`).join("");
  [renderBranch, renderService, renderMaster, renderDateTime, renderConfirm][state.step]();
  renderSummary();
}

function stepHead(title, sub) {
  return `<div class="step-head">
    ${state.step > 0 ? `<button class="btn-back" data-go="${state.step - 1}">${icon("back", 18)} Назад</button>` : ""}
    <h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>`;
}

// шаг 1. Филиал
function renderBranch() {
  const s = getService();
  $("#stepBody").innerHTML = `
    ${stepHead("Выберите филиал", s ? `Вы выбрали «${esc(s.name)}» — покажем, где эта услуга доступна.` : "Нажмите на филиал в списке или на метку на карте.")}
    <div class="branches-layout booking-branches">
      <div class="branch-list">
        ${B_BRANCHES.map((b) => {
          const off = s && !branchOffers(b.id, s.id);
          return `<button class="branch-card ${b.id === state.branchId ? "active" : ""}" data-branch="${b.id}" ${off ? "disabled" : ""}>
            <span class="branch-pin">${icon("pin", 20)}</span>
            <span class="branch-info">
              <b>${esc(b.name)}</b>
              <span>${esc(b.address)} · ${esc(b.district)}</span>
              <span class="branch-meta">${icon("clock", 14)} ${b.open}–${b.close}${off ? " · услуга недоступна" : ""}</span>
            </span>
          </button>`;
        }).join("")}
      </div>
      <div class="map" id="bookMap"></div>
    </div>
    <div class="step-actions">
      <span class="hint">Демо: адреса филиалов вымышлены.</span>
      <button class="btn btn-accent" id="next" ${state.branchId ? "" : "disabled"}>Далее: выбор услуги ${icon("arrow", 18)}</button>
    </div>`;
  branchMap = createBranchMap($("#bookMap"), B_BRANCHES, { selectedId: state.branchId, onSelect: pickBranch });
  $("#next").onclick = () => go(1);
}
function pickBranch(id) {
  const s = getService();
  if (s && !branchOffers(id, s.id)) { toast("В этом филиале нет выбранной услуги"); return; }
  if (state.branchId !== id) Object.assign(state, { masterId: null, date: null, time: null });
  state.branchId = id;
  persist();
  $$(".branch-card").forEach((c) => c.classList.toggle("active", Number(c.dataset.branch) === id));
  $("#next").disabled = false;
  branchMap.select(id);
  renderSummary();
}

// шаг 2. Услуга
function renderService() {
  const s = getService();
  $("#stepBody").innerHTML = `
    ${stepHead("Выберите услугу", "Сначала направление, затем конкретную стрижку или процедуру.")}
    <div class="cat-grid">
      ${B_SERVICES.map((c) => {
        const off = !branchOffers(state.branchId, c.id);
        return `<button class="cat-card ${c.id === state.serviceId ? "active" : ""}" data-cat="${c.id}" ${off ? "disabled" : ""}>
          <span class="service-icon">${icon(c.icon, 20)}</span>
          <span><b>${esc(c.name)} ${c.mark}</b><small>${off ? "нет в этом филиале" : `от ${rub(Math.min(...c.styles.map((x) => x.price)))}`}</small></span>
        </button>`;
      }).join("")}
    </div>
    ${s ? `
      <h3 class="sub-title">${esc(s.name)} — выберите вариант</h3>
      <div class="style-grid">
        ${s.styles.map((st, i) => `
          <button class="style-card ${i === state.styleIdx ? "active" : ""}" data-style="${i}">
            <img src="${st.photo}" alt="${esc(st.name)}" loading="lazy">
            <span class="style-check">${icon("check", 16)}</span>
            <span class="style-info"><b>${esc(st.name)}</b><span>${rub(st.price)} · ${formatDuration(st.duration)}</span></span>
          </button>`).join("")}
      </div>` : ""}
    <div class="step-actions">
      <span></span>
      <button class="btn btn-accent" id="next" ${getStyle() ? "" : "disabled"}>Далее: выбор мастера ${icon("arrow", 18)}</button>
    </div>`;
  $("#next").onclick = () => go(2);
}

// шаг 3. Мастер
function renderMaster() {
  const list = mastersFor();
  $("#stepBody").innerHTML = `
    ${stepHead("Выберите мастера", `${esc(getBranch().name)} · ${esc(getStyle().name)}`)}
    <div class="master-pick">
      <button class="master-option any ${state.masterId === "any" ? "active" : ""}" data-master="any">
        <span class="avatar any-avatar">${icon("dice", 26)}</span>
        <span><b>Любой мастер</b><small>Покажем все свободные окна — больше вариантов времени</small></span>
      </button>
      ${list.map((m) => `
        <button class="master-option ${m.id === state.masterId ? "active" : ""}" data-master="${m.id}">
          ${avatar(m, 52)}
          <span><b>${esc(m.name)}</b><small>${esc(m.role)} · ${icon("star", 12)} ${m.rating.toFixed(1)}</small>
          <small class="workdays">Работает: ${[1, 2, 3, 4, 5, 6, 0].filter((d) => m.workDays.includes(d)).map((d) => WEEKDAYS[d]).join(", ")}</small></span>
        </button>`).join("")}
    </div>
    <div class="step-actions">
      <span class="hint">Демо: мастера вымышлены.</span>
      <button class="btn btn-accent" id="next" ${state.masterId ? "" : "disabled"}>Далее: дата и время ${icon("arrow", 18)}</button>
    </div>`;
  $("#next").onclick = () => go(3);
}

// шаг 4. Дата и время
function renderDateTime() {
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(i));
  const counts = Object.fromEntries(days.map((d) => [d, slotsFor(d).length]));
  if (!state.date || !counts[state.date]) state.date = days.find((d) => counts[d]) || days[0];
  const slots = slotsFor(state.date);
  if (state.time && !slots.includes(state.time)) state.time = null;
  const groups = [["Утро", 0, 12 * 60], ["День", 12 * 60, 17 * 60], ["Вечер", 17 * 60, 24 * 60]]
    .map(([label, a, b]) => [label, slots.filter((t) => timeToMin(t) >= a && timeToMin(t) < b)])
    .filter(([, l]) => l.length);
  const first = parseKey(days[0]);
  const m = getMaster();

  $("#stepBody").innerHTML = `
    ${stepHead("Выберите дату и время", m ? `Мастер: ${esc(m.name)}` : "Любой свободный мастер")}
    <div class="date-head">${MONTHS_NOM[first.getMonth()]} ${first.getFullYear()}</div>
    <div class="date-strip">
      ${days.map((d) => {
        const dt = parseKey(d), n = counts[d];
        return `<button class="date-cell ${d === state.date ? "active" : ""} ${dt.getDay() % 6 === 0 ? "weekend" : ""}" data-date="${d}" ${n ? "" : "disabled"}>
          <small>${d === todayKey() ? "сегодня" : WEEKDAYS[dt.getDay()]}</small><b>${dt.getDate()}</b><small>${n ? MONTHS_SHORT[dt.getMonth()] : "нет мест"}</small>
        </button>`;
      }).join("")}
    </div>
    <div class="time-wrap">
      <p class="time-title">${icon("calendar", 18)} ${formatDate(state.date)}</p>
      ${groups.length ? groups.map(([label, l]) => `
        <div class="time-group"><span>${label}</span>
          <div class="time-grid">${l.map((t) => `<button class="time-cell ${t === state.time ? "active" : ""}" data-time="${t}">${t}</button>`).join("")}</div>
        </div>`).join("") : `<p class="empty">На этот день свободного времени нет — выберите другую дату.</p>`}
    </div>
    <div class="step-actions">
      <span class="hint">Длительность: ${formatDuration(getStyle().duration)}</span>
      <button class="btn btn-accent" id="next" ${state.time ? "" : "disabled"}>Далее: подтверждение ${icon("arrow", 18)}</button>
    </div>`;
  persist();
  $("#next").onclick = () => go(4);
  const active = $(".date-cell.active");
  if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
}

// шаг 5. Вход и подтверждение
function renderConfirm() {
  const user = Store.currentUser();
  const st = getStyle(), b = getBranch(), m = getMaster();
  $("#stepBody").innerHTML = `
    ${stepHead(user ? "Проверьте и подтвердите запись" : "Войдите, чтобы подтвердить запись", user ? "" : "Так вы сможете посмотреть или отменить запись в личном кабинете.")}
    <div class="confirm-card">
      <img src="${st.photo}" alt="">
      <div>
        <b>${esc(st.name)}</b>
        <span>${esc(getService().name)}</span>
        <span>${icon("calendar", 16)} ${formatDate(state.date)}, ${state.time}</span>
        <span>${icon("pin", 16)} ${esc(b.name)}, ${esc(b.address)}</span>
        <span>${icon("user", 16)} ${m ? esc(m.name) : "Любой свободный мастер"}</span>
        <span class="confirm-price">${rub(st.price)} · ${formatDuration(st.duration)}</span>
      </div>
    </div>
    <label class="field"><span>Комментарий для мастера (необязательно)</span>
      <textarea id="comment" rows="2" maxlength="300" placeholder="Например: хочу как на фото, но короче">${esc(state.comment)}</textarea></label>
    ${user ? `
      <div class="logged-as">${icon("user", 18)} Вы вошли как <b>${esc(user.name)}</b>, ${formatPhone(user.phone)}
        <button class="link-btn" id="switchUser">Сменить аккаунт</button></div>
      <div class="step-actions">
        <span class="hint">Демо: уведомления не отправляются.</span>
        <button class="btn btn-accent btn-lg" id="confirm">${icon("check", 18)} Подтвердить запись</button>
      </div>` : authForm()}`;

  $("#comment").oninput = (e) => { state.comment = e.target.value; persist(); };
  if (user) {
    $("#confirm").onclick = confirmBooking;
    $("#switchUser").onclick = () => { Store.logout(); state.authTab = "login"; render(); };
  } else {
    bindAuth();
  }
}

function authForm() {
  const login = state.authTab === "login";
  return `
    <div class="auth-box">
      <div class="auth-tabs">
        <button class="${login ? "active" : ""}" data-tab="login">Вход</button>
        <button class="${login ? "" : "active"}" data-tab="register">Регистрация</button>
      </div>
      <form id="authForm" novalidate>
        ${login ? "" : `<label class="field"><span>Имя</span><input id="aName" autocomplete="name" placeholder="Как к вам обращаться"></label>`}
        <label class="field"><span>Телефон</span><input id="aPhone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__"></label>
        <label class="field"><span>Пароль</span><input id="aPass" type="password" autocomplete="${login ? "current-password" : "new-password"}" placeholder="${login ? "Ваш пароль" : "Не короче 4 символов"}"></label>
        <p class="form-error" id="aError"></p>
        <button class="btn btn-accent btn-lg btn-block" type="submit">${login ? "Войти и подтвердить запись" : "Зарегистрироваться и подтвердить"}</button>
        ${login ? `<p class="demo-hint">${icon("info", 16)} Демо-аккаунт: <b>+7 (000) 000-00-01</b>, пароль <b>demo</b>
          <button type="button" class="link-btn" id="fillDemo">подставить</button></p>` : `<p class="demo-hint">${icon("info", 16)} Демо: данные хранятся только в этом браузере. Не используйте настоящий пароль.</p>`}
      </form>
    </div>`;
}

function bindAuth() {
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => { state.authTab = b.dataset.tab; persist(); render(); }));
  bindPhoneMask($("#aPhone"));
  const demo = $("#fillDemo");
  if (demo) demo.onclick = () => { $("#aPhone").value = "+7 (000) 000-00-01"; $("#aPass").value = "demo"; };
  $("#authForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = state.authTab === "login"
      ? Store.login($("#aPhone").value, $("#aPass").value)
      : Store.register($("#aName").value, $("#aPhone").value, $("#aPass").value);
    if (res.error) { $("#aError").textContent = res.error; return; }
    toast(state.authTab === "login" ? `С возвращением, ${res.user.name.split(" ")[0]}!` : "Аккаунт создан");
    confirmBooking();
  });
}

function confirmBooking() {
  const user = Store.currentUser();
  const st = getStyle();
  const bookings = Store.getBookings();
  // проверяем еще раз, вдруг время уже заняли
  const candidates = state.masterId === "any" ? mastersFor() : [getMaster()].filter(Boolean);
  const free = candidates
    .filter((m) => masterSlots(m, getBranch(), state.date, st.duration, bookings).includes(state.time))
    .sort((a, b) => bookings.filter((x) => x.masterId === a.id && x.date === state.date).length
      - bookings.filter((x) => x.masterId === b.id && x.date === state.date).length);
  if (!free.length) {
    toast("Это время только что заняли — выберите другое");
    state.time = null;
    go(3);
    return;
  }
  const booking = {
    id: Date.now(), userId: user.id, name: user.name, phone: user.phone,
    branchId: state.branchId, serviceId: state.serviceId, styleIdx: state.styleIdx,
    masterId: free[0].id, anyMaster: state.masterId === "any",
    date: state.date, time: state.time, duration: st.duration, price: st.price,
    status: "confirmed", comment: state.comment.trim(), createdAt: Date.now(),
  };
  Store.addBooking(booking);
  Store.clearDraft();
  state.done = booking;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDone() {
  const b = state.done;
  const br = B_BRANCHES.find((x) => x.id === b.branchId);
  const m = getMaster(b.masterId);
  const st = B_SERVICES.find((s) => s.id === b.serviceId).styles[b.styleIdx];
  $("#stepper").innerHTML = "";
  $("#summary").innerHTML = "";
  $("#summary").hidden = true;
  $("#stepBody").innerHTML = `
    <div class="done">
      <span class="done-icon">${icon("check", 40)}</span>
      <h2>Запись подтверждена!</h2>
      <p>Ждём вас <b>${formatDate(b.date)} в ${b.time}</b></p>
      <div class="confirm-card">
        <img src="${st.photo}" alt="">
        <div>
          <b>${esc(st.name)}</b>
          <span>${icon("pin", 16)} ${esc(br.name)}, ${esc(br.address)}</span>
          <span>${icon("user", 16)} ${esc(m.name)}${b.anyMaster ? " (назначен автоматически)" : ""}</span>
          <span class="confirm-price">${rub(b.price)} · ${formatDuration(b.duration)}</span>
        </div>
      </div>
      <p class="hint">Это демо-версия: запись сохранена только в вашем браузере, SMS и звонки не отправляются.
        Её видно в личном кабинете и в админ-панели.</p>
      <div class="done-actions">
        <a class="btn btn-accent" href="account.html">Мои записи</a>
        <a class="btn btn-outline" href="index.html">На главную</a>
      </div>
      <div class="map done-map" id="doneMap"></div>
    </div>`;
  createBranchMap($("#doneMap"), [br], { selectedId: br.id });
}

// сводка справа
function renderSummary() {
  const b = getBranch(), s = getService(), st = getStyle(), m = getMaster();
  const row = (ic, label, value, step) => `
    <div class="sum-row ${value ? "" : "empty"}">
      <span class="sum-ic">${icon(ic, 18)}</span>
      <div><small>${label}</small><b>${value || "не выбрано"}</b></div>
      ${value && step < state.step ? `<button class="link-btn" data-go="${step}">изменить</button>` : ""}
    </div>`;
  $("#summary").hidden = false;
  $("#summary").innerHTML = `
    <h3>Ваша запись</h3>
    ${row("pin", "Филиал", b && `${esc(b.name)}<span>${esc(b.address)}</span>`, 0)}
    ${row("scissors", "Услуга", st && `${esc(st.name)}<span>${esc(s.name)}</span>`, 1)}
    ${row("user", "Мастер", state.masterId === "any" ? "Любой мастер" : m && esc(m.name), 2)}
    ${row("calendar", "Дата и время", state.time && `${formatDateShort(state.date)}, ${state.time}`, 3)}
    ${st ? `<div class="sum-total"><span>Итого</span><b>${rub(st.price)}</b></div>` : ""}
    <p class="hint">Оплата в салоне после услуги. Демо-версия.</p>`;
}

// события
document.addEventListener("click", (e) => {
  const goBtn = e.target.closest("[data-go]");
  if (goBtn && !state.done) { go(Number(goBtn.dataset.go)); return; }

  const branchBtn = e.target.closest("[data-branch]");
  if (branchBtn && state.step === 0) { pickBranch(Number(branchBtn.dataset.branch)); return; }

  const cat = e.target.closest("[data-cat]");
  if (cat && state.step === 1) {
    if (state.serviceId !== cat.dataset.cat) Object.assign(state, { styleIdx: null, masterId: null, date: null, time: null });
    state.serviceId = cat.dataset.cat;
    persist(); render();
    $(".sub-title").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const style = e.target.closest("[data-style]");
  if (style) {
    const i = Number(style.dataset.style);
    if (state.styleIdx !== i) Object.assign(state, { date: null, time: null });
    state.styleIdx = i;
    persist(); render();
    return;
  }
  const master = e.target.closest("[data-master]");
  if (master) {
    const v = master.dataset.master === "any" ? "any" : Number(master.dataset.master);
    if (state.masterId !== v) Object.assign(state, { time: null });
    state.masterId = v;
    persist(); render();
    return;
  }
  const date = e.target.closest("[data-date]");
  if (date) { state.date = date.dataset.date; state.time = null; render(); return; }
  const time = e.target.closest("[data-time]");
  if (time) { state.time = time.dataset.time; persist(); render(); }
});

// проверка что черновик еще актуален
if (state.branchId && !getBranch()) Object.assign(state, { branchId: null, step: 0 });
if (state.step >= 2 && !getStyle()) state.step = 1;
if (state.step >= 3 && !state.masterId) state.step = 2;
if (state.step >= 4 && !state.time) state.step = 3;
if (!state.branchId) state.step = 0;
render();
