// каталог

const state = {
  shape: "", material: "", gender: "",
  priceMin: "", priceMax: "", lens: "", stock: false,
  search: "", sort: "popular",
};

let frames = Store.getFrames();

function renderChips(containerId, dict, key) {
  const el = $(containerId);
  const items = [["", "Все"], ...Object.entries(dict)];
  el.innerHTML = items.map(([val, label]) =>
    `<button type="button" class="chip ${state[key] === val ? "active" : ""}" data-val="${val}">${label}</button>`).join("");
  el.onclick = (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state[key] = btn.dataset.val;
    renderChips(containerId, dict, key);
    renderCatalog();
  };
}

function filteredFrames() {
  const q = state.search.trim().toLowerCase();
  const list = frames.filter((f) => {
    if (state.shape && f.shape !== state.shape) return false;
    if (state.material && f.material !== state.material) return false;
    if (state.gender && f.gender !== state.gender) return false;
    if (state.priceMin && f.price < +state.priceMin) return false;
    if (state.priceMax && f.price > +state.priceMax) return false;
    if (state.stock && !f.inStock) return false;
    if (state.lens === "s" && f.lensWidth > 49) return false;
    if (state.lens === "m" && (f.lensWidth < 50 || f.lensWidth > 53)) return false;
    if (state.lens === "l" && f.lensWidth < 54) return false;
    if (q && !`${f.name} ${f.brand}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    width: (a, b) => a.frameWidth - b.frameWidth,
    popular: (a, b) => (b.inStock - a.inStock) || (a.id - b.id),
  };
  return list.sort(sorters[state.sort]);
}

function renderCatalog() {
  const list = filteredFrames();
  $("#catalogCount").textContent = `Найдено ${list.length} ${plural(list.length, ["оправа", "оправы", "оправ"])}`;
  $("#catalogGrid").innerHTML = list.length
    ? list.map(frameCardHTML).join("")
    : `<div class="empty" style="grid-column: 1/-1">Ничего не найдено. Попробуйте изменить фильтры.</div>`;
}

function bindFilters() {
  renderChips("#fShape", SHAPES, "shape");
  renderChips("#fMaterial", MATERIALS, "material");
  renderChips("#fGender", GENDERS, "gender");
  const bind = (id, key, ev = "input", prop = "value") =>
    $(id).addEventListener(ev, (e) => { state[key] = e.target[prop]; renderCatalog(); });
  bind("#fPriceMin", "priceMin");
  bind("#fPriceMax", "priceMax");
  bind("#fLens", "lens", "change");
  bind("#fStock", "stock", "change", "checked");
  bind("#fSearch", "search");
  bind("#fSort", "sort", "change");
}

$("#fReset").onclick = () => {
  Object.assign(state, { shape: "", material: "", gender: "", priceMin: "", priceMax: "", lens: "", stock: false, search: "" });
  ["#fPriceMin", "#fPriceMax", "#fLens", "#fSearch"].forEach((id) => ($(id).value = ""));
  $("#fStock").checked = false;
  renderChips("#fShape", SHAPES, "shape");
  renderChips("#fMaterial", MATERIALS, "material");
  renderChips("#fGender", GENDERS, "gender");
  renderCatalog();
};

// изменения из админки в соседней вкладке
window.addEventListener("storage", () => {
  frames = Store.getFrames();
  renderCatalog();
});

const sample = frames.find((f) => f.id === 1) || frames[0];
$("#sizeDiagram").innerHTML = sample ? dimsSVG(sample) : "";
bindFilters();
bindFrameCards($("#catalogGrid"));
renderCatalog();
