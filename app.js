const BOOKS = {
  effi: {
    label: "Effi Briest",
    file: "data/Effi_Briest.txt",
  },
  rider: {
    label: "The Rider on the White Horse",
    file: "data/The_Rider_on_the_White_Horse.txt",
  },
};
const DEFAULT_BOOK = "effi";

const timeline = document.getElementById("timeline");
const phaseRows = document.getElementById("phase-rows");
const infoGrid = document.getElementById("info-grid");
const closeAllButton = document.getElementById("close-all-tooltips");
const popupLayer = document.getElementById("popup-layer");
const titleHelpButton = document.getElementById("title-help");
const bookSelect = document.getElementById("book-select");

const chapterToNode = new Map();
const popupStack = [];

let model = {
  infoboxes: [],
  phases: [],
  chapters: [],
  glossary: [],
  glossaryMap: new Map(),
  termPatterns: [],
  foreshadowing: [],
  foreshadowingMap: new Map(),
};

const CATEGORY_LEGEND = [
  { key: "exp", label: "Exposition" },
  { key: "comp", label: "Complication" },
  { key: "int", label: "Introspection" },
  { key: "turn", label: "Turning point" },
  { key: "res", label: "Resolution" },
  { key: "dig", label: "Digression" },
];

init();

async function init() {
  wirePopupControls();
  bookSelect.value = DEFAULT_BOOK;
  bookSelect.addEventListener("change", async () => {
    await loadSelectedBook(bookSelect.value);
  });
  await loadSelectedBook(DEFAULT_BOOK);
}

async function loadSelectedBook(bookKey) {
  const selected = BOOKS[bookKey] || BOOKS[DEFAULT_BOOK];

  try {
    const source = await loadSourceText(selected.file);
    model = parseBookData(source);
    infoGrid.innerHTML = "";
    chapterToNode.clear();
    closeAllPopups();
    renderInfoboxes();
    renderTimeline();
  } catch (error) {
    timeline.innerHTML = `<p class="error">Could not load ${selected.file}: ${error.message}</p>`;
  }
}

async function loadSourceText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function parseBookData(text) {
  const lines = text.split(/\r?\n/);
  const infoboxes = parseInfoboxes(lines);
  const phases = parsePhases(lines);
  const chapters = parseChapters(lines);
  const foreshadowing = parseForeshadowing(lines);
  const glossary = parseGlossary(lines);

  const glossaryMap = new Map(glossary.map((entry) => [entry.name, entry]));
  const termPatterns = buildTermPatterns(glossary);
  const foreshadowingMap = new Map(foreshadowing.map((entry) => [entry.title, entry]));
  if (foreshadowing.length && !infoboxes.some((box) => box.label === "Foreshadowing")) {
    infoboxes.push({ label: "Foreshadowing", content: "" });
  }

  return {
    infoboxes,
    phases,
    chapters,
    glossary,
    glossaryMap,
    termPatterns,
    foreshadowing,
    foreshadowingMap,
  };
}

function parseInfoboxes(lines) {
  const labels = ["Summary", "Author", "Importance", "Themes", "Message", "Foreshadowing"];
  const out = [];

  for (const label of labels) {
    const headerIndex = lines.findIndex((line) => line.trim() === `**${label}**` || line.trim() === `**${label}**  `);
    if (headerIndex === -1) continue;

    const body = [];
    for (let i = headerIndex + 1; i < lines.length; i += 1) {
      const current = lines[i];
      const trimmed = current.trim();

      if (labels.some((name) => trimmed === `**${name}**` || trimmed === `**${name}**  `)) {
        break;
      }
      if (trimmed === "## Phases") {
        break;
      }
      body.push(current);
    }

    out.push({ label, content: body.join("\n").trim() });
  }

  return out;
}

function parseForeshadowing(lines) {
  const headerIndex = lines.findIndex((line) => /^###\s*3\.\s*Foreshadowing in\s*\*/.test(line.trim()));
  if (headerIndex === -1) return [];

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("## Glossary")) break;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) continue;
    if (cells[0].toLowerCase() === "title") continue;

    const title = cells[0].replace(/^\*\*(.+)\*\*$/, "$1").trim();
    const description = cells[1].trim();
    const appearances = cells.slice(2).join(" | ").trim();
    rows.push({
      title,
      description,
      appearances,
      chapterSet: parseAppearances(appearances),
      marker: buildForeshadowingMarker(title),
    });
  }

  return rows;
}

