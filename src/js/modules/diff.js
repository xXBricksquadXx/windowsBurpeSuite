function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
}

/**
 * Line-based LCS diff. Intentionally bounded to avoid UI freezes.
 * Returns HTML with spans suitable for a <pre>.
 */
export function diffLinesToHtml(prevText, nextText, { maxLines = 220 } = {}) {
  if (prevText == null || prevText === "") {
    return `<span class="diff-hint">No previous response to diff against. Replay the same request again.</span>`;
  }

  const a = splitLines(prevText);
  const b = splitLines(nextText);

  if (a.length > maxLines || b.length > maxLines) {
    return `<span class="diff-hint">Diff skipped (too many lines). Limit: ${maxLines} per side.</span>`;
  }

  const m = a.length;
  const n = b.length;

  // dp[i][j] = LCS length of a[0..i-1], b[0..j-1]
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const ops = [];
  let i = m,
    j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      ops.push({ t: "eq", line: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ t: "del", line: a[i - 1] });
      i--;
    } else {
      ops.push({ t: "add", line: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ t: "del", line: a[i - 1] });
    i--;
  }
  while (j > 0) {
    ops.push({ t: "add", line: b[j - 1] });
    j--;
  }

  ops.reverse();

  const out = ops.map((op) => {
    if (op.t === "add")
      return `<span class="diff-line diff-line--add">${esc(
        "+ " + op.line
      )}</span>`;
    if (op.t === "del")
      return `<span class="diff-line diff-line--del">${esc(
        "- " + op.line
      )}</span>`;
    return `<span class="diff-line diff-line--eq">${esc(
      "  " + op.line
    )}</span>`;
  });

  return out.join("\n");
}
