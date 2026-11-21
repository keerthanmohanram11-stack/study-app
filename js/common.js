// ========== SAVE & LOAD (browser storage) ==========
const Store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) {}
  }
};

// ========== STUDENT PROFILE (their choices) ==========
const DEFAULT_PROFILE = {
  name: "",
  level: "Everyone",
  expert: "General tutor",
  personality: "Friendly buddy",
  styles: ["Step by step", "Real-life examples"],
  theme: "dark",
  speak: false
};

function getProfile() {
  return Object.assign({}, DEFAULT_PROFILE, Store.get("profile", {}));
}
function saveProfile(profile) {
  Store.set("profile", profile);
}

// Dark or light mode
function applyTheme() {
  document.documentElement.dataset.theme = getProfile().theme;
}
applyTheme();

// ========== TALK TO THE AI ==========
// Builds the AI's instructions from the student's choices
function buildSystemPrompt() {
  const p = getProfile();
  return "You are StudyBuddy, an AI " + p.expert + " helping a student (" + p.level + "). " +
    "Your personality: " + p.personality + ". " +
    "Teaching style: " + p.styles.join(", ") + ". " +
    "Keep answers clear, friendly and well organised, with short paragraphs.";
}

async function askAI(prompt, image = null, json = false) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt, image: image, json: json, system: buildSystemPrompt() })
  });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error("The AI server didn't answer. Please try again.");
  }
  if (!res.ok) throw new Error(data.reply || "Something went wrong");
  return data.reply;
}

// Makes AI text safe to show, with bold, bullets and new lines
function formatText(text) {
  let t = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  t = t.replace(/^#{1,4}\s+(.*)$/gm, "<b>$1</b>");
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  t = t.replace(/^\s*[\*\-]\s+/gm, "• ");
  return t.replace(/\n/g, "<br>");
}

// ========== XP, LEVELS, STREAKS, ACTIVITY ==========
function dayKey(daysAgo = 0) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getStats() {
  return Object.assign({ xp: 0, streak: 0, lastDay: "", activity: {} }, Store.get("stats", {}));
}

// Call this whenever the student learns something
function addXP(amount) {
  const s = getStats();
  s.xp += amount;
  s.activity[dayKey()] = (s.activity[dayKey()] || 0) + 1;
  if (s.lastDay !== dayKey()) {
    s.streak = s.lastDay === dayKey(1) ? s.streak + 1 : 1;
    s.lastDay = dayKey();
  }
  Store.set("stats", s);
  return s;
}

function levelInfo(xp) {
  return { level: Math.floor(xp / 100) + 1, progress: xp % 100 };
}

// ========== TOPIC TRACKER (strong & weak topics) ==========
function getTopics() {
  return Store.get("topics", {});
}
function saveTopicResult(topic, subject, correct, total) {
  const topics = getTopics();
  const t = topics[topic] || { subject: subject || "General", correct: 0, total: 0 };
  t.correct += correct;
  t.total += total;
  topics[topic] = t;
  Store.set("topics", topics);
}
// Topics under 60% correct, weakest first
function getWeakTopics() {
  const topics = getTopics();
  return Object.keys(topics)
    .map(name => ({ name: name, score: Math.round(topics[name].correct / topics[name].total * 100) }))
    .filter(t => t.score < 60)
    .sort((a, b) => a.score - b.score);
}

// ========== PICKABLE BUTTONS (used on welcome & settings) ==========
function setupChoices(boxId, selected, multi) {
  const buttons = document.querySelectorAll("#" + boxId + " button[data-value]");
  let current = multi ? selected.slice() : selected;
  function paint() {
    buttons.forEach(b => {
      const on = multi ? current.includes(b.dataset.value) : current === b.dataset.value;
      b.classList.toggle("selected", on);
      b.setAttribute("aria-pressed", on);
    });
  }
  buttons.forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.value;
    if (multi) current = current.includes(v) ? current.filter(x => x !== v) : current.concat(v);
    else current = v;
    paint();
  }));
  paint();
  return () => current;
}