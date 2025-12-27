import { bindTabs } from "./ui.js";
import { sendFromForm, saveCurrentToRepeater } from "./modules/interceptor.js";
import {
  renderSavedList,
  clearAllSaved,
  setSelectedId,
  replaySelected,
} from "./modules/repeater.js";
import { getExtenderConfig, bindExtenderControls } from "./modules/extender.js";
import { initHeaderEditor } from "./modules/headersEditor.js";

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
      const repeaterTab = document.querySelector('.tab[data-tab="repeater"]');
      if (repeaterTab) repeaterTab.click();
      renderSavedList({ onSelect: (selectedId) => setSelectedId(selectedId) });
    }
  });
}

function wireRepeater() {
  byId("btn-refresh").addEventListener("click", () => {
    renderSavedList({ onSelect: (selectedId) => setSelectedId(selectedId) });
  });

  byId("btn-clear").addEventListener("click", () => {
    clearAllSaved();
    renderSavedList({ onSelect: (selectedId) => setSelectedId(selectedId) });
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
  bindTabs();
  bindExtenderControls();

  initHeaderEditor({
    defaults: { Accept: "application/json" },
  });

  wireInterceptor();
  wireRepeater();
  wireReplayViewToggle();

  renderSavedList({ onSelect: (selectedId) => setSelectedId(selectedId) });
}

bootstrap();