function buildForeshadowingMarker(title) {
  const words = (title.toUpperCase().match(/[A-Z0-9]+/g) || []).filter(Boolean);
  if (!words.length) return "?";

  const significantWords = words.filter((word) => !["THE", "A", "AN"].includes(word));
  const sourceWords = significantWords.length ? significantWords : words;

  if (sourceWords.length === 1) {
    return sourceWords[0].slice(0, Math.min(2, sourceWords[0].length));
  }

  return `${sourceWords[0][0]}${sourceWords[1][0]}`;
}

function parsePhases(lines) {
  const phases = [];
  const phaseRegex = /^\|\s*\*\*(Phase\s+\d+):\s*([^*]+)\*\*\s*\|\s*(.+)\|$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(phaseRegex);
    if (!match) continue;

    phases.push({
      phase: match[1],
      name: match[2].trim(),
      description: match[3].trim(),
    });
  }

  return phases;
}

function parseChapters(lines) {
  const chapters = [];
  let inChapterSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "## Chapter-by-Chapter Table") {
      inChapterSection = true;
      continue;
    }
    if (!inChapterSection) continue;
    if (trimmed.startsWith("## ") && trimmed !== "## Chapter-by-Chapter Table") break;
    if (!trimmed.startsWith("|")) continue;
    if (/^\|\s*-+/.test(trimmed)) continue;

    const cells = trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 4) continue;

    const first = (cells[0] ?? "").toLowerCase();
    if (first === "chapter" || first === "ch") continue;

    if (cells.length >= 5) {
      const [chapter, title, phase, category, ...summaryParts] = cells;
      chapters.push({
        chapter,
        title,
        phase,
        category,
        summary: summaryParts.join(" | ").trim(),
      });
      continue;
    }

    const [chapter, phase, category, ...summaryParts] = cells;
    chapters.push({
      chapter,
      title: chapter,
      phase,
      category,
      summary: summaryParts.join(" | ").trim(),
    });
  }

  return chapters;
}

function parseGlossary(lines) {
  const glossaryStart = lines.findIndex((line) => line.trim() === "## Glossary");
  if (glossaryStart === -1) return [];

  const entries = [];
  let i = glossaryStart + 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    const canonicalMatch = line.match(/^\*\*(.+)\*\*$/);

    if (!canonicalMatch) {
      i += 1;
      continue;
    }

    const name = canonicalMatch[1].trim();
    let representations = [];
    let explanation = "";
    let seeAlso = [];
    let appearances = "";

    i += 1;
    while (i < lines.length) {
      const detail = lines[i].trim();
      if (!detail) {
        i += 1;
        continue;
      }
      if (detail.startsWith("**") && detail.endsWith("**")) {
        break;
      }
      if (detail.startsWith("### ")) {
        break;
      }

      if (detail.startsWith("*Representations:*")) {
        representations = detail
          .replace("*Representations:*", "")
          .split(",")
          .map((term) => term.trim())
          .filter(Boolean);
      } else if (detail.startsWith("*Explanation:*")) {
        explanation = detail.replace("*Explanation:*", "").trim();
      } else if (detail.startsWith("*See also:*")) {
        seeAlso = detail
          .replace("*See also:*", "")
          .split(",")
          .map((term) => term.trim())
          .filter(Boolean);
      } else if (detail.startsWith("*Appearances:*")) {
        appearances = detail.replace("*Appearances:*", "").trim();
      }
      i += 1;
    }

    entries.push({
      name,
      representations,
      explanation,
      seeAlso,
      appearances,
      chapterSet: parseAppearances(appearances),
    });
  }

  return entries;
}

