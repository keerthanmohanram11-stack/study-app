const chat = document.getElementById("chat");
const input = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");
const chatHistory = [];

async function ask() {
  const question = input.value.trim();
  if (!question) return;

  addMessage(question, "you");
  input.value = "";
  const thinking = addMessage("Thinking... 🤔", "ai");

  chatHistory.push("Student: " + question);
  const prompt =
    "Conversation so far:\n" + chatHistory.slice(-6).join("\n") +
    "\n\nReply to the student's last message. If it is homework, give hints first, then the answer.";

  try {
    const reply = await askAI(prompt);
    thinking.innerHTML = formatText(reply);
    chatHistory.push("Tutor: " + reply);
  } catch (err) {
    thinking.innerHTML = "⚠️ " + formatText(err.message);
  }
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = formatText(text);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

sendBtn.addEventListener("click", ask);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask();
});