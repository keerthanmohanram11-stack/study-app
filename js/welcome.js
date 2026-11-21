const p = getProfile();
document.getElementById("name").value = p.name;

// Make the buttons pickable
const getLevel = setupChoices("levelBox", p.level, false);
const getExpert = setupChoices("expertBox", p.expert, false);
const getPersonality = setupChoices("personalityBox", p.personality, false);

document.getElementById("name").addEventListener("input", () => {
  document.getElementById("nameError").style.display = "none";
});

document.getElementById("startBtn").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  if (!name) {
    document.getElementById("nameError").style.display = "block";
    document.getElementById("name").focus();
    return;
  }
  p.name = name;
  p.level = getLevel();
  p.expert = getExpert();
  p.personality = getPersonality();
  saveProfile(p);
  location.href = "index.html";
});