// ========== GREETING ==========
const profile = getProfile();
const hour = new Date().getHours();
document.getElementById("greeting").textContent =
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
document.getElementById("hello").textContent = "Hi, " + profile.name;

// ========== STREAK, XP, LEVEL ==========
const stats = getStats();
// If the last study day was before yesterday, the streak is broken
const streakNow = (stats.lastDay === dayKey() || stats.lastDay === dayKey(1)) ? stats.streak : 0;
document.getElementById("streak").textContent = streakNow;
document.getElementById("xp").textContent = stats.xp;

const lvl = levelInfo(stats.xp);
document.getElementById("level").textContent = "Level " + lvl.level;
document.getElementById("levelText").textContent = lvl.progress + " / 100 XP";
document.getElementById("levelBar").style.width = lvl.progress + "%";

// ========== REVISE NEXT (weak topics) ==========
const weak = getWeakTopics().slice(0, 5);
if (weak.length > 0) {
  document.getElementById("reviseBox").style.display = "block";
  const box = document.getElementById("revise");
  weak.forEach(t => {
    const a = document.createElement("a");
    a.className = "pill";
    a.style.textDecoration = "none";
    a.href = "quiz.html?topic=" + encodeURIComponent(t.name);
    a.textContent = t.name + " · " + t.score + "%";
    box.appendChild(a);
  });
}

// ========== FOCUS TIMER ==========
let secondsLeft = 25 * 60;
let ticking = null;
const timerEl = document.getElementById("timer");
const timerBtn = document.getElementById("timerBtn");

function showTime() {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  timerEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

timerBtn.addEventListener("click", () => {
  if (ticking) {
    clearInterval(ticking);
    ticking = null;
    timerBtn.textContent = "Start";
    return;
  }
  timerBtn.textContent = "Pause";
  ticking = setInterval(() => {
    secondsLeft--;
    showTime();
    if (secondsLeft <= 0) {
      clearInterval(ticking);
      ticking = null;
      addXP(20);
      timerEl.textContent = "Done! +20 XP";
      timerBtn.textContent = "Start";
      secondsLeft = 25 * 60;
    }
  }, 1000);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  clearInterval(ticking);
  ticking = null;
  secondsLeft = 25 * 60;
  timerBtn.textContent = "Start";
  showTime();
});
