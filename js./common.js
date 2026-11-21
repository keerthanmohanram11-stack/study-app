async function askAI(prompt, image = null, json = false) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt, image: image, json: json })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.reply || "Something went wrong");
  return data.reply;
}

function formatText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}