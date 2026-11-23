// Groq (fast) for text, Gemini for photos and as backup
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const DEFAULT_SYSTEM = "You are StudyBuddy, a friendly tutor for students. Explain in simple words, step by step.";

async function askGroq(system, prompt, json) {
  const body = {
    model: GROQ_MODEL,
    messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
    temperature: 0.6
  };
  if (json) body.response_format = { type: "json_object" };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error(data.error?.message || "Groq gave no answer");
  return reply;
}

async function askGemini(system, prompt, image, json) {
  const parts = [{ text: prompt }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: parts }]
  };
  if (json) body.generationConfig = { responseMimeType: "application/json" };
  let lastError = "no answer";
  for (const model of GEMINI_MODELS) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
      lastError = data.error?.message || "no answer";
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(lastError);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ reply: "Please use POST" });
  const { prompt, image, json, system } = req.body || {};
  if (!prompt) return res.status(400).json({ reply: "No question was sent" });
  const sys = (system || DEFAULT_SYSTEM).slice(0, 1500);

  try {
    // Photos go to Gemini. Text tries Groq first, then Gemini.
    if (image) return res.status(200).json({ reply: await askGemini(sys, prompt, image, json) });
    try {
      return res.status(200).json({ reply: await askGroq(sys, prompt, json) });
    } catch (groqErr) {
      return res.status(200).json({ reply: await askGemini(sys, prompt, null, json) });
    }
  } catch (err) {
    res.status(500).json({ reply: "The AI is busy right now. Please try again in a minute. (" + err.message + ")" });
  }
};