function q(sel, root = document) {
  return root.querySelector(sel);
}
function qa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

const STORE_KEY = "wbs_nav_v1";

function loadNav() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveNav(nav) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(nav));
  } catch {}
}

let navState = loadNav() || {
  main: "proxy",
  sub: {
    target: "sitemap",
    proxy: "intercept",
    intruder: "positions",
  },
};

function getDefaultSub(mainId) {
  const firstBtn = q(`[data-main="${mainId}"][data-subtab]`);
  return firstBtn ? firstBtn.dataset.subtab : null;
}

function setMain(mainId) {
  navState.main = mainId;

  const mainTabs = qa("[data-main-tab]");
  const mainPanels = qa("[data-main-panel]");

  mainTabs.forEach((b) =>
    b.classList.toggle("is-active", b.dataset.mainTab === mainId)
  );
  mainPanels.forEach((p) =>
    p.classList.toggle("is-active", p.dataset.mainPanel === mainId)
  );

  const hasSubtabs = !!q(`[data-main="${mainId}"][data-subtab]`);
  if (hasSubtabs) {
    const desired = navState.sub[mainId] || getDefaultSub(mainId);
    if (desired) setSub(mainId, desired);
  }

  saveNav(navState);
}

function setSub(mainId, subId) {
  navState.sub = navState.sub || {};
  navState.sub[mainId] = subId;

  const subTabs = qa(`[data-main="${mainId}"][data-subtab]`);
  const subPanels = qa(`[data-main="${mainId}"][data-subpanel]`);

  subTabs.forEach((b) =>
    b.classList.toggle("is-active", b.dataset.subtab === subId)
  );
  subPanels.forEach((p) =>
    p.classList.toggle("is-active", p.dataset.subpanel === subId)
  );

  saveNav(navState);
}

export function navigateTo(mainId, subId = null) {
  setMain(mainId);
  if (subId) setSub(mainId, subId);
}

export function bindNavigation() {
  qa("[data-main-tab]").forEach((b) => {
    b.addEventListener("click", () => setMain(b.dataset.mainTab));
  });

  qa("[data-subtab][data-main]").forEach((b) => {
    b.addEventListener("click", () => setSub(b.dataset.main, b.dataset.subtab));
  });

  const initialMain = navState.main || "proxy";
  setMain(initialMain);

  ["target", "proxy", "intruder"].forEach((m) => {
    if (q(`[data-main="${m}"][data-subtab]`)) {
      const desired = navState.sub?.[m] || getDefaultSub(m);
      if (desired) setSub(m, desired);
    }
  });
}
