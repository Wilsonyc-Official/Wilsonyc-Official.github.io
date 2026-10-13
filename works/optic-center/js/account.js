// личный кабинет
// смс не отправляются, код всегда 1234

const DEMO_CODE = "1234";
const root = $("#accountRoot");
let tab = "upcoming";
let pendingPhone = "";

const specs = Store.getSpecialists();
const frames = Store.getFrames();
const getSpec = (id) => specs.find((s) => s.id === id);

function myBookings() {
  const client = Store.getClient();
  if (!client) return [];
  const phone = digits(client.phone);
  return Store.getBookings().filter((b) => digits(b.phone) === phone);
}
function isUpcoming(b) {
  return b.status !== "cancelled" && b.status !== "done" && !Schedule.isPast(b.date, b.time);
}
function setHeaderName(name) {
  const label = $(".header-account span");
  if (label) label.textContent = name ? name.split(" ")[0] : "Кабинет";
}

// вход
function renderLogin(step = "phone") {
  root.innerHTML = `
    <div class="auth-card">
      <div class="auth-ic">${icon("user", 30)}</div>
      <h2>Вход в личный кабинет</h2>
      ${step === "phone" ? `
        <p class="hint">Введите номер телефона, который указывали при записи. В демо-проекте SMS не отправляется — код показан ниже.</p>
        <form id="phoneForm" novalidate>
          <div class="field"><input id="loginPhone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel" value="${esc(pendingPhone)}"></div>
          <div class="error" id="loginError"></div>
          <button class="btn btn-block btn-pill btn-lg">Получить код</button>
        </form>
        <div class="demo-note" style="margin: 18px 0 0">Демо: номер <b>${DEMO_CLIENT_PHONE}</b> — у него уже есть записи</div>`
      : `
        <p class="hint">Введите демо-код для номера <b>${esc(pendingPhone)}</b></p>
        <form id="codeForm" novalidate>
          <div class="field"><input id="loginCode" inputmode="numeric" maxlength="4" placeholder="Код из SMS" class="code-input" autocomplete="one-time-code"></div>
          <div class="error" id="loginError"></div>
          <button class="btn btn-block btn-pill btn-lg">Войти</button>
        </form>
        <button class="link-btn" id="changePhone" style="margin-top: 14px">Изменить номер</button>
        <div class="demo-note" style="margin: 18px 0 0">Демо-код: <b>${DEMO_CODE}</b></div>`}
    </div>`;

  if (step === "phone") {
    const input = $("#loginPhone");
    input.addEventListener("input", () => (input.value = formatPhone(input.value)));
    input.focus();
    $("#phoneForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (digits(input.value).length !== 11) {
        $("#loginError").textContent = "Введите номер полностью";
        return;
      }
      pendingPhone = formatPhone(input.value);
      toast(`Демо: SMS не отправляется. Код для входа: ${DEMO_CODE}`);
      renderLogin("code");
    });
  } else {
    $("#loginCode").focus();
    $("#changePhone").onclick = () => renderLogin("phone");
    $("#codeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("#loginCode").value.trim() !== DEMO_CODE) {
        $("#loginError").textContent = "Неверный код";
        return;
      }
      // имя берём из последней записи с этим номером
      const last = Store.getBookings().filter((b) => digits(b.phone) === digits(pendingPhone))
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      Store.setClient({ phone: pendingPhone, name: last ? last.name : "" });
      setHeaderName(last ? last.name : "");
      renderAccount();
    });
  }
}

// кабинет
function bookingCard(b) {
  const spec = getSpec(b.specialistId);
  const d = parseKey(b.date);
  const frame = frames.find((f) => f.id === b.frameId);
  const upcoming = isUpcoming(b);
  const statusCls = { new: "badge-new", confirmed: "badge-confirmed", done: "badge-done", cancelled: "badge-cancelled" }[b.status];
  return `
    <article class="visit ${upcoming ? "" : "past"}">
      <div class="visit-date">
        <b>${d.getDate()}</b><span>${MONTHS_SHORT[d.getMonth()]}</span><small>${WEEKDAYS[d.getDay()]}</small>
      </div>
      <div class="visit-main">
        <div class="visit-top">
          <div>
            <div class="visit-time">${b.time} · ${SERVICES[b.service] ? SERVICES[b.service].name : b.service}</div>
            <div class="hint">${CONTACTS.address}</div>
          </div>
          <span class="badge ${statusCls}">${CLIENT_STATUSES[b.status]}</span>
        </div>
        ${spec ? `<div class="visit-spec">${avatarHTML(spec, 36)}<div><b>${esc(spec.name)}</b><span class="hint">${esc(spec.role)}</span></div></div>` : ""}
        ${frame ? `<div class="visit-frame">${frameSVG(frame)}<span>Оправа: <b>${esc(frame.brand)} ${esc(frame.name)}</b> · ${money(frame.price)}</span></div>` : ""}
        <div class="visit-actions">
          ${upcoming ? `
            <a class="btn btn-sm btn-pill btn-outline" href="booking.html?reschedule=${b.id}">Перенести</a>
            <button class="btn btn-sm btn-pill btn-ghost" data-cancel="${b.id}">Отменить запись</button>`
          : `<a class="btn btn-sm btn-pill btn-outline" href="booking.html?service=${b.service}${spec ? `&specialist=${spec.id}` : ""}">Записаться снова</a>`}
        </div>
      </div>
    </article>`;
}

