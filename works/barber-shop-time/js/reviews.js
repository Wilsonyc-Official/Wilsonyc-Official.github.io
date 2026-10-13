// страница отзывов

const R_BRANCHES = Store.getBranches();
const R_SERVICES = Store.getServices();
const R_MASTERS = Store.getMasters();
const ctx = { branches: R_BRANCHES, services: R_SERVICES, masters: R_MASTERS };

const filters = { branch: "", source: "", sort: "new" };
const form = { branchId: R_BRANCHES[0].id, masterId: "", rating: 0, text: "", bookingId: null, serviceId: null };
let sent = null;

// отзыв о визите: reviews.html?booking=ID
const params = new URLSearchParams(location.search);
const bookingParam = Number(params.get("booking"));
if (bookingParam) {
  const b = Store.getBookings().find((x) => x.id === bookingParam);
  const u = Store.currentUser();
  if (b && u && b.userId === u.id) Object.assign(form, { branchId: b.branchId, masterId: b.masterId, bookingId: b.id, serviceId: b.serviceId });
}
const branchFromUrl = Number(params.get("branch"));
if (branchFromUrl && R_BRANCHES.some((b) => b.id === branchFromUrl)) filters.branch = String(branchFromUrl);

// опубликованные отзывы + собственные отзывы клиента на модерации
function visibleReviews() {
  const u = Store.currentUser();
  return Store.getReviews().filter((r) => r.status === "published" || (u && r.userId === u.id && r.status === "pending"));
}

function renderSummary() {
  const list = visibleReviews().filter((r) => r.status === "published" && (!filters.branch || r.branchId === Number(filters.branch)));
  const s = reviewStats(list);
  const bySource = Object.keys(REVIEW_SOURCES).map((k) => [k, list.filter((r) => r.source === k).length]);
  $("#ratingSummary").innerHTML = `
    <div class="rating-big">
      <b>${s.count ? s.avg.toFixed(1) : "—"}</b>
      <span class="stars">${stars(Math.round(s.avg))}</span>
      <small>${s.count} ${reviewsWord(s.count)}${filters.branch ? ` · ${esc(R_BRANCHES.find((b) => b.id === Number(filters.branch)).name)}` : " · все филиалы"}</small>
    </div>
    <div class="rating-dist">
      ${[5, 4, 3, 2, 1].map((n) => `
        <div class="bar-row"><span>${n} ★</span><div class="bar alt"><i style="width:${s.count ? (s.dist[n - 1] / s.count) * 100 : 0}%"></i></div><b>${s.dist[n - 1]}</b></div>`).join("")}
    </div>
    <div class="rating-sources">
      ${bySource.map(([k, n]) => `<span class="source-badge src-${k}">${REVIEW_SOURCES[k]}: ${n}</span>`).join("")}
    </div>`;
}

function renderList() {
  let list = visibleReviews().filter((r) =>
    (!filters.branch || r.branchId === Number(filters.branch)) && (!filters.source || r.source === filters.source));
  list.sort((a, b) => filters.sort === "high" ? b.rating - a.rating || b.date.localeCompare(a.date)
    : filters.sort === "low" ? a.rating - b.rating || b.date.localeCompare(a.date)
    : b.date.localeCompare(a.date));
  $("#reviewsList").innerHTML = list.length
    ? list.map((r) => (r.status === "pending" ? reviewCard(r, ctx).replace('<figure class="review">', '<figure class="review pending"><span class="badge badge-new">Ваш отзыв · на модерации</span>') : reviewCard(r, ctx))).join("")
    : `<div class="empty-box">Отзывов по выбранным условиям пока нет.</div>`;
}

function renderFilters() {
  $("#fBranch").innerHTML = `<option value="">Все филиалы</option>` +
    R_BRANCHES.map((b) => `<option value="${b.id}" ${String(b.id) === filters.branch ? "selected" : ""}>${esc(b.name)}</option>`).join("");
  $("#fSource").innerHTML = [["", "Все"], ...Object.entries(REVIEW_SOURCES)].map(([k, v]) =>
    `<button class="tab ${k === filters.source ? "active" : ""}" data-source="${k}">${v}</button>`).join("");
}

