const stats = getStats();
const topics = getTopics();

// ========== NUMBERS ==========
const streakNow = (stats.lastDay === dayKey() || stats.lastDay === dayKey(1)) ? stats.streak : 0;
let answered = 0;
Object.values(topics).forEach(t => { answered += t.total; });

document.getElementById("level").textContent = levelInfo(stats.xp).level;
document.getElementById("xp").textContent = stats.xp;
document.getElementById("streak").textContent = streakNow + " 🔥";
document.getElementById("answered").textContent = answered;

// Chart colours that work in dark and light mode
const css = getComputedStyle(document.documentElement);
const textColor = css.getPropertyValue("--muted").trim();
const gridColor = css.getPropertyValue("--border").trim();

function chartOptions(maxY) {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor }, grid: { display: false } },
      y: { beginAtZero: true, max: maxY, ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } }
    }
  };
}

// ========== CHART 1: SCORE BY SUBJECT ==========
const subjects = {};
Object.values(topics).forEach(t => {
  const s = subjects[t.subject] || { correct: 0, total: 0 };
  s.correct += t.correct;
  s.total += t.total;
  subjects[t.subject] = s;
});
const subjectNames = Object.keys(subjects);

if (subjectNames.length > 0 && window.Chart) {
  document.getElementById("subjectEmpty").style.display = "none";
  const scores = subjectNames.map(n => Math.round(subjects[n].correct / subjects[n].total * 100));
  new Chart(document.getElementById("subjectChart"), {
    type: "bar",
    data: {
      labels: subjectNames,
      datasets: [{
        data: scores,
        backgroundColor: scores.map(s => s >= 60 ? "#A6E4FF" : "#FFC2E0"),
        borderRadius: 10
      }]
    },
    options: chartOptions(100)
  });
} else {
  document.getElementById("subjectChart").style.display = "none";
}

// ========== CHART 2: ACTIVITY (LAST 7 DAYS) ==========
const dayNames = [];
const counts = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(Date.now() - i * 86400000);
  dayNames.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
  counts.push(stats.activity[dayKey(i)] || 0);
}
if (window.Chart) new Chart(document.getElementById("activityChart"), {
  type: "bar",
  data: {
    labels: dayNames,
    datasets: [{ data: counts, backgroundColor: "#CDB8FF", borderRadius: 10 }]
  },
  options: chartOptions(undefined)
});

// ========== WEAK & STRONG TOPICS ==========
function fillList(boxId, list) {
  if (list.length === 0) return;
  const box = document.getElementById(boxId);
  box.innerHTML = "";
  list.forEach(t => {
    const a = document.createElement("a");
    a.className = "pill";
    a.style.textDecoration = "none";
    a.href = "quiz.html?topic=" + encodeURIComponent(t.name);
    a.textContent = t.name + " · " + t.score + "%";
    box.appendChild(a);
  });
}
const allTopics = Object.keys(topics).map(name => ({
  name: name,
  score: Math.round(topics[name].correct / topics[name].total * 100)
}));
fillList("weakList", allTopics.filter(t => t.score < 60).sort((a, b) => a.score - b.score));
fillList("strongList", allTopics.filter(t => t.score >= 60).sort((a, b) => b.score - a.score));

// ========== AI STUDY COACH ==========
document.getElementById("coachBtn").addEventListener("click", async () => {
  const box = document.getElementById("coachText");
  if (allTopics.length === 0) {
    box.innerHTML = "Take at least one quiz first, so I can see how you're doing. 🙂";
    return;
  }
  box.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';
  const summary = allTopics.map(t => t.name + ": " + t.score + "%").join(", ");
  const prompt =
    "Here are my quiz scores by topic: " + summary + ". My study streak is " + streakNow + " days. " +
    "As my study coach, tell me in under 120 words: what I'm good at, my 2 weakest areas, " +
    "and a simple 3-day plan to improve. Be encouraging.";
  try {
    box.innerHTML = formatText(await askAI(prompt));
  } catch (err) {
    box.innerHTML = "⚠️ " + formatText(err.message);
  }
});