const DATA_FILE = "lotr_revised.txt";
const LABEL_THRESHOLD = 3;
const FIXED_BAR_WIDTH = 55;
const SCORE_LEVEL_STEPS = 4;
const CHARACTER_LABELS = {
  "L&G": "Legolas and Gimli",
  "F&S": "Frodo and Sam",
  "M&P": "Merry and Pippin",
};

const PRESENCE_LABELS = {
  1: "None",
  2: "Mentioned",
  3: "Present",
  4: "Important",
  5: "Main focus",
};

const DEVELOPMENT_LABELS = {
  1: "None",
  2: "Minor",
  3: "Significant",
  4: "Major",
  5: "Climax",
};

const select = document.getElementById("character-select");
const timeline = document.getElementById("timeline");
const tooltip = document.getElementById("tooltip");

let chapters = [];
let books = [];
let characters = [];

init();

async function init() {
  try {
    const source = await loadSourceText(DATA_FILE);
    const parsed = parseChapterTable(source);
    chapters = parsed.chapters;
    books = parsed.books;
    characters = parsed.characters;

    populateCharacterSelect(characters);
    renderTimeline(select.value);
  } catch (error) {
    timeline.innerHTML = `<p class="error">Could not load ${DATA_FILE}: ${error.message}</p>`;
  }
}

async function loadSourceText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function parseChapterTable(text) {
  const lines = text.split(/\r?\n/);
  const parsedChapters = [];
  const bookNames = [];
  let headers = [];
  let currentBook = "Unknown Book";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const bookMatch = line.match(/^###\s+Book\s+(.+)$/i);
    if (bookMatch) {
      currentBook = `Book ${bookMatch[1].trim()}`;
      if (!bookNames.includes(currentBook)) {
        bookNames.push(currentBook);
      }
      headers = [];
      continue;
    }

    if (line.startsWith("| Chapter |")) {
      headers = splitMarkdownRow(line);
      continue;
    }

    if (!line.startsWith("|") || !headers.length || line.startsWith("|---------")) {
      continue;
    }

    const columns = splitMarkdownRow(line);
    if (columns.length !== headers.length) {
      continue;
    }

    const chapterName = columns[0];
    const summary = columns[headers.length - 1];
    const roles = {};

    for (let index = 1; index < headers.length - 1; index += 1) {
      const character = headers[index];
      const [presence, development] = parseScore(columns[index]);
      roles[character] = {
        presence,
        development,
        summary,
      };
    }

    parsedChapters.push({
      book: currentBook,
      chapter: chapterName,
      roles,
    });
  }

  const foundCharacters = parsedChapters.length
    ? Object.keys(parsedChapters[0].roles)
    : [];

  return {
    books: bookNames,
    chapters: parsedChapters,
    characters: foundCharacters,
  };
}

function splitMarkdownRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((value) => value.trim());
}

function parseScore(cell) {
  const match = cell.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) {
    return [0, 0];
  }

  return [Number.parseFloat(match[1]), Number.parseFloat(match[2])];
}

function populateCharacterSelect(names) {
  select.textContent = "";
  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = CHARACTER_LABELS[name] ?? name;
    select.append(option);
  });

  select.value = names[0] ?? "";
  select.addEventListener("change", (event) => {
    renderTimeline(event.target.value);
  });
}

function scoreNode(role) {
  return role.presence + role.development;
}

function scoreToFraction(score) {
  return Math.max(0, Math.min(1, (score - 1) / SCORE_LEVEL_STEPS));
}

function scoreLabel(score, labelMap) {
  return labelMap[Math.round(score)] ?? "Unknown";
}

function renderTimeline(character) {
  timeline.textContent = "";

  books.forEach((book) => {
    const bookRow = document.createElement("section");
    bookRow.className = "book-row";

    const bookLabel = document.createElement("h3");
    bookLabel.className = "book-label";
    bookLabel.textContent = book;

    const chapterStrip = document.createElement("div");
    chapterStrip.className = "chapter-strip";

    chapters
      .filter((entry) => entry.book === book)
      .forEach((entry, index) => {
        const role = entry.roles[character];
        const total = scoreNode(role);

        const wrap = document.createElement("article");
        wrap.className = "chapter-cell";

        const bar = document.createElement("button");
        bar.className = "metric-bar";
        bar.style.width = `${FIXED_BAR_WIDTH}px`;
        bar.setAttribute("aria-label", `${book} ${entry.chapter}: ${role.summary}`);

        const presencePart = document.createElement("span");
        presencePart.className = "metric";
        const presenceFill = document.createElement("span");
        presenceFill.className = "metric-fill metric-presence";
        presenceFill.style.height = `${scoreToFraction(role.presence) * 100}%`;
        presencePart.append(presenceFill);

        const developmentPart = document.createElement("span");
        developmentPart.className = "metric";
        const developmentFill = document.createElement("span");
        developmentFill.className = "metric-fill metric-development";
        developmentFill.style.height = `${scoreToFraction(role.development) * 100}%`;
        developmentPart.append(developmentFill);

        bar.append(presencePart, developmentPart);

        const label = document.createElement("div");
        label.className = "chapter-label";
        label.textContent = total > LABEL_THRESHOLD ? entry.chapter : "";
        const isLabelAbove = index % 2 === 0;

        const showTip = (event) => {
          updateTooltip(event, book, entry.chapter, character, role);
        };

        bar.addEventListener("mouseenter", showTip);
        bar.addEventListener("mousemove", showTip);
        bar.addEventListener("focus", (event) => {
          updateTooltip(event, book, entry.chapter, character, role, true);
        });
        bar.addEventListener("mouseleave", hideTooltip);
        bar.addEventListener("blur", hideTooltip);

        if (isLabelAbove) {
          wrap.append(label, bar);
        } else {
          wrap.append(bar, label);
        }
        chapterStrip.append(wrap);
      });

    bookRow.append(bookLabel, chapterStrip);
    timeline.append(bookRow);
  });
}

function updateTooltip(event, book, chapter, character, role, focusMode = false) {
  const presenceText = scoreLabel(role.presence, PRESENCE_LABELS);
  const developmentText = scoreLabel(role.development, DEVELOPMENT_LABELS);
  tooltip.hidden = false;
  tooltip.innerHTML = `
    <strong>${book} · ${chapter} · ${character}</strong><br />
    Presence: ${presenceText}<br />
    Development: ${developmentText}<br />
    ${role.summary}
  `;

  if (focusMode) {
    const rect = event.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
    return;
  }

  tooltip.style.left = `${event.pageX + 12}px`;
  tooltip.style.top = `${event.pageY + 12}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}
