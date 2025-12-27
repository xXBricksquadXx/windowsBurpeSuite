import { bindTabs } from "./ui.js";
import { sendFromForm, saveCurrentToRepeater } from "./modules/interceptor.js";
import { renderSavedList, clearAllSaved, setSelectedId, replaySelected } from "./modules/repeater.js";
import { getExtenderConfig, bindExtenderControls } from "./modules/extender.js";

function byId(id) { return document.getElementById(id); }

function wireInterceptor() {
  byId("btn-send").addEventListener("click", async () => {
    const cfg = getExtenderConfig();
    await sendFromForm(cfg);
  });

  byId("btn-save").addEventListener("click", () => {
    const id = saveCurrentToRepeater();
    if (id) {
      // Nudge user to Repeater after save; lightweight UX.
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

function bootstrap() {
  bindTabs();
  bindExtenderControls();
  wireInterceptor();
  wireRepeater();
  renderSavedList({ onSelect: (selectedId) => setSelectedId(selectedId) });
}

bootstrap();