function renderAccount() {
  const client = Store.getClient();
  if (!client) return renderLogin();
  const all = myBookings();
  const upcoming = all.filter(isUpcoming).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const history = all.filter((b) => !isUpcoming(b)).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const visits = all.filter((b) => b.status === "done").length;

  let content = "";
  if (tab === "upcoming") {
    content = upcoming.length ? upcoming.map(bookingCard).join("") : `
      <div class="empty-state">
        <div class="auth-ic">${icon("calendar", 28)}</div>
        <h3>Нет предстоящих записей</h3>
        <p class="hint">Запишитесь на проверку зрения или подбор очков — это займёт минуту.</p>
        <a href="booking.html" class="btn btn-pill">Записаться</a>
      </div>`;
  } else if (tab === "history") {
    content = history.length ? history.map(bookingCard).join("") : `<div class="empty-state"><p class="hint">История визитов пока пуста</p></div>`;
  } else {
    content = `
      <form class="profile-form" id="profileForm">
        <div class="field"><label for="pName">Имя</label><input id="pName" value="${esc(client.name || "")}" placeholder="Как к вам обращаться"></div>
        <div class="field"><label>Телефон</label><input value="${esc(client.phone)}" disabled></div>
        <label class="check" style="margin-bottom: 10px"><input type="checkbox" disabled> SMS-напоминания о визитах <span class="hint">(не отправляются в демо)</span></label>
        <label class="check" style="margin-bottom: 18px"><input type="checkbox" disabled> Сообщать об акциях и новых коллекциях <span class="hint">(не отправляются в демо)</span></label>
        <button class="btn btn-pill">Сохранить</button>
      </form>`;
  }

  root.innerHTML = `
    <div class="account-layout">
      <aside class="account-side">
        <div class="profile-card">
          <span class="avatar" style="width:72px;height:72px;font-size:26px;--av:#c8161d">${esc(initials(client.name) || "?")}</span>
          <h3>${esc(client.name || "Клиент")}</h3>
          <div class="hint">${esc(client.phone)}</div>
          <div class="profile-stats">
            <div><b>${upcoming.length}</b><span>${plural(upcoming.length, ["запись", "записи", "записей"])}</span></div>
            <div><b>${visits}</b><span>${plural(visits, ["визит", "визита", "визитов"])}</span></div>
          </div>
          <a href="booking.html" class="btn btn-block btn-pill">Новая запись</a>
          <button class="link-btn logout" id="logout">${icon("logout", 16)} Выйти</button>
        </div>
      </aside>
      <div class="account-main">
        <div class="tabs">
          <button class="tab ${tab === "upcoming" ? "active" : ""}" data-tab="upcoming">Предстоящие <span>${upcoming.length}</span></button>
          <button class="tab ${tab === "history" ? "active" : ""}" data-tab="history">История <span>${history.length}</span></button>
          <button class="tab ${tab === "profile" ? "active" : ""}" data-tab="profile">Профиль</button>
        </div>
        <div class="visits">${content}</div>
      </div>
    </div>`;

  const form = $("#profileForm");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#pName").value.trim();
    Store.setClient({ ...client, name });
    setHeaderName(name);
    toast("Данные сохранены");
    renderAccount();
  });
}

root.addEventListener("click", (e) => {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    return renderAccount();
  }
  const cancel = e.target.closest("[data-cancel]");
  if (cancel && confirm("Отменить запись?")) {
    const list = Store.getBookings();
    const b = list.find((x) => x.id === +cancel.dataset.cancel);
    if (b) b.status = "cancelled";
    Store.saveBookings(list);
    toast("Запись отменена");
    return renderAccount();
  }
  if (e.target.closest("#logout")) {
    Store.logoutClient();
    setHeaderName("");
    pendingPhone = "";
    renderLogin();
  }
});

// статус записи мог измениться в админке
window.addEventListener("storage", () => { if (Store.getClient()) renderAccount(); });

renderAccount();
