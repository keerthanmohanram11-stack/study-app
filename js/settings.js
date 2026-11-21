const p = getProfile();
document.getElementById("name").value = p.name;

const getLevel = setupChoices("levelBox", p.level, false);
const getExpert = setupChoices("expertBox", p.expert, false);
const getPersonality = setupChoices("personalityBox", p.personality, false);
const getStyles = setupChoices("styleBox", p.styles, true);
const getTheme = setupChoices("themeBox", p.theme, false);

// ========== SAVE ==========
document.getElementById("saveBtn").addEventListener("click", () => {
  p.name = document.getElementById("name").value.trim() || p.name;
  p.level = getLevel();
  p.expert = getExpert();
  p.personality = getPersonality();
  p.styles = getStyles();
  p.theme = getTheme();
  saveProfile(p);
  applyTheme();
  const saved = document.getElementById("saved");
  saved.style.display = "block";
  setTimeout(() => { saved.style.display = "none"; }, 2000);
});

// ========== RESET (tap twice to be sure) ==========
const resetBtn = document.getElementById("resetBtn");
let sure = false;
resetBtn.addEventListener("click", () => {
  if (!sure) {
    sure = true;
    resetBtn.textContent = "Tap again to delete all XP and scores";
    return;
  }
  Store.set("stats", {});
  Store.set("topics", {});
  resetBtn.textContent = "✓ Progress reset";
});