// основной скрипт сайта, все данные лежат в data/projects.js
(function () {
  "use strict";

  const P = window.PORTFOLIO || { projects: [], categories: [] };
  const GH = P.github || "";
  const GH_URL = "https://github.com/" + GH;
  const projects = (P.projects || []).filter((p) => p && p.id);
  const categories = P.categories || [];
  const page = document.body.dataset.page;

  // вспомогательные функции
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catTitle = (id) => (categories.find((c) => c.id === id) || {}).title || "Без категории";
  const countIn = (id) => projects.filter((p) => p.category === id).length;
  const projectUrl = (p) => "project.html?id=" + encodeURIComponent(p.id);
  const hostOf = (url) => {
    try {
      const u = new URL(url, location.href);
      if (u.protocol === "file:") return url.replace(/\/(index\.html)?$/, "");
      return u.host + u.pathname.replace(/\/(index\.html)?$/, "");
    } catch { return url; }
  };
  // если открывать сайт с диска, папка сама не открывает index.html, поэтому дописываю
  const demoSrc = (p) => {
    const d = p.demo || "";
    return location.protocol === "file:" && !/^[a-z]+:/i.test(d) && d.endsWith("/") ? d + "index.html" : d;
  };
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  const icon = {
    github:
      '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
    external:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m11 19-7-7 7-7"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    desktop:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    tablet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    mobile:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    reload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    send:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
  };

  // шапка и подвал
  function renderChrome() {
    const header = $("#header");
    if (header) {
      const link = (href, label, key) =>
        `<a class="nav__link${page === key ? " is-active" : ""}" href="${href}">${label}</a>`;
      header.className = "header";
      header.innerHTML = `
        <div class="container header__inner">
          <a class="logo" href="index.html" aria-label="На главную">
            <span class="logo__mark">${esc((P.name || "W")[0])}</span>
            <span>${esc(P.name || GH)}</span>
          </a>
          <button class="burger" type="button" aria-label="Меню" aria-expanded="false"><span></span></button>
          <nav class="nav">
            ${link("index.html", "Главная", "home")}
            ${link("works.html", "Работы", "works")}
            ${link("index.html#about", "Обо мне", "about")}
            <a class="btn btn--sm" href="${GH_URL}" target="_blank" rel="noopener">${icon.github}GitHub</a>
          </nav>
        </div>`;
      const burger = $(".burger", header);
      burger.addEventListener("click", () => {
        const open = header.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open);
      });
      header.querySelectorAll(".nav a").forEach((a) =>
        a.addEventListener("click", () => header.classList.remove("is-open"))
      );
    }

    const footer = $("#footer");
    if (footer) {
      footer.className = "footer";
      footer.innerHTML = `
        <div class="container footer__inner">
          <span>© ${new Date().getFullYear()} <span class="footer__mono">${esc(P.name || GH)}</span></span>
          <a href="${GH_URL}" target="_blank" rel="noopener" class="footer__mono">github.com/${esc(GH)}</a>
        </div>`;
    }
  }

  // фон из нулей и единиц, как в шапке профиля
  function binaryBackground(canvas) {
    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols, rows, cells, cw, ch, w, h;
    const FS = 13;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FS}px "Courier New", monospace`;
      cw = ctx.measureText("0").width;
      ch = FS * 1.05;
      cols = Math.ceil(w / cw);
      rows = Math.ceil(h / ch);
      cells = new Uint8Array(cols * rows).map(() => (Math.random() < 0.5 ? 1 : 0));
    }

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${FS}px "Courier New", monospace`;
      ctx.textBaseline = "top";
      for (let i = 0; i < cells.length * 0.01; i++) {
        cells[(Math.random() * cells.length) | 0] ^= 1;
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // волна яркости по диагонали
          const wave = Math.sin((x * 0.06 + y * 0.12) - t * 0.9) * 0.5 + 0.5;
          const a = 0.12 + wave * wave * 0.28;
          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.fillText(cells[y * cols + x] ? "1" : "0", x * cw, y * ch);
        }
      }
      t += 0.08;
    }

    resize();
    draw();
    window.addEventListener("resize", () => { resize(); draw(); });
    if (reduce) return;

    let last = 0, visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
    (function loop(ts) {
      requestAnimationFrame(loop);
      if (!visible || document.hidden || ts - last < 90) return;
      last = ts;
      draw();
    })(0);
  }

  // статистика с гитхаба, кэширую в sessionStorage чтобы не упереться в лимит api
  async function githubStats() {
    if (!GH) return null;
    const key = "gh-stats-" + GH;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (cached) return cached;
    } catch {}
    try {
      const res = await fetch("https://api.github.com/users/" + encodeURIComponent(GH));
      if (!res.ok) return null;
      const d = await res.json();
      const data = { repos: d.public_repos, followers: d.followers, avatar: d.avatar_url, name: d.name };
      try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
      return data;
    } catch {
      return null;
    }
  }

  // список репозиториев
  async function githubRepos() {
    if (!GH) return [];
    const key = "gh-repos-" + GH;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (cached) return cached;
    } catch {}
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(GH)}/repos?per_page=100&type=owner`);
      if (!res.ok) return [];
      const list = (await res.json()).map((r) => ({ name: r.name, language: r.language, fork: r.fork }));
      try { sessionStorage.setItem(key, JSON.stringify(list)); } catch {}
      return list;
    } catch {
      return [];
    }
  }

  // стек технологий
  // считаю по тегам работ + основной язык репозиториев на гитхабе (форки не считаю)
  // формула 100 * (1 - e^(-n/4)), так проценты растут плавно и не упираются в 100
  const SKILL_ALIASES = {
    js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript",
    html: "HTML", html5: "HTML", css: "CSS", css3: "CSS", scss: "SCSS", sass: "SCSS",
    py: "Python", python: "Python", "c#": "C#", csharp: "C#", "c++": "C++", cpp: "C++",
    react: "React", vue: "Vue", "node.js": "Node.js", nodejs: "Node.js", node: "Node.js",
    php: "PHP", java: "Java", go: "Go", figma: "Figma", sql: "SQL", git: "Git",
    // flutter гитхаб определяет как dart, поэтому считаю их вместе
    flutter: "Flutter", dart: "Flutter", "flutter/dart": "Flutter",
    kotlin: "Kotlin", swift: "Swift", docker: "Docker", sqlite: "SQLite",
  };
  const normSkill = (s) => SKILL_ALIASES[String(s).trim().toLowerCase()] || String(s).trim();

  async function collectSkills() {
    const cfg = P.skills || {};
    const hidden = new Set((cfg.hide || []).map(normSkill));
    const uses = new Map(); // name -> { projects, repos }
    const add = (name, field) => {
      const n = normSkill(name);
      if (!n || hidden.has(n)) return;
      const u = uses.get(n) || { projects: 0, repos: 0 };
      u[field]++;
      uses.set(n, u);
    };

    projects.forEach((p) => new Set((p.tags || []).map(normSkill)).forEach((t) => add(t, "projects")));

    if (cfg.useGithub !== false) {
      const inPortfolio = new Set(
        projects.map((p) => (p.repo || "").replace(/\/+$/, "").split("/").pop().toLowerCase()).filter(Boolean)
      );
      (await githubRepos()).forEach((r) => {
        if (r.fork || !r.language || inPortfolio.has(r.name.toLowerCase())) return;
        if (r.name.toLowerCase() === GH.toLowerCase()) return; // репо с readme профиля не считаем
        add(r.language, "repos");
      });
    }

    const manual = {};
    Object.entries(cfg.manual || {}).forEach(([k, v]) => (manual[normSkill(k)] = v));
    Object.keys(manual).forEach((k) => { if (!uses.has(k) && !hidden.has(k)) uses.set(k, { projects: 0, repos: 0 }); });

    return [...uses.entries()]
      .map(([name, u]) => {
        const total = u.projects + u.repos;
        const auto = Math.round(100 * (1 - Math.exp(-total / 4)));
        const level = Math.max(1, Math.min(100, Math.round(manual[name] ?? auto)));
        return { name, level, total, ...u, isManual: manual[name] != null };
      })
      .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
      .slice(0, cfg.max || 10);
  }

  async function renderSkills(el) {
    if (!el) return;
    const skills = await collectSkills();
    if (!skills.length) {
      el.innerHTML = `<div class="empty">Добавьте теги к работам в data/projects.js, и здесь появится ваш стек.</div>`;
      return;
    }
    const projWord = (n) => n + " " + plural(n, "проект", "проекта", "проектов");
    el.innerHTML = `
      <div class="skills__plot" role="img" aria-label="Уровень владения технологиями">
        <div class="skills__grid" aria-hidden="true">
          ${[100, 75, 50, 25].map((v) => `<span style="bottom:${v}%"><i>${v}</i></span>`).join("")}
        </div>
        ${skills
          .map(
            (s, i) => `
          <div class="skill" style="--lvl:${s.level / 100};--i:${i}" tabindex="0">
            <div class="skill__track">
              <div class="skill__bar"></div>
              <span class="skill__val"><b data-to="${s.level}">0</b>%</span>
            </div>
            <div class="skill__name" title="${esc(s.name)}">${esc(s.name)}</div>
            <div class="skill__tip">
              <b>${esc(s.name)}: ${s.level}%</b>
              ${s.isManual ? "задано вручную" : projWord(s.total)}
              ${!s.isManual && s.repos ? `<br><span>${s.projects} в портфолио · ${s.repos} на GitHub</span>` : ""}
            </div>
          </div>`
          )
          .join("")}
      </div>
      <table class="sr-only">
        <caption>Стек технологий</caption>
        <tr><th>Технология</th><th>Уровень</th><th>Проектов</th></tr>
        ${skills.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.level}%</td><td>${s.total}</td></tr>`).join("")}
      </table>`;

    onView(el, () => {
      el.classList.add("is-up");
      el.querySelectorAll(".skill__val b").forEach((b, i) =>
        countUp(b, +b.dataset.to, { delay: 250 + i * 120, duration: 1500 })
      );
    });
  }

  // анимация счета, цифры идут по одной (0, 1, 2, 3...)
  // duration - примерное время всего счета
  function countUp(el, to, { delay = 0, suffix = "", duration = 1800 } = {}) {
    if (!el) return;
    if (typeof to !== "number") { el.textContent = "-"; return; }
    el.textContent = "0" + suffix;
    if (to <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = to + suffix;
      return;
    }
    const interval = Math.max(28, Math.min(480, duration / to));
    const inc = Math.max(1, Math.ceil(to / (3000 / interval))); // если число большое, шаг больше
    const roll = Math.min(interval * 0.9, 380);
    let n = 0;
    setTimeout(function tick() {
      n = Math.min(to, n + inc);
      el.textContent = n + suffix;
      el.animate?.(
        [
          { transform: "translateY(45%)", opacity: 0.15, filter: "blur(3px)" },
          { transform: "translateY(0)", opacity: 1, filter: "blur(0)" },
        ],
        { duration: roll, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" }
      );
      if (n < to) setTimeout(tick, interval);
      else {
        setTimeout(() => {
          el.classList.add("is-done");
          setTimeout(() => el.classList.remove("is-done"), 700);
        }, roll);
      }
    }, delay);
  }

  // живое превью сайта в карточке (iframe 1440px уменьшенный через scale)
  const scaleObserver = new ResizeObserver((entries) => {
    for (const e of entries) {
      const f = e.target.querySelector("iframe");
      if (f) f.style.transform = `scale(${e.contentRect.width / 1440})`;
    }
  });
  const loadObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const box = e.target;
        loadObserver.unobserve(box);
        const f = document.createElement("iframe");
        f.src = box.dataset.src;
        f.title = "Превью";
        f.tabIndex = -1;
        f.setAttribute("aria-hidden", "true");
        f.setAttribute("scrolling", "no");
        f.setAttribute("sandbox", "allow-scripts allow-same-origin");
        f.style.transform = `scale(${box.clientWidth / 1440})`;
        f.addEventListener("load", () => box.querySelector(".live__placeholder")?.remove());
        box.appendChild(f);
        scaleObserver.observe(box);
      }
    },
    { rootMargin: "200px" }
  );

  function hydratePreviews(root) {
    root.querySelectorAll(".live[data-src]").forEach((el) => loadObserver.observe(el));
  }

  // чат телеграма для ботов
  function msgHTML(m) {
    const text = esc(m.text).replace(/\n/g, "<br>");
    const btns = (m.buttons || []).map((b) => `<span class="tg__btn">${esc(b)}</span>`).join("");
    return `<div class="tg__msg tg__msg--${m.from === "user" ? "user" : "bot"}">
      <div class="tg__bubble">${text}</div>${btns ? `<div class="tg__btns">${btns}</div>` : ""}
    </div>`;
  }
  function miniChatHTML(p) {
    return `<div class="tg tg--mini" aria-hidden="true"><div class="tg__body">${p.chat.slice(0, 4).map(msgHTML).join("")}</div></div>`;
  }
  function playChat(el, chat) {
    if (reduceMotion) { el.innerHTML = chat.map(msgHTML).join(""); return; }
    let i = 0;
    (function next() {
      if (i >= chat.length) return;
      const m = chat[i++];
      const typing = m.from !== "user";
      if (typing) {
        el.insertAdjacentHTML("beforeend", `<div class="tg__msg tg__msg--bot tg__typing"><div class="tg__bubble"><i></i><i></i><i></i></div></div>`);
        el.scrollTop = el.scrollHeight;
      }
      setTimeout(() => {
        el.querySelector(".tg__typing")?.remove();
        el.insertAdjacentHTML("beforeend", msgHTML(m));
        el.lastElementChild.classList.add("is-new");
        el.scrollTop = el.scrollHeight;
        setTimeout(next, typing ? 900 : 700);
      }, typing ? 800 + Math.min(1200, m.text.length * 12) : 350);
    })();
  }

  function cardHTML(p, i = 0) {
    const preview = p.cover
      ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">`
      : p.demo
      ? `<div class="live" data-src="${esc(demoSrc(p))}"><div class="live__placeholder">загрузка превью…</div></div>`
      : p.chat
      ? miniChatHTML(p)
      : `<div class="poster"><span>${esc(p.title)}</span></div>`;
    return `
      <a class="card reveal" style="--i:${i % 3}" href="${projectUrl(p)}">
        <div class="card__preview">${preview}</div>
        <div class="card__body">
          <div class="card__meta"><span>${esc(catTitle(p.category))}</span><span>${esc(p.date || "")}</span></div>
          <h3 class="card__title">${esc(p.title)}</h3>
          <p class="card__desc">${esc(p.description || "")}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
      </a>`;
  }

  function renderGrid(el, list) {
    el.innerHTML = list.length
      ? list.map(cardHTML).join("")
      : `<div class="empty">Здесь пока пусто. Скоро появятся новые работы.</div>`;
    hydratePreviews(el);
    reveal(el);
  }

  // появление блоков при скролле
  // после анимации убираю класс reveal, иначе он ломает hover у карточек
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      revealObserver.unobserve(el);
      el.classList.add("is-visible", "in-view");
      const delay = (parseFloat(getComputedStyle(el).getPropertyValue("--i")) || 0) * 110;
      setTimeout(() => el.classList.remove("reveal", "is-visible"), 1100 + delay);
      el.querySelectorAll(".section__head .eyebrow").forEach(typeText);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  function reveal(root = document) {
    root.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => revealObserver.observe(el));
  }

  function onView(el, cb) {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); cb(); }
    }, { threshold: 0.3 });
    io.observe(el);
  }

  // эффект печати для подзаголовков
  function prepareTyping(root = document) {
    if (reduceMotion) return;
    root.querySelectorAll(".section__head .eyebrow").forEach((el) => {
      if (el.dataset.full) return;
      el.dataset.full = el.textContent;
      el.textContent = " ";
    });
  }
  function typeText(el) {
    const full = el.dataset.full;
    if (!full || el.dataset.typed) return;
    el.dataset.typed = "1";
    let i = 0;
    el.classList.add("is-typing");
    (function tick() {
      el.textContent = full.slice(0, ++i);
      if (i < full.length) setTimeout(tick, 28 + Math.random() * 45);
      else setTimeout(() => el.classList.remove("is-typing"), 1400);
    })();
  }

  // неоновая надпись, буквы загораются по очереди и мерцают
  function neonIgnite(el, text, opts = {}) {
    if (!el) return;
    const { start = 300, step = 140, onPower, onDone } = opts;
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    const chars = [];
    [...text].forEach((c) => {
      if (c === " ") { el.appendChild(document.createTextNode(" ")); return; }
      const ch = document.createElement("span");
      ch.className = "ch";
      ch.dataset.c = c;
      ch.setAttribute("aria-hidden", "true");
      ch.innerHTML = `<span class="ch__lit">${esc(c)}</span>`;
      el.appendChild(ch);
      chars.push(ch);
    });

    if (reduceMotion) {
      el.classList.add("is-on");
      onPower && onPower();
      onDone && onDone();
      return;
    }

    // немного перемешиваю порядок, так выглядит естественнее
    const order = chars.map((_, i) => i + (Math.random() - 0.5) * 1.6);
    const ranked = [...order].sort((a, b) => a - b);
    const stubborn = (Math.random() * chars.length) | 0; // одна буква включается дольше остальных
    let finish = 0;
    chars.forEach((ch, i) => {
      const lit = ch.firstChild;
      const pos = ranked.indexOf(order[i]);
      const delay = start + pos * step + Math.random() * 120;
      const dur = i === stubborn ? 1700 : 650 + Math.random() * 500;
      lit.style.animation = `${i === stubborn ? "neon-stubborn" : "neon-on-" + (1 + (i % 3))} ${dur}ms linear ${delay}ms both`;
      finish = Math.max(finish, delay + dur);
    });
    el.classList.add("ignite");
    setTimeout(() => onPower && onPower(), start);

    setTimeout(() => {
      el.classList.remove("ignite");
      chars.forEach((ch) => (ch.firstChild.style.animation = ""));
      el.classList.add("is-on", "is-flash");
      setTimeout(() => el.classList.remove("is-flash"), 900);
      onDone && onDone();
      // иногда одна буква моргает
      (function buzz() {
        setTimeout(() => {
          if (!document.hidden) {
            const ch = chars[(Math.random() * chars.length) | 0];
            ch.classList.add("buzz");
            setTimeout(() => ch.classList.remove("buzz"), 700);
          }
          buzz();
        }, 4000 + Math.random() * 6000);
      })();
    }, finish + 60);
  }

  // параллакс шапки
  function heroParallax(hero) {
    if (!hero || reduceMotion) return;
    const content = $(".hero__content", hero);
    const matrix = $(".hero__matrix", hero);
    let ticking = false;
    function update() {
      ticking = false;
      const h = hero.offsetHeight;
      const y = Math.min(window.scrollY, h);
      const k = y / h;
      content.style.transform = `translate3d(0, ${y * 0.38}px, 0) scale(${1 - k * 0.08})`;
      content.style.opacity = String(Math.max(0, 1 - k * 1.25));
      content.style.filter = k > 0.02 ? `blur(${(k * 14).toFixed(2)}px)` : "";
      matrix.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  // свой курсор, только для мыши (на телефоне не нужен)
  function neonCursor() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    const cur = document.createElement("div");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = `
      <div class="cursor__aura"></div>
      <svg class="cursor__arrow" viewBox="0 0 24 26" width="24" height="26">
        <path d="M3 2 L3 20.5 L7.9 15.9 L11.3 23.6 L14.6 22.2 L11.2 14.6 L17.8 14.6 Z"/>
      </svg>`;
    document.body.appendChild(cur);
    root.classList.add("has-cursor");

    const arrow = cur.querySelector(".cursor__arrow");
    const aura = cur.querySelector(".cursor__aura");
    const HOVER = "a, button, [role='button'], label, select, .card, .cat, .tab, .skill, summary";
    const TEXT = "input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']), textarea, [contenteditable='true']";

    let x = -100, y = -100, ax = x, ay = y, visible = false, raf = 0;

    function loop() {
      // ореол догоняет с задержкой
      ax += (x - ax) * (reduceMotion ? 1 : 0.18);
      ay += (y - ay) * (reduceMotion ? 1 : 0.18);
      aura.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      raf = Math.abs(x - ax) + Math.abs(y - ay) > 0.3 ? requestAnimationFrame(loop) : 0;
    }

    document.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      arrow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!visible) {
        visible = true;
        ax = x; ay = y;
        cur.classList.remove("is-hidden");
      }
      const t = e.target;
      cur.classList.toggle("is-text", !!(t.closest && t.closest(TEXT)));
      cur.classList.toggle("is-hover", !!(t.closest && t.closest(HOVER)));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    const hide = () => { visible = false; cur.classList.add("is-hidden"); };
    // прячу курсор если мышь ушла с окна или зашла в iframe
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) hide(); });
    document.addEventListener("mouseover", (e) => { if (e.target.tagName === "IFRAME") hide(); });
    window.addEventListener("blur", hide);

    document.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      cur.classList.add("is-down");
      if (reduceMotion) return;
      const ring = document.createElement("span");
      ring.className = "cursor__ring";
      ring.style.left = e.clientX + "px";
      ring.style.top = e.clientY + "px";
      cur.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove());
    });
    document.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    hide();
  }

  // полоса прогресса скролла и подсветка карточек
  function ambientEffects() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    let ticking = false;
    const upd = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();

    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;

    // подсветка и наклон карточек за мышкой
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest(".card, .cat, .stat, .about");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");
      if (el.matches(".card, .cat") && !el.classList.contains("reveal")) {
        const rx = ((y / r.height) - 0.5) * -6;
        const ry = ((x / r.width) - 0.5) * 8;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest(".card, .cat");
      if (el && !el.contains(e.relatedTarget)) el.style.transform = "";
    });
  }

  // ===== страницы =====

  function pageHome() {
    const hero = $(".hero");
    $("#hero-tagline").textContent = P.tagline || "";
    $("#hero-github").href = GH_URL;
    binaryBackground($("#matrix"));

    // сначала включается неон, потом все остальное
    requestAnimationFrame(() => hero.classList.add("is-booting"));
    neonIgnite($("#hero-name"), P.name || GH, {
      start: 650,
      onPower: () => hero.classList.add("is-powered"),
      onDone: () => hero.classList.add("is-on"),
    });
    heroParallax(hero);

    // статистика
    const usedCats = categories.filter((c) => countIn(c.id) > 0).length;
    $("#stat-projects-label").textContent = plural(projects.length, "работа в портфолио", "работы в портфолио", "работ в портфолио");
    const gh = githubStats();
    // считаем только когда блок появился на экране
    onView($(".stats"), () => {
      countUp($("#stat-projects"), projects.length, { delay: 350 });
      countUp($("#stat-cats"), usedCats, { delay: 460 });
      gh.then((s) => {
        countUp($("#stat-repos"), s && s.repos, { delay: 570 });
        countUp($("#stat-followers"), s && s.followers, { delay: 680 });
      });
    });

    renderSkills($("#skills-chart"));

    // категории
    $("#cats").innerHTML = categories
      .map(
        (c, i) => `
        <a class="cat reveal reveal--left" style="--i:${i}" href="works.html#${encodeURIComponent(c.id)}">
          <span class="cat__count">${countIn(c.id)}</span>
          <h3 class="cat__title">${esc(c.title)}</h3>
          <p class="cat__desc">${esc(c.description || "")}</p>
        </a>`
      )
      .join("");

    // последние работы
    renderGrid($("#latest"), projects.slice(0, 3));

    // обо мне
    $("#about-avatar").src = `https://github.com/${encodeURIComponent(GH)}.png?size=256`;
    $("#about-name").textContent = P.name || GH;
    $("#about-nick").textContent = "@" + GH;
    $("#about-text").textContent = P.about || "";
    const links = [`<a class="btn" href="${GH_URL}" target="_blank" rel="noopener">${icon.github}GitHub</a>`];
    if (P.contacts?.telegram)
      links.push(`<a class="btn" href="${esc(P.contacts.telegram)}" target="_blank" rel="noopener">${icon.send}Telegram</a>`);
    if (P.contacts?.email)
      links.push(`<a class="btn" href="mailto:${esc(P.contacts.email)}">${icon.mail}${esc(P.contacts.email)}</a>`);
    $("#about-links").innerHTML = links.join("");

    reveal();
  }

  function pageWorks() {
    const tabsEl = $("#tabs");
    const gridEl = $("#works");
    const searchEl = $("#search");
    const countEl = $("#result-count");
    $("#works-total").textContent =
      projects.length + " " + plural(projects.length, "работа", "работы", "работ");

    neonIgnite($(".page-head__title"), "Работы", { start: 250, step: 90 });
    const tabs = [{ id: "all", title: "Все" }, ...categories];
    tabsEl.innerHTML = tabs
      .map((t) => {
        const n = t.id === "all" ? projects.length : countIn(t.id);
        return `<button class="tab" type="button" data-id="${esc(t.id)}">${esc(t.title)}<span class="tab__count">${n}</span></button>`;
      })
      .join("");

    function current() {
      const id = decodeURIComponent(location.hash.slice(1));
      return tabs.some((t) => t.id === id) ? id : "all";
    }

    function update() {
      const cat = current();
      const q = searchEl.value.trim().toLowerCase();
      tabsEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.id === cat));
      const list = projects.filter((p) => {
        if (cat !== "all" && p.category !== cat) return false;
        if (!q) return true;
        return [p.title, p.description, ...(p.tags || [])].join(" ").toLowerCase().includes(q);
      });
      countEl.textContent = "Показано: " + list.length;
      const catInfo = categories.find((c) => c.id === cat);
      $("#works-sub").textContent = catInfo?.description || "Откройте любой проект, чтобы посмотреть его вживую.";
      renderGrid(gridEl, list);
    }

    tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      history.replaceState(null, "", b.dataset.id === "all" ? location.pathname : "#" + b.dataset.id);
      update();
    });
    window.addEventListener("hashchange", update);
    searchEl.addEventListener("input", update);
    update();
  }

  function pageProject() {
    const id = new URLSearchParams(location.search).get("id");
    const p = projects.find((x) => x.id === id);
    const main = $("#main");

    if (!p) {
      document.title = "Работа не найдена | " + (P.name || GH);
      main.innerHTML = `
        <section class="page-head"><div class="container">
          <h1 class="page-head__title">404</h1>
          <p class="page-head__sub">Такой работы нет. Возможно, ссылка устарела.</p>
          <p style="margin-top:24px"><a class="btn" href="works.html">${icon.back}Все работы</a></p>
        </div></section>`;
      return;
    }

    document.title = p.title + " | " + (P.name || GH);
    const meta = document.querySelector('meta[name="description"]');
    if (meta && p.description) meta.setAttribute("content", p.description);

    const actions = [];
    if (p.demo) actions.push(`<a class="btn btn--primary" href="${esc(demoSrc(p))}" target="_blank" rel="noopener">${icon.external}Открыть сайт</a>`);
    if (p.repo) actions.push(`<a class="btn" href="${esc(p.repo)}" target="_blank" rel="noopener">${icon.github}Код</a>`);

    const others = projects.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 3);

    main.innerHTML = `
      <section class="page-head"><div class="container">
        <div class="crumbs">
          <a href="works.html">Работы</a><span>/</span>
          <a href="works.html#${encodeURIComponent(p.category)}">${esc(catTitle(p.category))}</a><span>/</span>
          <span>${esc(p.title)}</span>
        </div>
        <h1 class="page-head__title neon-sm">${esc(p.title)}</h1>
        <div class="project-info">
          <div>
            <p class="page-head__sub" style="margin-top:0">${esc(p.description || "")}</p>
            <div class="tags" style="margin-top:14px">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          </div>
          <div class="project-info__actions">${actions.join("")}</div>
        </div>
      </div></section>

      ${p.demo ? `
      <section class="viewer"><div class="container">
        <div class="viewer__bar">
          <div class="dots"><i></i><i></i><i></i></div>
          <div class="address" title="${esc(demoSrc(p))}">${esc(hostOf(p.demo))}</div>
          <div class="devices">
            <button class="icon-btn is-active" data-device="desktop" title="Компьютер">${icon.desktop}</button>
            <button class="icon-btn" data-device="tablet" title="Планшет">${icon.tablet}</button>
            <button class="icon-btn" data-device="mobile" title="Телефон">${icon.mobile}</button>
          </div>
          <button class="icon-btn" id="reload" title="Обновить">${icon.reload}</button>
        </div>
        <div class="viewer__stage" data-device="desktop">
          <iframe class="viewer__frame" src="${esc(demoSrc(p))}" title="${esc(p.title)}" loading="eager"></iframe>
        </div>
        <p class="viewer__note">Сайт не загрузился? <a href="${esc(demoSrc(p))}" target="_blank" rel="noopener">Откройте его в новой вкладке</a>.</p>
      </div></section>` : ""}

      ${!p.demo && p.chat ? `
      <section class="viewer"><div class="container">
        <div class="tg reveal">
          <div class="tg__head">
            <span class="tg__avatar">${esc(p.title[0])}</span>
            <div><b>${esc(p.title)}</b><small>бот</small></div>
          </div>
          <div class="tg__body" id="tg-body"></div>
        </div>
        <p class="viewer__note">Пример диалога: так клиент записывается через бота.</p>
      </div></section>` : ""}

      ${(p.features && p.features.length) || p.access ? `
      <section class="details"><div class="container">
        <div class="section__head reveal">
          <div><p class="eyebrow">// принцип работы</p><h2 class="h2">Что умеет проект</h2></div>
        </div>
        ${p.features && p.features.length ? `<ul class="features">${p.features
          .map((f, i) => `<li class="reveal reveal--left" style="--i:${i % 4}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(f)}</li>`)
          .join("")}</ul>` : ""}
        ${p.access ? `<p class="access reveal"><b>Демо-доступ:</b> ${esc(p.access)}</p>` : ""}
      </div></section>` : ""}

      ${others.length ? `
      <section class="related"><div class="container">
        <div class="section__head reveal">
          <div><p class="eyebrow">// ещё в категории</p><h2 class="h2">${esc(catTitle(p.category))}</h2></div>
          <a class="link-more" href="works.html#${encodeURIComponent(p.category)}">Все ${icon.arrow}</a>
        </div>
        <div class="grid" id="related"></div>
      </div></section>` : ""}`;

    neonIgnite($(".page-head__title"), p.title, { start: 250, step: 55 });
    const stage = $(".viewer__stage");
    if (stage) {
      document.querySelectorAll("button[data-device]").forEach((b) =>
        b.addEventListener("click", () => {
          stage.dataset.device = b.dataset.device;
          document.querySelectorAll("button[data-device]").forEach((x) => x.classList.toggle("is-active", x === b));
        })
      );
      $("#reload").addEventListener("click", () => {
        const f = $(".viewer__frame");
        f.src = f.src;
      });
    }
    if (others.length) renderGrid($("#related"), others);
    reveal();
    if (!p.demo && p.chat) onView($("#tg-body"), () => playChat($("#tg-body"), p.chat));
  }

  // запуск
  renderChrome();
  ambientEffects();
  neonCursor();
  ({ home: pageHome, works: pageWorks, project: pageProject }[page] || (() => {}))();
  prepareTyping();
  // иконки для статичной разметки
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML(el.dataset.icon === "arrow" ? "beforeend" : "afterbegin", icon[el.dataset.icon] || "");
  });
})();
