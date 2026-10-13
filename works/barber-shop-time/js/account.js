// личный кабинет

const A_SERVICES = Store.getServices();
const A_BRANCHES = Store.getBranches();
const A_MASTERS = Store.getMasters();
const A_REVIEWED = new Set(Store.getReviews().map((r) => r.bookingId).filter(Boolean));
// куда вернуть после входа (?next=...)
const NEXT = (() => { const n = new URLSearchParams(location.search).get("next") || ""; return /^[a-z]+\.html(\?[\w=&%-]*)?$/.test(n) ? n : ""; })();
let authTab = "login";

function bookingCard(b, upcoming) {
  const s = A_SERVICES.find((x) => x.id === b.serviceId);
  const st = s && s.styles[b.styleIdx];
  const br = A_BRANCHES.find((x) => x.id === b.branchId);
  const m = A_MASTERS.find((x) => x.id === b.masterId);
  return `
    <div class="booking-card status-${b.status}">
      ${st ? `<img src="${st.photo}" alt="">` : ""}
      <div class="booking-card-body">
        <span class="badge badge-${b.status}">${CLIENT_STATUSES[b.status]}</span>
        <b>${esc(st ? st.name : "Услуга")}</b>
        <span>${icon("calendar", 15)} ${formatDate(b.date)}, ${b.time}</span>
        <span>${icon("pin", 15)} ${esc(br ? `${br.name}, ${br.address}` : "—")}</span>
        <span>${icon("user", 15)} ${esc(m ? m.name : "—")}</span>
        <span class="confirm-price">${rub(b.price)}</span>
        ${b.comment ? `<span class="hint">«${esc(b.comment)}»</span>` : ""}
      </div>
      ${upcoming && b.status !== "cancelled" ? `<button class="btn btn-outline btn-sm" data-cancel="${b.id}">Отменить</button>` : ""}
      ${!upcoming && st ? `<div class="booking-card-actions">${b.status === "done" && !A_REVIEWED.has(b.id) ? `<a class="btn btn-accent btn-sm" href="reviews.html?booking=${b.id}">Оставить отзыв</a>` : ""}<a class="btn btn-outline btn-sm" href="booking.html?service=${b.serviceId}&style=${b.styleIdx}">Повторить</a></div>` : ""}
    </div>`;
}

function render() {
  const user = Store.currentUser();
  if (!user) return renderAuth();
  if (NEXT) { location.replace(NEXT); return; }
  $("#accountSub").textContent = "Ваши записи и история посещений.";
  const now = `${todayKey()} ${new Date().toTimeString().slice(0, 5)}`;
  const mine = Store.getBookings().filter((b) => b.userId === user.id)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const upcoming = mine.filter((b) => `${b.date} ${b.time}` >= now && b.status !== "done" && b.status !== "cancelled");
  const past = mine.filter((b) => !upcoming.includes(b)).reverse();

  $("#account").innerHTML = `
    <div class="account-layout">
      <aside class="profile-card">
        <span class="avatar" style="--c:#c2410c;width:72px;height:72px;font-size:26px">${esc(initials(user.name))}</span>
        <b>${esc(user.name)}</b>
        <span>${formatPhone(user.phone)}</span>
        <span class="hint">Клиент с ${new Date(user.createdAt).toLocaleDateString("ru-RU")}</span>
        <a href="booking.html" class="btn btn-accent btn-block">Новая запись</a>
        <button class="btn btn-outline btn-block" id="logout">${icon("logout", 18)} Выйти</button>
      </aside>
      <div>
        <h2 class="sub-title">Предстоящие записи</h2>
        ${upcoming.length ? `<div class="booking-list">${upcoming.map((b) => bookingCard(b, true)).join("")}</div>`
          : `<div class="empty-box">У вас нет предстоящих записей. <a href="booking.html">Записаться</a></div>`}
        <h2 class="sub-title">История</h2>
        ${past.length ? `<div class="booking-list">${past.map((b) => bookingCard(b, false)).join("")}</div>`
          : `<div class="empty-box">Здесь появятся прошлые визиты.</div>`}
      </div>
    </div>`;
  $("#logout").onclick = () => { Store.logout(); location.reload(); };
}

function renderAuth() {
  const login = authTab === "login";
  $("#accountSub").textContent = "Войдите или зарегистрируйтесь, чтобы видеть свои записи.";
  $("#account").innerHTML = `
    <div class="auth-box auth-page">
      <div class="auth-tabs">
        <button class="${login ? "active" : ""}" data-tab="login">Вход</button>
        <button class="${login ? "" : "active"}" data-tab="register">Регистрация</button>
      </div>
      <form id="authForm" novalidate>
        ${login ? "" : `<label class="field"><span>Имя</span><input id="aName" autocomplete="name" placeholder="Как к вам обращаться"></label>`}
        <label class="field"><span>Телефон</span><input id="aPhone" type="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__"></label>
        <label class="field"><span>Пароль</span><input id="aPass" type="password" autocomplete="${login ? "current-password" : "new-password"}"></label>
        <p class="form-error" id="aError"></p>
        <button class="btn btn-accent btn-lg btn-block" type="submit">${login ? "Войти" : "Создать аккаунт"}</button>
        <p class="demo-hint">${icon("info", 16)} ${login ? `Демо-аккаунт: <b>+7 (000) 000-00-01</b>, пароль <b>demo</b>
          <button type="button" class="link-btn" id="fillDemo">подставить</button>` : "Демо: данные хранятся только в этом браузере. Не используйте настоящий пароль."}</p>
      </form>
    </div>`;
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => { authTab = b.dataset.tab; render(); }));
  bindPhoneMask($("#aPhone"));
  const demo = $("#fillDemo");
  if (demo) demo.onclick = () => { $("#aPhone").value = "+7 (000) 000-00-01"; $("#aPass").value = "demo"; };
  $("#authForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = login
      ? Store.login($("#aPhone").value, $("#aPass").value)
      : Store.register($("#aName").value, $("#aPhone").value, $("#aPass").value);
    if (res.error) { $("#aError").textContent = res.error; return; }
    if (NEXT) location.href = NEXT; else location.reload();
  });
}

$("#account").addEventListener("click", (e) => {
  const c = e.target.closest("[data-cancel]");
  if (!c) return;
  if (!confirm("Отменить запись?")) return;
  const list = Store.getBookings();
  const b = list.find((x) => x.id === Number(c.dataset.cancel));
  if (b) { b.status = "cancelled"; Store.saveBookings(list); toast("Запись отменена"); render(); }
});

render();
