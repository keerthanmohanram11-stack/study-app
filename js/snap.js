let photo = null;
const resultBox = document.getElementById("resultBox");

const PROMPTS = {
  explain: "This is a photo of a student's notes or textbook. Explain what it is about, step by step, with one real-life example.",
  notes: "This is a photo of a student's notes or textbook. Turn it into short revision notes: 5 to 8 bullet points with the key facts.",
  mistake: "This is a photo of a student's solved answer. Check it carefully. Say what is correct, point out any mistakes, and show the right way.",
  questions: "This is a photo of a student's notes or textbook. Write 5 practice questions about it, then give the answers at the end."
};

function showResult(html) {
  resultBox.style.display = "block";
  resultBox.innerHTML = html;
}

// ========== CHOOSE A PHOTO ==========
document.getElementById("photo").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    photo = await shrinkImage(file);
    const preview = document.getElementById("preview");
    preview.src = photo.preview;
    preview.style.display = "block";
    resultBox.style.display = "none";
  } catch (err) {
    showResult("⚠️ Couldn't open that photo. Try a JPG or PNG.");
  }
});

// ========== ASK THE AI ==========
document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!photo) {
      showResult("👆 Choose a photo first.");
      return;
    }
    showResult('<div class="typing"><i></i><i></i><i></i></div>');
    try {
      const reply = await askAI(PROMPTS[btn.dataset.mode], { mimeType: photo.mimeType, data: photo.data });
      showResult(formatText(reply));
      addXP(10);
    } catch (err) {
      showResult("⚠️ " + formatText(err.message));
    }
  });
});

// Shrinks the photo so it uploads fast
function shrinkImage(file, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({ mimeType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}