const area = document.getElementById("area");
const topicInput = document.getElementById("topic");

// Read the link, e.g. quiz.html?topic=Fractions or quiz.html?mode=cards
const params = new URLSearchParams(location.search);
topicInput.value = params.get("topic") || "";
const getMode = setupChoices("modeBox", params.get("mode") === "cards" ? "cards" : "quiz", false);

let topic = "";
let subject = "";
let questions = [];
let cards = [];
let current = 0;
let score = 0;

// ========== START ==========
document.getElementById("startBtn").addEventListener("click", start);
topicInput.addEventListener("keydown", (e) => { if (e.key === "Enter") start(); });

document.getElementById("weakBtn").addEventListener("click", () => {
  const weak = getWeakTopics();
  if (weak.length === 0) {
    area.innerHTML = '<div class="glass card">🎉 No weak topics yet! Take a few quizzes and I\'ll track them.</div>';
    return;
  }
  topicInput.value = weak[0].name;
  start();
});

async function start() {
  topic = topicInput.value.trim();
  if (!topic) {
    area.innerHTML = '<div class="glass card">👆 Type a topic first.</div>';
    topicInput.focus();
    return;
  }
  area.innerHTML = '<div class="glass card row"><div class="typing"><i></i><i></i><i></i></div><span class="muted">Making it for you…</span></div>';

  const mode = getMode();
  const prompt = mode === "quiz"
    ? 'Make a 5-question multiple choice quiz on: "' + topic + '". ' +
      'Return JSON exactly like: {"subject":"Maths","questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. ' +
      '"subject" is one school subject word (Maths, Science, English, Social Science, Computers or Other). "answer" is the position (0-3) of the correct option.'
    : 'Make 8 flashcards on: "' + topic + '". ' +
      'Return JSON exactly like: {"subject":"Science","cards":[{"front":"short question or word","back":"short clear answer"}]}. ' +
      '"subject" is one school subject word (Maths, Science, English, Social Science, Computers or Other).';

  try {
    const data = JSON.parse(await askAI(prompt, null, true));
    subject = data.subject || "Other";
    current = 0;
    score = 0;
    if (mode === "quiz") {
      questions = data.questions;
      showQuestion();
    } else {
      cards = data.cards;
      addXP(5);
      showCard();
    }
  } catch (err) {
    area.innerHTML = '<div class="glass card">⚠️ Couldn\'t make it this time. Tap Start to try again.</div>';
  }
}

// ========== QUIZ ==========
function showQuestion() {
  const q = questions[current];
  area.innerHTML =
    '<div class="glass card">' +
      '<div class="row between"><span class="muted">' + formatText(topic) + '</span><span class="muted">' + (current + 1) + ' / ' + questions.length + '</span></div>' +
      '<div class="bar" style="margin: 10px 0 14px"><div style="width:' + Math.round(current / questions.length * 100) + '%"></div></div>' +
      '<h2>' + formatText(q.question) + '</h2>' +
      '<div id="options"></div>' +
      '<div id="feedback"></div>' +
    '</div>';

  const box = document.getElementById("options");
  q.options.forEach((option, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = '<span class="letter">' + "ABCD"[i] + '</span>' + formatText(option);
    btn.addEventListener("click", () => checkAnswer(i));
    box.appendChild(btn);
  });
}

function checkAnswer(choice) {
  const q = questions[current];
  document.querySelectorAll(".option").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add("correct");
    else if (i === choice) btn.classList.add("wrong");
  });

  const right = choice === q.answer;
  if (right) score++;

  const feedback = document.getElementById("feedback");
  feedback.innerHTML =
    '<p class="answer" style="margin: 14px 0">' + (right ? "✅ Correct! +10 XP. " : "❌ Not quite. ") + formatText(q.explanation) + '</p>';

  const next = document.createElement("button");
  next.className = "btn";
  next.style.width = "100%";
  next.textContent = current < questions.length - 1 ? "Next →" : "See my score";
  next.addEventListener("click", () => {
    current++;
    if (current < questions.length) showQuestion();
    else showScore();
  });
  feedback.appendChild(next);
}

function showScore() {
  const percent = Math.round(score / questions.length * 100);
  saveTopicResult(topic, subject, score, questions.length);
  addXP(score * 10);

  area.innerHTML =
    '<div class="glass card" style="text-align: center; display: flex; flex-direction: column; gap: 12px; align-items: center">' +
      '<div style="font-size: 48px">' + (percent >= 60 ? "🏆" : "💪") + '</div>' +
      '<h2>You scored ' + score + ' / ' + questions.length + '</h2>' +
      '<p class="muted">' + (percent >= 60
        ? "Great job! +" + score * 10 + " XP"
        : "Keep going! I've added this topic to your revise list.") + '</p>' +
      '<div class="row"><button class="btn" id="again">Try again</button><a class="btn btn-ghost" href="progress.html">See progress</a></div>' +
    '</div>';
  document.getElementById("again").addEventListener("click", start);
}

// ========== FLASHCARDS ==========
function showCard() {
  const c = cards[current];
  area.innerHTML =
    '<p class="muted" style="text-align: center; margin-bottom: 10px">Card ' + (current + 1) + ' of ' + cards.length + ' · tap to flip</p>' +
    '<div class="flip" id="flip">' +
      '<div class="flip-inner">' +
        '<div class="glass face">' + formatText(c.front) + '</div>' +
        '<div class="glass face back">' + formatText(c.back) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="row" style="margin-top: 14px">' +
      '<button class="btn btn-ghost" id="prev" style="flex: 1">← Back</button>' +
      '<button class="btn" id="next" style="flex: 1">' + (current < cards.length - 1 ? "Next →" : "Finish") + '</button>' +
    '</div>';

  document.getElementById("flip").addEventListener("click", (e) => e.currentTarget.classList.toggle("flipped"));
  document.getElementById("prev").addEventListener("click", () => {
    if (current > 0) { current--; showCard(); }
  });
  document.getElementById("next").addEventListener("click", () => {
    if (current < cards.length - 1) {
      current++;
      showCard();
    } else {
      area.innerHTML = '<div class="glass card" style="text-align: center">🎉 You finished all the cards! Now try a quiz on it.</div>';
    }
  });
}