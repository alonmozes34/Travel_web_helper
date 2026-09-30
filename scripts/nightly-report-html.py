#!/usr/bin/env python3
"""
Turns the nightly report (Markdown, from scripts/nightly.sh) into one HTML
page, which the nightly session publishes to the same private claude.ai
page every night — the owner's one place to see the result.

Why a page: the Routine's e-mail and push go out only when the platform
judges a run noteworthy, so a green night sent nothing and the owner saw no
report at all (30 September 2026).

    python3 scripts/nightly-report-html.py /tmp/nightly-report.md /tmp/nightly-report.html [summary.txt]

The optional summary file is a few lines in Hebrew from the nightly session:
what failed and why, in words. Without it, the page shows the steps only.
"""
import html
import re
import sys

src, out = sys.argv[1], sys.argv[2]
summary = open(sys.argv[3], encoding="utf-8").read().strip() if len(sys.argv) > 3 else ""
lines = open(src, encoding="utf-8").read().splitlines()

title = next((l[2:] for l in lines if l.startswith("# ")), "Nightly QA")
meta = [l for l in lines[:6] if l.startswith(("Commit:", "Live site:"))]
result_green = any("Result: all green" in l for l in lines)

sections, current, code, in_code = [], None, [], False
for line in lines:
    if line.startswith("```"):
        if in_code and current and current["steps"]:
            current["steps"][-1]["detail"] = "\n".join(code)
        in_code, code = not in_code, []
        continue
    if in_code:
        code.append(line)
        continue
    if line.startswith("## "):
        current = {"name": line[3:], "steps": [], "notes": []}
        sections.append(current)
    elif current is not None and line.startswith("- ✅ "):
        current["steps"].append({"ok": True, "name": line[4:], "detail": ""})
    elif current is not None and line.startswith("- ❌ "):
        current["steps"].append({"ok": False, "name": line[4:].split(" — ")[0], "detail": ""})
    elif current is not None and line.strip().startswith("- "):
        current["notes"].append(line.strip()[2:])

esc = html.escape
parts = []
for s in sections:
    rows = "".join(
        f'<li class="step {"ok" if st["ok"] else "bad"}"><span class="pill">{"תקין" if st["ok"] else "נכשל"}</span>'
        f'<span class="name">{esc(st["name"])}</span>'
        + (f'<pre dir="ltr">{esc(st["detail"])}</pre>' if st["detail"] else "")
        + "</li>"
        for st in s["steps"]
    )
    notes = "".join(f"<li>{esc(n)}</li>" for n in s["notes"])
    parts.append(
        f'<section><h2 dir="auto">{esc(s["name"])}</h2><ul class="steps">{rows}</ul>'
        + (f'<ul class="notes" dir="ltr">{notes}</ul>' if notes else "")
        + "</section>"
    )

page = f"""<title>בדיקה לילית — יש קליטה?</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap">
<style>
/* One column, newest night only: the verdict first, then each step. */
:root {{
  --bg: #f6f8fb; --surface: #ffffff; --ink: #14202e; --ink-2: #4a5a6c; --line: #dde4ec;
  --ok: #0f7a4a; --ok-bg: #e5f5ed; --bad: #b42318; --bad-bg: #fdecea; --accent: #0b6bd3;
  --font-body: "Assistant", "Segoe UI", Arial, sans-serif; --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #0f1620; --surface: #17212d; --ink: #e8eef5; --ink-2: #a5b3c3; --line: #2a3747;
  --ok: #4ccf8e; --ok-bg: #13301f; --bad: #ff8a80; --bad-bg: #3a1714; --accent: #6aa9f0; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --bg: #0f1620; --surface: #17212d; --ink: #e8eef5; --ink-2: #a5b3c3; --line: #2a3747;
  --ok: #4ccf8e; --ok-bg: #13301f; --bad: #ff8a80; --bad-bg: #3a1714; --accent: #6aa9f0; color-scheme: dark; }}
body {{ background: var(--bg); color: var(--ink); font: 17px/1.6 var(--font-body); padding-inline: 16px; padding-block: 24px 48px; }}
main {{ max-width: 760px; margin: 0 auto; display: grid; gap: 20px; }}
h1 {{ font-size: 1.7rem; margin: 0; text-wrap: balance; }}
h2 {{ font-size: 1.1rem; margin: 0 0 8px; }}
.meta {{ color: var(--ink-2); font-size: .95rem; margin: 4px 0 0; }}
.verdict {{ border-radius: 12px; padding: 16px 18px; font-weight: 700; font-size: 1.15rem; }}
.verdict.ok {{ background: var(--ok-bg); color: var(--ok); }}
.verdict.bad {{ background: var(--bad-bg); color: var(--bad); }}
.verdict.wait {{ background: var(--surface); border: 1px solid var(--line); color: var(--ink-2); }}
.summary {{ background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px 18px; white-space: pre-line; }}
section {{ background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px 18px; min-width: 0; }}
.steps, .notes {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }}
.step {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }}
.pill {{ font-size: .8rem; font-weight: 700; border-radius: 999px; padding: 1px 10px; letter-spacing: .02em; }}
.ok .pill {{ background: var(--ok-bg); color: var(--ok); }}
.bad .pill {{ background: var(--bad-bg); color: var(--bad); }}
.name {{ font-family: var(--font-mono); font-size: .9rem; }}
pre {{ flex-basis: 100%; margin: 4px 0 0; padding: 10px; background: var(--bg); border-radius: 8px; overflow-x: auto; font: 12px/1.5 var(--font-mono); color: var(--ink-2); }}
.notes {{ margin-top: 10px; color: var(--ink-2); font: 13px/1.5 var(--font-mono); }}
footer {{ color: var(--ink-2); font-size: .9rem; }}
</style>
<main dir="rtl">
  <header>
    <h1>בדיקה לילית — יש קליטה?</h1>
    <p class="meta" dir="ltr">{esc(title)}{" · " + " · ".join(esc(m) for m in meta) if meta else ""}</p>
  </header>
  <div class="verdict {"ok" if result_green else "wait" if not sections else "bad"}">{"הכול תקין" if result_green else "ממתין לבדיקה הראשונה" if not sections else "יש כשלים — הפרטים למטה"}</div>
  {f'<div class="summary">{esc(summary)}</div>' if summary else ""}
  {"".join(parts)}
  <footer>נוצר אוטומטית כל לילה ב־02:49. בדיקות הנגישות האוטומטיות תופסות רק חלק מהבעיות, ואינן בדיקה עם קורא מסך או של מורשה נגישות.</footer>
</main>
"""
open(out, "w", encoding="utf-8").write(page)
print(out)
