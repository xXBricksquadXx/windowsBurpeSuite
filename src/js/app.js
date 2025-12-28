// src/js/app.js
import { bindNavigation, navigateTo } from "./ui.js";
import {
  sendFromForm,
  saveCurrentToRepeater,
  overwriteFromForm,
  updateRequestPreview,
} from "./modules/interceptor.js";
import {
  renderSavedList,
  clearAllSaved,
  setSelectedId,
  replaySelected,
} from "./modules/repeater.js";
import { getExtenderConfig, bindExtenderControls } from "./modules/extender.js";
import { initHeaderEditor } from "./modules/headersEditor.js";
import { bindScopeControls } from "./modules/scope.js";
import { bindSitemapControls, renderSitemap } from "./modules/sitemap.js";

function byId(id) {
  return document.getElementById(id);
}

const FILTER_KEY = "wbs_history_filters_v1";

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveFilters(filters) {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filters || {}));
  } catch {}
}

function wireHistoryFilters() {
  const el = byId("history-hide-oos");
  if (!el) return;

  const persisted = loadFilters();
  el.checked = !!persisted.hideOutOfScope;

  el.addEventListener("change", () => {
    saveFilters({ ...persisted, hideOutOfScope: !!el.checked });
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
  });
}

function wireInterceptor() {
  byId("btn-send").addEventListener("click", async () => {
    const cfg = getExtenderConfig();
    await sendFromForm(cfg);
  });

  byId("btn-save").addEventListener("click", () => {
    const id = saveCurrentToRepeater();
    if (id) {
      // optional: signal other panels to refresh if they listen
      window.dispatchEvent(new CustomEvent("wbs:saved-changed"));

      navigateTo("proxy", "http");
      renderSavedList({ onSelect: (sid) => setSelectedId(sid) });

      // sitemap uses history; refresh it too
      renderSitemap();
    }
  });

  const btnOverwrite = byId("btn-overwrite");
  if (btnOverwrite) {
    btnOverwrite.addEventListener("click", async () => {
      const overwrittenId = await overwriteFromForm();
      if (overwrittenId) {
        window.dispatchEvent(new CustomEvent("wbs:saved-changed"));

        renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
        setSelectedId(overwrittenId);
        navigateTo("proxy", "http");

        renderSitemap();
      }
    });
  }

  const btnCopyPreview = byId("btn-copy-preview");
  if (btnCopyPreview) {
    btnCopyPreview.addEventListener("click", async () => {
      const pre = byId("req-preview");
      const text = pre?.textContent || "";
      if (!text || text === "—") return;

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore
      }
    });
  }

  // Update preview on form changes
  const update = () => updateRequestPreview(getExtenderConfig());
  ["req-method", "req-url", "req-body"].forEach((id) => {
    const el = byId(id);
    if (el) el.addEventListener("input", update);
    if (el) el.addEventListener("change", update);
  });

  window.addEventListener("wbs:headers-changed", update);
  window.addEventListener("wbs:extender-changed", update);
}

function wireRepeater() {
  byId("btn-refresh").addEventListener("click", () => {
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
  });

  byId("btn-clear").addEventListener("click", () => {
    clearAllSaved();
    window.dispatchEvent(new CustomEvent("wbs:saved-changed"));
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
    renderSitemap();
  });

  byId("btn-replay").addEventListener("click", async () => {
    const cfg = getExtenderConfig();
    await replaySelected(cfg);
  });
}

function wireReplayViewToggle() {
  const rawBtn = byId("view-raw");
  const diffBtn = byId("view-diff");
  const rawWrap = byId("replay-raw-wrap");
  const diffWrap = byId("replay-diff-wrap");

  function setView(view) {
    const isDiff = view === "diff";
    rawWrap.classList.toggle("is-hidden", isDiff);
    diffWrap.classList.toggle("is-hidden", !isDiff);

    rawBtn.classList.toggle("secondary", !isDiff);
    diffBtn.classList.toggle("secondary", isDiff);
  }

  rawBtn.addEventListener("click", () => setView("raw"));
  diffBtn.addEventListener("click", () => setView("diff"));

  setView("raw");
}

function bootstrap() {
  bindNavigation();
  bindExtenderControls();

  initHeaderEditor({
    defaults: { Accept: "application/json" },
  });

  wireHistoryFilters();
  wireInterceptor();
  wireRepeater();
  wireReplayViewToggle();

  // Target tab wiring
  bindScopeControls();
  bindSitemapControls();

  // Re-render scope-dependent UIs immediately on changes
  window.addEventListener("wbs:scope-changed", () => {
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
    renderSitemap();
  });

  renderSavedList({ onSelect: (sid) => setSelectedId(sid) });

  // initial preview render
  updateRequestPreview(getExtenderConfig());
}

bootstrap();
