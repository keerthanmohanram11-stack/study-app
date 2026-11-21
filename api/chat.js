// Models to try, in order. If one is busy, try the next.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Please use POST" });
  }

  const { prompt, image, json } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ reply: "No question was sent" });
  }

  const parts = [{ text: prompt }];
  if (image) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const body = {
    systemInstruction: {
      parts: [{ text: "You are StudyBuddy, a friendly tutor for school students. Explain in simple words, step by step, with short examples." }]
    },
    contents: [{ role: "user", parts: parts }]
  };
  if (json) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  let lastError = "no answer";

  for (const model of MODELS) {
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY
          },
          body: JSON.stringify(body)
        }
      );
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return res.status(200).json({ reply: reply });
      }
      lastError = data.error?.message || "no answer";
    } catch (err) {
      lastError = err.message;
    }
  }

  res.status(500).json({ reply: "AI is busy right now, please try again in a minute. (" + lastError + ")" });
};