function parseAppearances(text) {
  const chapterSet = new Set();
  const raw = text.replace(/\(.*?\)/g, "").trim();

  if (/all chapters/i.test(raw)) {
    const all = [
      "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
      "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI",
    ];
    all.forEach((chapter) => chapterSet.add(chapter));
    return chapterSet;
  }

  const tokens = raw.split(/,\s*/).filter(Boolean);
  for (const token of tokens) {
    const rangeMatch = token.match(/^([IVXLCDM]+)\s*[-–]\s*([IVXLCDM]+)$/i);
    if (rangeMatch) {
      expandRomanRange(rangeMatch[1], rangeMatch[2]).forEach((chapter) => chapterSet.add(chapter));
      continue;
    }

    const direct = token.match(/^([IVXLCDM]+)$/i);
    if (direct) {
      chapterSet.add(direct[1].toUpperCase());
    }
  }

  return chapterSet;
}

function expandRomanRange(startRoman, endRoman) {
  const start = romanToInt(startRoman.toUpperCase());
  const end = romanToInt(endRoman.toUpperCase());
  if (!start || !end || end < start) return [];

  const result = [];
  for (let i = start; i <= end; i += 1) {
    result.push(intToRoman(i));
  }
  return result;
}

function romanToInt(roman) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i -= 1) {
    const current = values[roman[i]] ?? 0;
    if (current < prev) total -= current;
    else total += current;
    prev = current;
  }
  return total;
}

function intToRoman(num) {
  const mapping = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];

  let n = num;
  let result = "";
  for (const [value, symbol] of mapping) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function buildTermPatterns(glossary) {
  const terms = [];
  for (const entry of glossary) {
    const all = [entry.name, ...entry.representations].filter(Boolean);
    for (const rawTerm of all) {
      const term = rawTerm.trim();
      if (!term) continue;
      terms.push({
        term,
        canonical: entry.name,
      });
    }
  }

  const dedup = new Map();
  for (const item of terms) {
    const key = item.term.toLowerCase();
    if (!dedup.has(key) || item.term.length > dedup.get(key).term.length) {
      dedup.set(key, item);
    }
  }

  return [...dedup.values()].sort((a, b) => b.term.length - a.term.length);
}

function renderInfoboxes() {
  infoGrid.textContent = "";
  const summary = model.infoboxes.find((box) => box.label === "Summary");
  if (!summary) return;

  const card = document.createElement("article");
  card.className = "info-card";

  const heading = document.createElement("h3");
  heading.textContent = summary.label;

  const body = document.createElement("div");
  body.className = "rich-text";
  body.append(renderRichText(summary.content));

  const otherLinks = model.infoboxes.filter((box) => box.label !== "Summary");
  if (otherLinks.length) {
    const linksWrap = document.createElement("p");
    linksWrap.className = "summary-links";
    otherLinks.forEach((box) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = box.label;
      button.addEventListener("click", (event) => {
        if (box.label === "Foreshadowing") {
          openForeshadowingListPopup(event.currentTarget);
          return;
        }
        openInfoPopup(box.label, box.content, event.currentTarget);
      });
      linksWrap.append(button);
    });
    body.append(linksWrap);
  }

  const summaryLayout = document.createElement("div");
  summaryLayout.className = "summary-layout";
  summaryLayout.append(body, buildLegend());

  card.append(heading, summaryLayout);
  infoGrid.append(card);
}

