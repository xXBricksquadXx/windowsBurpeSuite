function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

export function bindTabs() {
  const tabs = qa(".tab");
  const panels = {
    interceptor: q("#panel-interceptor"),
    repeater: q("#panel-repeater"),
    extender: q("#panel-extender"),
  };

  function activate(name) {
    tabs.forEach(t => t.classList.toggle("is-active", t.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle("is-active", k === name);
    });
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => activate(t.dataset.tab));
  });

  activate("interceptor");
}
