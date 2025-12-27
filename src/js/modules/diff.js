export function diffText(a, b) {
  const aLines = (a ?? "").split("\n");
  const bLines = (b ?? "").split("\n");

  const out = [];
  const max = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < max; i++) {
    const al = aLines[i];
    const bl = bLines[i];

    if (al === bl) {
      out.push({ t: "eq", v: bl ?? "" });
      continue;
    }

    if (al == null && bl != null) {
      out.push({ t: "add", v: bl });
      continue;
    }

    if (bl == null && al != null) {
      out.push({ t: "del", v: al });
      continue;
    }

    out.push({ t: "del", v: al ?? "" });
    out.push({ t: "add", v: bl ?? "" });
  }

  return out;
}

export function renderDiff(lines) {
  const esc = (s) =>
    (s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  return (
    `<div class="diff">` +
    lines
      .map((l) => {
        if (l.t === "eq") return `<div class="diff-line">${esc(l.v)}</div>`;
        if (l.t === "add")
          return `<div class="diff-line add">+ ${esc(l.v)}</div>`;
        if (l.t === "del")
          return `<div class="diff-line del">- ${esc(l.v)}</div>`;
        return `<div class="diff-line">${esc(l.v)}</div>`;
      })
      .join("") +
    `</div>`
  );
}
