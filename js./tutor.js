const chat = document.getElementById("chat");
const input = document.getElementById("question");
const chatHistory = [];   // remembers the conversation

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

// Adds one chat bubble and returns it
function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = formatText(text);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// Press Enter to send
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask();
});
