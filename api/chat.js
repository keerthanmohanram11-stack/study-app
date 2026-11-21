// Which Gemini model to use. If you get "model not found",
// check the model list in Google AI Studio and change this name.
const MODEL = "gemini-flash-latest";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

module.exports = async (req, res) => {
	if (req.method !== "POST") {
		return res.status(405).json({ reply: "Please use POST" });
	}

	// What the page sent us
	const { prompt, image, json } = req.body || {};
	if (!prompt) {
		return res.status(400).json({ reply: "No question was sent" });
	}

	// The message for Gemini: text, plus a photo if there is one
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

	// For the quiz we ask Gemini to answer in JSON format
	if (json) {
		body.generationConfig = { responseMimeType: "application/json" };
	}

	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-goog-api-key": process.env.GEMINI_API_KEY   // secret key, stored in Vercel
			},
			body: JSON.stringify(body)
		});
		const data = await response.json();
		const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!reply) {
			return res.status(500).json({ reply: "AI error: " + (data.error?.message || "no answer") });
		}
		res.status(200).json({ reply: reply });
	} catch (err) {
		res.status(500).json({ reply: "Server error: " + err.message });
	}
};