// форма отзыва
function renderForm() {
  const user = Store.currentUser();
  if (sent) {
    const l = branchLinks(R_BRANCHES.find((b) => b.id === sent.branchId));
    $("#reviewForm").innerHTML = `
      <div class="done-small">
        <span class="done-icon small">${icon("check", 26)}</span>
        <h3>Спасибо за отзыв!</h3>
        <p class="hint">Он появится на сайте после проверки администратором. В демо-версии отзыв можно опубликовать в админ-панели.</p>
        ${externalButtons(l, "Продублируйте отзыв на картах — это очень помогает салону:")}
        <button class="btn btn-outline btn-block" id="another">Написать ещё один</button>
      </div>`;
    $("#another").onclick = () => { sent = null; Object.assign(form, { rating: 0, text: "", bookingId: null, serviceId: null }); renderForm(); };
    return;
  }
  if (!user) {
    const next = encodeURIComponent(`reviews.html${location.search}`);
    $("#reviewForm").innerHTML = `
      <h3>Оставить отзыв</h3>
      <p class="hint">Отзывы оставляют клиенты с аккаунтом — так мы защищаемся от накруток.</p>
      <a class="btn btn-accent btn-block" href="account.html?next=${next}">Войти и написать отзыв</a>`;
    return;
  }
  const booking = form.bookingId && Store.getBookings().find((b) => b.id === form.bookingId);
  const bookingStyle = booking && R_SERVICES.find((s) => s.id === booking.serviceId)?.styles[booking.styleIdx];
  const masters = R_MASTERS.filter((m) => m.branchId === Number(form.branchId));
  $("#reviewForm").innerHTML = `
    <h3>Оставить отзыв</h3>
    ${booking ? `<p class="visit-note">${icon("calendar", 16)} Отзыв о визите ${formatDateShort(booking.date)}${bookingStyle ? ` · ${esc(bookingStyle.name)}` : ""}</p>` : ""}
    <form id="rForm" novalidate>
      <div class="field"><span>Оценка</span>
        <div class="star-input" id="starInput" role="radiogroup" aria-label="Оценка">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${form.rating === n}" aria-label="${n} из 5" data-star="${n}" class="${n <= form.rating ? "on" : ""}">★</button>`).join("")}
        </div>
      </div>
      <label class="field"><span>Филиал</span>
        <select id="rBranch" ${booking ? "disabled" : ""}>${R_BRANCHES.map((b) => `<option value="${b.id}" ${b.id === Number(form.branchId) ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Мастер (необязательно)</span>
        <select id="rMaster" ${booking ? "disabled" : ""}><option value="">Не указывать</option>${masters.map((m) => `<option value="${m.id}" ${m.id === Number(form.masterId) ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Ваш отзыв</span>
        <textarea id="rText" rows="5" maxlength="1500" placeholder="Что понравилось, что можно улучшить?">${esc(form.text)}</textarea></label>
      <p class="form-error" id="rError"></p>
      <button class="btn btn-accent btn-block" type="submit">Отправить отзыв</button>
      <p class="hint small-gap">Публикуется от имени «${esc(shortAuthor(user.name))}». Демо: отзыв сохраняется только в этом браузере.</p>
    </form>`;

  $("#starInput").addEventListener("click", (e) => {
    const s = e.target.closest("[data-star]");
    if (!s) return;
    form.rating = Number(s.dataset.star);
    $$("#starInput [data-star]").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.star) <= form.rating);
      b.setAttribute("aria-checked", String(Number(b.dataset.star) === form.rating));
    });
  });
  $("#rBranch").onchange = (e) => { form.branchId = Number(e.target.value); form.masterId = ""; renderForm(); renderExternal(); };
  $("#rMaster").onchange = (e) => { form.masterId = e.target.value; };
  $("#rText").oninput = (e) => { form.text = e.target.value; };
  $("#rForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.rating) return ($("#rError").textContent = "Поставьте оценку от 1 до 5");
    if (form.text.trim().length < 10) return ($("#rError").textContent = "Напишите хотя бы пару слов (от 10 символов)");
    const all = Store.getReviews();
    if (form.bookingId && all.some((r) => r.bookingId === form.bookingId)) return ($("#rError").textContent = "Вы уже оставили отзыв об этом визите");
    const review = {
      id: Date.now(), source: "site", externalId: "", userId: user.id, bookingId: form.bookingId,
      branchId: Number(form.branchId), masterId: form.masterId ? Number(form.masterId) : null, serviceId: form.serviceId,
      author: shortAuthor(user.name), rating: form.rating, text: form.text.trim(),
      date: new Date().toISOString(), reply: "", replyDate: null, status: "pending",
    };
    all.push(review);
    Store.saveReviews(all);
    sent = review;
    renderForm(); renderList();
    toast("Отзыв отправлен на модерацию");
  });
}

// Анна Смирнова -> Анна С.
function shortAuthor(name) {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

// отзывы во внешних сервисах
function externalButtons(l, title) {
  const btn = (url, cls, label) => url
    ? `<a class="btn ext-btn ${cls}" href="${url}" target="_blank" rel="noopener">${label}</a>`
    : `<span class="btn ext-btn ${cls} disabled" title="Ссылка задаётся в админ-панели → Филиалы">${label}</span>`;
  return `
    <p class="hint">${title}</p>
    <div class="ext-buttons">
      ${btn(l.yandexReviews, "ext-yandex", "Отзыв на Яндекс Картах")}
      ${btn(l.dgisReviews, "ext-2gis", "Отзыв в 2ГИС")}
    </div>
    ${l.yandexReviews || l.dgisReviews ? "" : `<p class="hint demo-note">Демо: ID карточек Яндекса и 2ГИС не заданы, поэтому кнопки неактивны. Их указывают в админ-панели → Филиалы.</p>`}`;
}

function renderExternal() {
  const b = R_BRANCHES.find((x) => x.id === (filters.branch ? Number(filters.branch) : Number(form.branchId)));
  const l = branchLinks(b);
  $("#externalReviews").innerHTML = `
    <h3>Мы на картах</h3>
    <p class="branch-line">${icon("pin", 16)} ${esc(b.name)}, ${esc(b.address)}</p>
    ${externalButtons(l, "Оставьте отзыв там, где вам удобнее:")}
    ${l.yandexWidget ? `<iframe class="yandex-reviews" src="${l.yandexWidget}" title="Отзывы на Яндекс Картах" loading="lazy"></iframe>` : ""}`;
}

// разметка schema.org для поиска
function renderJsonLd() {
  const pub = Store.getReviews().filter((r) => r.status === "published");
  const s = reviewStats(pub);
  const data = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Парикмахерская «Тайм» (демо)",
    address: { "@type": "PostalAddress", addressLocality: "Якутск" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: s.avg.toFixed(1), reviewCount: s.count, bestRating: 5, worstRating: 1 },
    review: pub.slice(0, 10).map((r) => ({
      "@type": "Review", author: { "@type": "Person", name: r.author }, datePublished: r.date.slice(0, 10),
      reviewBody: r.text, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

// события
$("#fBranch").onchange = (e) => {
  filters.branch = e.target.value;
  if (filters.branch && !form.bookingId) { form.branchId = Number(filters.branch); form.masterId = ""; renderForm(); }
  renderSummary(); renderList(); renderExternal();
};
$("#fSort").onchange = (e) => { filters.sort = e.target.value; renderList(); };
$("#fSource").addEventListener("click", (e) => {
  const b = e.target.closest("[data-source]");
  if (!b) return;
  filters.source = b.dataset.source;
  renderFilters(); renderList();
});

if (filters.branch && !form.bookingId) form.branchId = Number(filters.branch);
renderFilters();
renderSummary();
renderList();
renderForm();
renderExternal();
renderJsonLd();