function buildLegend() {
  const aside = document.createElement("aside");
  aside.className = "legend";
  aside.setAttribute("aria-label", "Chapter category legend");

  const list = document.createElement("ul");
  CATEGORY_LEGEND.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="legend-swatch legend-${item.key}"></span> ${item.label}`;
    list.append(li);
  });

  aside.append(list);
  return aside;
}

function renderTimeline() {
  phaseRows.textContent = "";
  chapterToNode.clear();

  model.phases.forEach((phaseItem) => {
    const row = document.createElement("section");
    row.className = "phase-row";

    const phaseLabel = document.createElement("button");
    phaseLabel.className = "phase-label";
    phaseLabel.type = "button";
    phaseLabel.innerHTML = `<span class="phase-label-phase">${phaseItem.phase}</span><span class="phase-label-name">${phaseItem.name}</span>`;
    phaseLabel.title = `Phase: ${phaseItem.description}`;
    phaseLabel.addEventListener("click", (event) => {
      openInfoPopup(
        `${phaseItem.phase}: ${phaseItem.name}`,
        phaseItem.description,
        event.currentTarget,
      );
    });

    const chaptersWrap = document.createElement("div");
    chaptersWrap.className = "chapter-strips";
    const strip = document.createElement("div");
    strip.className = "chapter-strip";
    chaptersWrap.append(strip);

    const phaseChapters = model.chapters.filter((chapter) => chapter.phase === phaseItem.phase);
    if (phaseItem.phase === "Phase 2" && phaseChapters.length > 1) {
      strip.classList.add("chapter-strip-split");
      const secondStrip = document.createElement("div");
      secondStrip.className = "chapter-strip chapter-strip-split";
      chaptersWrap.append(secondStrip);

      const splitIndex = Math.ceil(phaseChapters.length / 2);
      phaseChapters.forEach((chapter, index) => {
        const targetStrip = index < splitIndex ? strip : secondStrip;
        const node = buildChapterNode(chapter);
        targetStrip.append(node);
        chapterToNode.set(chapter.chapter, node);
      });
    } else {
      phaseChapters.forEach((chapter) => {
        const node = buildChapterNode(chapter);
        strip.append(node);
        chapterToNode.set(chapter.chapter, node);
      });
    }

    row.append(phaseLabel, chaptersWrap);
    phaseRows.append(row);
  });
}

function buildChapterNode(chapter) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "chapter-node";
  node.dataset.category = chapter.category.toLowerCase();
  node.dataset.chapter = chapter.chapter;
  node.title = `Chapter ${chapter.chapter}: ${chapter.summary}`;

  const title = document.createElement("span");
  title.className = "chapter-title";
  title.textContent = chapter.title;
  node.append(title);
  const markers = buildForeshadowingMarkers(chapter.chapter);
  if (markers) node.append(markers);

  node.addEventListener("click", (event) => {
    openInfoPopup(
      `${chapter.chapter} · ${chapter.category}`,
      chapter.summary,
      event.currentTarget,
    );
  });

  return node;
}

function buildForeshadowingMarkers(chapterId) {
  const matches = model.foreshadowing.filter((entry) => entry.chapterSet.has(chapterId));
  if (!matches.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "foreshadowing-markers";

  matches.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "foreshadowing-marker";
    button.style.backgroundColor = markerColor(index);
    button.textContent = entry.marker;
    button.title = entry.title;
    button.setAttribute("aria-label", `Foreshadowing: ${entry.title}`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openForeshadowingPopup(entry.title, event.currentTarget);
    });
    wrap.append(button);
  });

  return wrap;
}

function markerColor(index) {
  const palette = ["#1f2438", "#3f2c6d", "#66323f", "#2d5f4f", "#5f4a2a", "#4a315f", "#2a5a73", "#6a3b20", "#7a2e4f", "#3a517a"];
  return palette[index % palette.length];
}

function wirePopupControls() {
  titleHelpButton.addEventListener("click", (event) => {
    openInfoPopup(
      "About this view",
      "Interactive chapter map for the selected script. Click phases and chapters to open persistent info cards. Click glossary terms to open nested tooltips, then use chapter highlighting and close controls to navigate.",
      event.currentTarget,
    );
  });

  closeAllButton.addEventListener("click", () => {
    closeAllPopups();
  });

  document.addEventListener("click", (event) => {
    if (!popupStack.length) return;
    const latest = popupStack[popupStack.length - 1];
    if (latest.contains(event.target)) return;
    if (event.target.closest(".glossary-link")) return;
    if (event.target.closest(".chapter-node") || event.target.closest(".phase-label")) return;
    if (event.target.closest("#title-help")) return;
    if (event.target.closest(".summary-links")) return;
    if (event.target.closest("#close-all-tooltips")) return;

    closeTopPopup();
  });

  window.addEventListener("resize", () => {
    if (popupStack.length) layoutPopups();
  });
}

function openInfoPopup(title, content, anchor) {
  const popup = buildPopup(title, content);
  popupLayer.append(popup);
  popupStack.push(popup);
  refreshGlossaryPopupActiveState();
  layoutPopups(anchor);
  refreshChapterHighlights();
}

function buildPopup(title, content) {
  const popup = document.createElement("article");
  popup.className = "popup";

  const heading = document.createElement("h4");
  heading.textContent = title;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "popup-close";
  closeButton.setAttribute("aria-label", "Close this");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    closeSpecificPopup(popup);
  });

  const body = document.createElement("div");
  body.className = "popup-body rich-text";
  body.append(renderRichText(content));

  popup.append(closeButton, heading, body);
  return popup;
}

function renderRichText(text) {
  const fragment = document.createDocumentFragment();
  const blocks = text.split(/\n{2,}/).filter(Boolean);

  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("- ")) {
      const ul = document.createElement("ul");
      trimmed
        .split("\n")
        .map((line) => stripSimpleMarkdown(line.replace(/^-\s*/, "").trim()))
        .filter(Boolean)
        .forEach((item) => {
          const li = document.createElement("li");
          li.append(...linkGlossaryTerms(item));
          ul.append(li);
        });
      fragment.append(ul);
      return;
    }

    const p = document.createElement("p");
    trimmed.split("\n").forEach((line, index) => {
      if (index > 0) p.append(document.createElement("br"));
      p.append(...linkGlossaryTerms(stripSimpleMarkdown(line)));
    });
    fragment.append(p);
  });

  return fragment;
}

function stripSimpleMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1");
}

function linkGlossaryTerms(text) {
  const nodes = [];
  let cursor = 0;
  const matches = [];

  for (const pattern of model.termPatterns) {
    const escaped = escapeRegex(pattern.term);
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    let match = regex.exec(text);
    while (match) {
      matches.push({ start: match.index, end: match.index + match[0].length, text: match[0], canonical: pattern.canonical });
      match = regex.exec(text);
    }
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const accepted = [];
  for (const candidate of matches) {
    const overlap = accepted.some((item) => !(candidate.end <= item.start || candidate.start >= item.end));
    if (!overlap) accepted.push(candidate);
  }

  accepted.sort((a, b) => a.start - b.start);

  for (const token of accepted) {
    if (token.start > cursor) {
      nodes.push(document.createTextNode(text.slice(cursor, token.start)));
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "glossary-link";
    button.textContent = token.text;
    const entry = model.glossaryMap.get(token.canonical);
    if (entry?.explanation) {
      button.title = `Hyperlink: ${entry.explanation}`;
    }
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openGlossaryPopup(token.canonical, event.currentTarget);
    });

    nodes.push(button);
    cursor = token.end;
  }

  if (cursor < text.length) {
    nodes.push(document.createTextNode(text.slice(cursor)));
  }

  return nodes.length ? nodes : [document.createTextNode(text)];
}

function openGlossaryPopup(canonical, anchor) {
  const entry = model.glossaryMap.get(canonical);
  if (!entry) return;

  const popup = document.createElement("article");
  popup.className = "popup glossary-popup";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "popup-close";
  closeButton.setAttribute("aria-label", "Close this");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    closeSpecificPopup(popup);
  });

  const heading = document.createElement("h4");
  heading.textContent = entry.name;

  const body = document.createElement("div");
  body.className = "popup-body rich-text";

  const expl = document.createElement("p");
  expl.innerHTML = "<strong>Explanation:</strong> ";
  expl.append(...linkGlossaryTerms(entry.explanation));

  const appears = document.createElement("p");
  appears.textContent = `Appears in: ${entry.appearances}`;

  body.append(expl);
  if (entry.seeAlso.length) {
    const see = document.createElement("p");
    see.innerHTML = "<strong>See also:</strong> ";
    see.append(...linkGlossaryTerms(entry.seeAlso.join(", ")));
    body.append(see);
  }
  body.append(appears);
  popup.append(closeButton, heading, body);
  popup.dataset.highlightChapters = JSON.stringify([...entry.chapterSet]);
  popupLayer.append(popup);
  popupStack.push(popup);
  refreshGlossaryPopupActiveState();
  layoutPopups(anchor);
  refreshChapterHighlights();
}

function openForeshadowingListPopup(anchor) {
  const popup = document.createElement("article");
  popup.className = "popup";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "popup-close";
  closeButton.setAttribute("aria-label", "Close this");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => closeSpecificPopup(popup));

  const heading = document.createElement("h4");
  heading.textContent = "Foreshadowing";

  const body = document.createElement("div");
  body.className = "popup-body rich-text foreshadowing-list";

  const list = document.createElement("ul");
  model.foreshadowing.forEach((entry) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "glossary-link";
    button.textContent = entry.title;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openForeshadowingPopup(entry.title, event.currentTarget);
    });
    li.append(button);
    list.append(li);
  });
  body.append(list);

  popup.append(closeButton, heading, body);
  popupLayer.append(popup);
  popupStack.push(popup);
  refreshGlossaryPopupActiveState();
  layoutPopups(anchor);
  refreshChapterHighlights();
}

function openForeshadowingPopup(title, anchor) {
  const entry = model.foreshadowingMap.get(title);
  if (!entry) return;

  const popup = document.createElement("article");
  popup.className = "popup glossary-popup";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "popup-close";
  closeButton.setAttribute("aria-label", "Close this");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => closeSpecificPopup(popup));

  const heading = document.createElement("h4");
  heading.textContent = entry.title;

  const body = document.createElement("div");
  body.className = "popup-body rich-text";
  const expl = document.createElement("p");
  expl.innerHTML = "<strong>Description:</strong> ";
  expl.append(...linkGlossaryTerms(entry.description));
  const appears = document.createElement("p");
  appears.textContent = `Appears in: ${entry.appearances}`;
  body.append(expl, appears);

  popup.dataset.highlightChapters = JSON.stringify([...entry.chapterSet]);
  popup.append(closeButton, heading, body);
  popupLayer.append(popup);
  popupStack.push(popup);
  refreshGlossaryPopupActiveState();
  layoutPopups(anchor);
  refreshChapterHighlights();
}

function closeTopPopup() {
  const popup = popupStack.pop();
  if (!popup) return;
  popup.remove();
  refreshGlossaryPopupActiveState();
  layoutPopups();
  refreshChapterHighlights();
}

function closeSpecificPopup(target) {
  const index = popupStack.indexOf(target);
  if (index !== -1) popupStack.splice(index, 1);
  target.remove();
  refreshGlossaryPopupActiveState();
  layoutPopups();
  refreshChapterHighlights();
}

function closeAllPopups() {
  while (popupStack.length) {
    popupStack.pop().remove();
  }
  refreshGlossaryPopupActiveState();
  layoutPopups();
  refreshChapterHighlights();
}

function refreshGlossaryPopupActiveState() {
  popupStack.forEach((popup) => popup.classList.remove("popup-highlight"));
  const newest = popupStack[popupStack.length - 1];
  if (newest?.classList.contains("glossary-popup")) {
    newest.classList.add("popup-highlight");
  }
}

function refreshChapterHighlights() {
  const highlightedPopup = [...popupStack].reverse().find((node) => node.dataset.highlightChapters);
  if (!highlightedPopup) {
    highlightChapters(new Set());
    return;
  }
  const chapters = JSON.parse(highlightedPopup.dataset.highlightChapters ?? "[]");
  highlightChapters(new Set(chapters));
}

function highlightChapters(chapterSet) {
  chapterToNode.forEach((node, chapter) => {
    if (chapterSet.has(chapter)) {
      node.classList.add("chapter-highlight");
    } else {
      node.classList.remove("chapter-highlight");
    }
  });
}

function layoutPopups() {
  const leftPopups = popupStack.slice(0, -1);
  const newest = popupStack[popupStack.length - 1];
  const gutter = 14;
  const layerWidth = popupLayer.clientWidth;
  const columnWidth = Math.max(260, (layerWidth - gutter) / 2);
  const rightX = layerWidth - columnWidth;

  popupStack.forEach((popup) => {
    popup.style.width = `${columnWidth}px`;
  });

  let leftY = 8;
  [...leftPopups].reverse().forEach((popup, index) => {
    popup.style.left = "0px";
    popup.style.top = `${leftY}px`;
    popup.style.zIndex = `${150 + index}`;
    leftY += popup.offsetHeight + 8;
  });

  if (newest) {
    newest.style.left = `${rightX}px`;
    newest.style.top = "8px";
    newest.style.zIndex = "300";
  }

  const leftHeight = leftY + 8;
  const rightHeight = newest ? newest.offsetHeight + 24 : 0;
  popupLayer.style.minHeight = `${Math.max(220, leftHeight, rightHeight)}px`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
