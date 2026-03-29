const chapters = [
  {
    chapter: "Book 1 · Ch. 1 A Long-expected Party",
    roles: {
      Gandalf: {
        presence: 0.7,
        development: 0.3,
        role: "Arrives with fireworks, confronts Bilbo about the Ring, senses its evil influence, warns Bilbo to leave it behind.",
      },
      Aragorn: { presence: 0, development: 0, role: "Not present." },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 1 · Ch. 2 The Shadow of the Past",
    roles: {
      Gandalf: {
        presence: 0.9,
        development: 0.8,
        role: "Reveals the Ring's true nature and history, tells the story of Gollum, explains Sauron's return, and pushes Frodo toward the quest.",
      },
      Aragorn: { presence: 0, development: 0, role: "Not present." },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 1 · Ch. 10 Strider",
    roles: {
      Aragorn: {
        presence: 0.9,
        development: 0.6,
        role: "Introduced as mysterious Strider, proves identity, reveals himself as Aragorn son of Arathorn, and shows Narsil.",
      },
      Gandalf: { presence: 0.3, development: 0, role: "Appears only through Gandalf's letter." },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 1 · Ch. 11 A Knife in the Dark",
    roles: {
      Aragorn: {
        presence: 0.8,
        development: 0.2,
        role: "Leads hobbits through wilderness, showing tracking skill and Ranger experience.",
      },
      Gandalf: { presence: 0, development: 0, role: "Not present." },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 1 · Ch. 12 Flight to the Ford",
    roles: {
      Aragorn: {
        presence: 0.6,
        development: 0.1,
        role: "Helps carry Frodo, fights rearguard, demonstrates loyalty and courage.",
      },
      Gandalf: { presence: 0, development: 0, role: "Arrives only after Frodo crosses." },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 2 · Ch. 2 The Council of Elrond",
    roles: {
      Aragorn: {
        presence: 0.7,
        development: 0.7,
        role: "Revealed as Isildur's heir and accepts his destiny more openly.",
      },
      Gandalf: {
        presence: 0.9,
        development: 0.5,
        role: "Tells Saruman story in full, establishing himself as key mover of events.",
      },
      Legolas: {
        presence: 0.3,
        development: 0.1,
        role: "Introduced as messenger from Mirkwood with news of Gollum's escape.",
      },
      Gimli: {
        presence: 0.3,
        development: 0.1,
        role: "Introduced as dwarf representative with news from Erebor.",
      },
    },
  },
  {
    chapter: "Book 2 · Ch. 5 Bridge of Khazad-dûm",
    roles: {
      Gandalf: {
        presence: 0.9,
        development: 0.9,
        role: "Faces the Balrog, sacrifices himself, and sets up his death-rebirth turning point.",
      },
      Aragorn: {
        presence: 0.6,
        development: 0.3,
        role: "Takes leadership after Gandalf's fall and commands the retreat.",
      },
      Legolas: {
        presence: 0.4,
        development: 0.1,
        role: "Shoots at Balrog and identifies it as elf-bane.",
      },
      Gimli: {
        presence: 0.5,
        development: 0.2,
        role: "Fights fiercely and is devastated by Gandalf's loss.",
      },
    },
  },
  {
    chapter: "Book 2 · Ch. 7 Mirror of Galadriel",
    roles: {
      Aragorn: { presence: 0.2, development: 0, role: "Present but minor." },
      Gandalf: { presence: 0, development: 0, role: "Presumed dead." },
      Legolas: { presence: 0.1, development: 0, role: "Present but minor." },
      Gimli: {
        presence: 0.4,
        development: 0.6,
        role: "Critical pivot: transformed by Galadriel's kindness and becomes Elf-friend.",
      },
    },
  },
  {
    chapter: "Book 3 · Ch. 5 The White Rider",
    roles: {
      Gandalf: {
        presence: 0.9,
        development: 0.9,
        role: "Returns as Gandalf the White, explains his transformation, and resumes leadership.",
      },
      Aragorn: {
        presence: 0.5,
        development: 0.2,
        role: "Relieved by Gandalf's return and receives Galadriel's message.",
      },
      Legolas: {
        presence: 0.4,
        development: 0.1,
        role: "Greets Gandalf and hears prophecy tied to sea-longing.",
      },
      Gimli: {
        presence: 0.4,
        development: 0.1,
        role: "Mistakes Gandalf for Saruman, then rejoices at his return.",
      },
    },
  },
  {
    chapter: "Book 3 · Ch. 7 Helm's Deep",
    roles: {
      Aragorn: {
        presence: 0.7,
        development: 0.3,
        role: "Leads defense and demonstrates battlefield leadership.",
      },
      Gandalf: {
        presence: 0.4,
        development: 0.2,
        role: "Arrives at dawn and turns the tide with strategic timing.",
      },
      Legolas: {
        presence: 0.4,
        development: 0.2,
        role: "Competes with Gimli and showcases elf archery.",
      },
      Gimli: {
        presence: 0.4,
        development: 0.2,
        role: "Competes with Legolas and shows dwarf fighting prowess.",
      },
    },
  },
  {
    chapter: "Book 5 · Ch. 2 The Passing of the Grey Company",
    roles: {
      Aragorn: {
        presence: 0.8,
        development: 0.6,
        role: "Chooses the Paths of the Dead and embraces destiny as Isildur's heir.",
      },
      Gandalf: { presence: 0, development: 0, role: "Not present (in Minas Tirith)." },
      Legolas: {
        presence: 0.3,
        development: 0.1,
        role: "Follows Aragorn into the Paths and shows elf courage.",
      },
      Gimli: {
        presence: 0.3,
        development: 0.2,
        role: "Follows Aragorn despite fear, showing loyalty over terror.",
      },
    },
  },
  {
    chapter: "Book 5 · Ch. 6 The Battle of Pelennor Fields",
    roles: {
      Aragorn: {
        presence: 0.7,
        development: 0.5,
        role: "Arrives with the black fleet, swings battle outcome, and claims kingship by deed.",
      },
      Gandalf: {
        presence: 0.5,
        development: 0.2,
        role: "Defends the gate and holds the line before relief arrives.",
      },
      Legolas: { presence: 0.2, development: 0, role: "Fights in battle, mentioned with Gimli." },
      Gimli: { presence: 0.2, development: 0, role: "Fights in battle, mentioned with Legolas." },
    },
  },
  {
    chapter: "Book 6 · Ch. 5 The Steward and the King",
    roles: {
      Aragorn: {
        presence: 0.8,
        development: 0.5,
        role: "Crowned king, weds Arwen, plants White Tree, and completes his arc.",
      },
      Gandalf: {
        presence: 0.3,
        development: 0.1,
        role: "Places crown on Aragorn's head and marks the beginning of the new age.",
      },
      Legolas: { presence: 0, development: 0, role: "Not present." },
      Gimli: { presence: 0, development: 0, role: "Not present." },
    },
  },
  {
    chapter: "Book 6 · Ch. 6 Many Partings",
    roles: {
      Aragorn: {
        presence: 0.5,
        development: 0.2,
        role: "Bids farewell warmly and promises to visit the Shire.",
      },
      Gandalf: {
        presence: 0.4,
        development: 0.2,
        role: "Prepares for departure to the West in final conversations.",
      },
      Legolas: {
        presence: 0.3,
        development: 0.3,
        role: "Sea-longing intensifies and he plans to sail west with Gimli.",
      },
      Gimli: {
        presence: 0.3,
        development: 0.3,
        role: "Plans to go west with Legolas and completes his elf-friend transformation.",
      },
    },
  },
  {
    chapter: "Book 6 · Ch. 9 The Grey Havens",
    roles: {
      Gandalf: {
        presence: 0.8,
        development: 0.8,
        role: "Departs to the West with mission complete; final resolution of his arc.",
      },
      Aragorn: { presence: 0, development: 0, role: "Not present." },
      Legolas: {
        presence: 0.2,
        development: 0.2,
        role: "Departs with Gimli, completing his own westward arc.",
      },
      Gimli: {
        presence: 0.2,
        development: 0.2,
        role: "Departs with Legolas, final note of transformed friendship.",
      },
    },
  },
];

const characters = ["Gandalf", "Aragorn", "Legolas", "Gimli"];

const select = document.getElementById("character-select");
const timeline = document.getElementById("timeline");
const detailsTitle = document.getElementById("details-title");
const detailsCopy = document.getElementById("details-copy");

characters.forEach((name) => {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  select.append(option);
});

select.value = "Gandalf";
renderTimeline(select.value);

select.addEventListener("change", (event) => {
  renderTimeline(event.target.value);
  detailsTitle.textContent = "Hover a chapter node";
  detailsCopy.textContent =
    "Move your cursor over any node in the timeline to inspect that chapter's role for the selected character.";
});

function scoreNode(chapterRole) {
  return chapterRole.presence * chapterRole.development;
}

function nodeSize(score) {
  // Keeps zero-score chapters visible as tiny dots, while preserving contrast.
  return 12 + Math.round(score * 62);
}

function renderTimeline(character) {
  timeline.textContent = "";

  chapters.forEach((entry) => {
    const role = entry.roles[character];
    const score = scoreNode(role);
    const size = nodeSize(score);

    const wrap = document.createElement("article");
    wrap.className = "node-wrap";

    const node = document.createElement("button");
    node.className = "node";
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    node.setAttribute("aria-label", `${entry.chapter}: ${role.role}`);

    node.addEventListener("mouseenter", () => {
      updateDetails(entry.chapter, character, role, score);
    });

    node.addEventListener("focus", () => {
      updateDetails(entry.chapter, character, role, score);
    });

    const label = document.createElement("div");
    label.className = "node-label";
    label.textContent = entry.chapter;

    wrap.append(node, label);
    timeline.append(wrap);
  });
}

function updateDetails(chapter, character, role, score) {
  detailsTitle.textContent = `${chapter} · ${character}`;
  detailsCopy.textContent = `${role.role} (Presence ${role.presence.toFixed(1)}, development ${role.development.toFixed(1)}, score ${score.toFixed(2)}.)`;
}
