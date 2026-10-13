// главная

function bindSlider() {
  const hero = $("#hero");
  const slides = $$(".slide", hero);
  const DELAY = 6000;
  let index = 0;
  let timer = null;

  $("#heroDots").innerHTML = slides.map((_, i) => `<button class="hero-dot" data-i="${i}" aria-label="Слайд ${i + 1}"><i></i></button>`).join("");
  const dots = $$(".hero-dot", hero);

  function go(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    dots.forEach((d, n) => {
      d.classList.remove("active");
      void d.offsetWidth; // перезапуск анимации полоски
      d.classList.toggle("active", n === index);
    });
    $("#heroCounter").textContent = `0${index + 1} / 0${slides.length}`;
    clearTimeout(timer);
    if (!hero.classList.contains("paused")) timer = setTimeout(() => go(index + 1), DELAY);
  }

  $("#heroPrev").onclick = () => go(index - 1);
  $("#heroNext").onclick = () => go(index + 1);
  $("#heroDots").onclick = (e) => {
    const dot = e.target.closest(".hero-dot");
    if (dot) go(+dot.dataset.i);
  };
  // пауза при наведении
  hero.addEventListener("mouseenter", () => { hero.classList.add("paused"); clearTimeout(timer); });
  hero.addEventListener("mouseleave", () => { hero.classList.remove("paused"); go(index); });

  // свайпы на телефоне
  let startX = null;
  hero.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  go(0);
}

function renderHome() {
  $("#homeFeatures").innerHTML = [
    ["eye", "Точная диагностика", "Компьютерная проверка зрения"],
    ["user", "Опытные врачи", "Офтальмологи и оптометристы"],
    ["wrench", "Своя мастерская", "Очки за 1 день, ремонт при вас"],
    ["shield", "Гарантия", "На все изготовленные очки"],
  ].map(([ic, title, text]) => `
    <div class="feature"><span class="feature-ic">${icon(ic)}</span><div><b>${title}</b><span>${text}</span></div></div>`).join("");

  $("#servicesList").innerHTML = Object.entries(SERVICES).map(([key, s]) => `
    <a class="service" href="booking.html?service=${key}">
      <div class="service-icon">${icon(SERVICE_ICON[key], 24)}</div>
      <h3>${s.name}</h3>
      <p>${s.text}</p>
      <div class="service-foot"><span class="price">${s.price}</span><span class="hint">${s.duration}</span></div>
    </a>`).join("");

  const frames = Store.getFrames();
  const popular = frames.filter((f) => f.inStock).sort((a, b) => (!!b.oldPrice - !!a.oldPrice) || (a.id - b.id)).slice(0, 4);
  $("#popularFrames").innerHTML = popular.map(frameCardHTML).join("");
  bindFrameCards($("#popularFrames"));

  const specs = Store.getSpecialists().filter((s) => s.active !== false);
  const bookings = Store.getBookings();
  $("#teamPreview").innerHTML = specs.map((s) => teamCardHTML(s, bookings)).join("");
  bindTeamCards($("#teamPreview"), specs);
}

bindSlider();
renderHome();
