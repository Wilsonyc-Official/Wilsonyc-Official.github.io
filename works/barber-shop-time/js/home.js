// главная

const services = Store.getServices();
const branches = Store.getBranches().filter((b) => b.active);
const masters = Store.getMasters().filter((m) => m.active);

const minPrice = (s) => Math.min(...s.styles.map((x) => x.price));

// услуги
$("#servicesGrid").innerHTML = services.map((s) => `
  <a class="service-card" href="booking.html?service=${s.id}">
    <span class="service-photo" style="background-image:url('${s.styles[0].photo}')"></span>
    <span class="service-body">
      <span class="service-icon">${icon(s.icon, 22)}</span>
      <b>${esc(s.name)} <span class="mark">${s.mark}</span></b>
      <span class="service-text">${esc(s.text)}</span>
      <span class="service-foot"><span>от ${rub(minPrice(s))}</span><span class="link-arrow">Записаться ${icon("arrow", 16)}</span></span>
    </span>
  </a>`).join("");

// галерея
let activeCat = services[0].id;
function renderGallery() {
  $("#galleryTabs").innerHTML = services.map((s) =>
    `<button class="tab ${s.id === activeCat ? "active" : ""}" role="tab" data-cat="${s.id}">${esc(s.name)} ${s.mark}</button>`).join("");
  const s = services.find((x) => x.id === activeCat);
  $("#galleryGrid").innerHTML = s.styles.map((st, i) => `
    <button class="gallery-item" data-i="${i}">
      <img src="${st.photo}" alt="${esc(st.name)}" loading="lazy">
      <span class="gallery-cap"><b>${esc(st.name)}</b><span>${rub(st.price)} · ${formatDuration(st.duration)}</span></span>
    </button>`).join("");
}
$("#galleryTabs").addEventListener("click", (e) => {
  const t = e.target.closest("[data-cat]");
  if (!t) return;
  activeCat = t.dataset.cat;
  renderGallery();
});
$("#galleryGrid").addEventListener("click", (e) => {
  const t = e.target.closest("[data-i]");
  if (!t) return;
  const s = services.find((x) => x.id === activeCat);
  const st = s.styles[Number(t.dataset.i)];
  openModal(`
    <div class="style-modal">
      <img src="${st.photo}" alt="${esc(st.name)}">
      <div>
        <span class="eyebrow dark">${esc(s.name)}</span>
        <h3>${esc(st.name)}</h3>
        <p class="style-meta">${icon("clock", 18)} ${formatDuration(st.duration)} <span>·</span> <b>${rub(st.price)}</b></p>
        <p class="hint">Фото — пример работы из открытых источников (демо).</p>
        <a class="btn btn-accent" href="booking.html?service=${s.id}&style=${t.dataset.i}">Записаться на эту услугу</a>
      </div>
    </div>`);
});
renderGallery();

// филиалы
const mastersIn = (bid) => masters.filter((m) => m.branchId === bid).length;
$("#branchList").innerHTML = branches.map((b) => `
  <button class="branch-card" data-branch="${b.id}">
    <span class="branch-pin">${icon("pin", 20)}</span>
    <span class="branch-info">
      <b>${esc(b.name)}</b>
      <span>${esc(b.address)} · ${esc(b.district)}</span>
      <span class="branch-meta">${icon("clock", 14)} ${b.open}–${b.close} · ${mastersIn(b.id)} мастера</span>
    </span>
  </button>`).join("");
const homeMap = createBranchMap($("#homeMap"), branches, { onSelect: (id) => highlightBranch(id) });
function highlightBranch(id) {
  $$(".branch-card").forEach((c) => c.classList.toggle("active", Number(c.dataset.branch) === id));
  homeMap.select(id);
}
$("#branchList").addEventListener("click", (e) => {
  const c = e.target.closest("[data-branch]");
  if (c) highlightBranch(Number(c.dataset.branch));
});

// мастера
const branchName = (id) => (branches.find((b) => b.id === id) || {}).name || "";
const serviceShort = (id) => (services.find((s) => s.id === id) || {}).name || id;
$("#mastersGrid").innerHTML = masters.slice(0, 8).map((m) => `
  <div class="master-card">
    ${avatar(m, 64)}
    <b>${esc(m.name)}</b>
    <span class="master-role">${esc(m.role)}</span>
    <span class="master-rating">${icon("star", 14)} ${m.rating.toFixed(1)}</span>
    <span class="master-branch">${icon("pin", 14)} ${esc(branchName(m.branchId))}</span>
    <span class="chips">${m.services.slice(0, 3).map((s) => `<span class="chip">${esc(serviceShort(s))}</span>`).join("")}</span>
  </div>`).join("");

// отзывы
const published = Store.getReviews().filter((r) => r.status === "published");
const rs = reviewStats(published);
$("#reviewsSummary").innerHTML = `<b class="rating-inline">${rs.avg.toFixed(1)} ★</b> — средняя оценка по ${rs.count} ${reviewsWord(rs.count)}.
  Отзывы-примеры для демонстрации.`;
$("#homeReviews").innerHTML = published
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3)
  .map((r) => reviewCard(r, { branches, services, masters })).join("");
