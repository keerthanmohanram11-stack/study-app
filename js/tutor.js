const chat = document.getElementById("chat");
const input = document.getElementById("question");
const speakBtn = document.getElementById("speakBtn");
const profile = getProfile();
const chatHistory = [];
let lastQuestion = "";
let busy = false;

document.getElementById("expertName").textContent = profile.expert + " · " + profile.personality;
speakBtn.classList.toggle("on", profile.speak);

// ========== SEND A QUESTION ==========
async function ask(text) {
  const question = (text || input.value).trim();
  if (!question || busy) return;
  busy = true;
  input.value = "";

  addBubble(question, "you");
  if (!text) lastQuestion = question;   // remember real questions (not quick buttons)
  const thinking = addBubble("", "ai");
  thinking.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';

  chatHistory.push("Student: " + question);
  const prompt =
    "Conversation so far:\n" + chatHistory.slice(-8).join("\n") +
    "\n\nReply to the student's last message.";

  try {
    const reply = await askAI(prompt);
    chatHistory.push("Tutor: " + reply);
    await typeOut(thinking, reply);
    addXP(5);
    if (getProfile().speak) speak(reply);
  } catch (err) {
    thinking.innerHTML = "⚠️ " + formatText(err.message);
  }
  busy = false;
}

// Adds one chat bubble
function addBubble(text, who) {
  const div = document.createElement("div");
  div.className = who === "ai" ? "glass bubble ai" : "bubble you";
  div.innerHTML = formatText(text);
  chat.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
  return div;
}

// Shows the answer word by word, like live typing
function typeOut(el, text) {
  return new Promise(resolve => {
    const words = text.split(" ");
    let shown = 0;
    const timer = setInterval(() => {
      shown += 3;
      el.innerHTML = formatText(words.slice(0, shown).join(" "));
      window.scrollTo(0, document.body.scrollHeight);
      if (shown >= words.length) {
        clearInterval(timer);
        el.innerHTML = formatText(text);
        resolve();
      }
    }, 35);
  });
}

// ========== VOICE: READ ANSWERS OUT LOUD ==========
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const clean = text.replace(/[*#_`]/g, "");
  speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
}

speakBtn.addEventListener("click", () => {
  const p = getProfile();
  p.speak = !p.speak;
  saveProfile(p);
  speakBtn.classList.toggle("on", p.speak);
  if (!p.speak && "speechSynthesis" in window) speechSynthesis.cancel();
});

// ========== VOICE: SPEAK YOUR QUESTION ==========
const micBtn = document.getElementById("micBtn");
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

micBtn.addEventListener("click", () => {
  if (!Recognition) {
    addBubble("Voice typing works best in Google Chrome. 🎤", "ai");
    return;
  }
  const rec = new Recognition();
  rec.lang = "en-IN";
  micBtn.classList.add("on");
  input.placeholder = "Listening… 👂";
  rec.onresult = (e) => {
    input.value = e.results[0][0].transcript;
    ask();
  };
  rec.onend = () => {
    micBtn.classList.remove("on");
    input.placeholder = "Ask any doubt…";
  };
  rec.start();
});

// ========== BUTTONS ==========
document.getElementById("sendBtn").addEventListener("click", () => ask());
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask();
});

document.querySelectorAll("[data-quick]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (chatHistory.length === 0) {
      addBubble("Ask me a question first, then tap this. 🙂", "ai");
      return;
    }
    ask(btn.dataset.quick);
  });
});

document.getElementById("quizMe").addEventListener("click", () => {
  if (!lastQuestion) {
    addBubble("Ask me a question first, then I'll quiz you on it. 📝", "ai");
    return;
  }
  location.href = "quiz.html?topic=" + encodeURIComponent(lastQuestion);
});