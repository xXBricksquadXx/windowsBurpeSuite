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
import { initScopeUI } from "./modules/scope.js";
import { initSitemapUI } from "./modules/sitemap.js";

function byId(id) {
  return document.getElementById(id);
}

function wireInterceptor() {
  byId("btn-send").addEventListener("click", async () => {
    const cfg = getExtenderConfig();
    await sendFromForm(cfg);
  });

  byId("btn-save").addEventListener("click", () => {
    const id = saveCurrentToRepeater();
    if (id) {
      navigateTo("proxy", "http");
      renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
    }
  });

  const btnOverwrite = byId("btn-overwrite");
  if (btnOverwrite) {
    btnOverwrite.addEventListener("click", async () => {
      const overwrittenId = await overwriteFromForm();
      if (overwrittenId) {
        renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
        setSelectedId(overwrittenId);
        navigateTo("proxy", "http");
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
      } catch {}
    });
  }

  // Update preview on form changes
  const update = () => updateRequestPreview(getExtenderConfig());
  ["req-method", "req-url", "req-body"].forEach((id) => {
    const el = byId(id);
    if (el) el.addEventListener("input", update);
    if (el) el.addEventListener("change", update);
  });

  // If you later emit these events, preview will update without extra wiring
  window.addEventListener("wbs:headers-changed", update);
  window.addEventListener("wbs:extender-changed", update);
}

function wireRepeater() {
  byId("btn-refresh").addEventListener("click", () => {
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
  });

  byId("btn-clear").addEventListener("click", () => {
    clearAllSaved();
    renderSavedList({ onSelect: (sid) => setSelectedId(sid) });
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

  // Target tab wiring
  initScopeUI();
  initSitemapUI();

  wireInterceptor();
  wireRepeater();
  wireReplayViewToggle();

  renderSavedList({ onSelect: (sid) => setSelectedId(sid) });

  // initial preview render
  updateRequestPreview(getExtenderConfig());
}

bootstrap();
