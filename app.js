
const $ = (id) => document.getElementById(id);

const promptInput = $("prompt");
const generateBtn = $("generateBtn");
const resultImage = $("resultImage");
const emptyState = $("emptyState");
const loadingState = $("loadingState");
const errorBox = $("errorBox");
const downloadBtn = $("downloadBtn");
const settingsModal = $("settingsModal");

const WORKER_URL =
  "https://divine-pond-cddakhayal-image-api.mohammedsabrt91.workers.dev/";

function setStatus(message, error = false) {
  const status = $("status");
  status.textContent = message;
  status.style.background = error ? "#fff0f0" : "#e9f8ee";
  status.style.color = error ? "#a32626" : "#258047";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resultImage.classList.add("hidden");
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  setStatus("حدث خطأ", true);
}

function openSettings() {
  $("settingsMessage").textContent =
    "الموقع يستخدم Cloudflare Workers AI، ولا يحتاج إلى إدخال مفتاح OpenAI هنا.";
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

$("settingsBtn").addEventListener("click", openSettings);
$("closeModal").addEventListener("click", closeSettings);

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettings();
  }
});

$("clearBtn").addEventListener("click", () => {
  promptInput.value = "";
  $("charCount").textContent = "0 حرف";
});

promptInput.addEventListener("input", () => {
  $("charCount").textContent = `${promptInput.value.length} حرف`;
});

document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    $("charCount").textContent = `${promptInput.value.length} حرف`;
  });
});

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showError("اكتب وصف الصورة أولًا.");
    promptInput.focus();
    return;
  }

  generateBtn.disabled = true;
  errorBox.classList.add("hidden");
  emptyState.classList.add("hidden");
  resultImage.classList.add("hidden");
  downloadBtn.classList.add("disabled");
  loadingState.classList.remove("hidden");
  setStatus("جارٍ إنشاء الصورة...");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        `فشل الطلب. رمز الخطأ: ${response.status}`
      );
    }

    if (!result.image) {
      throw new Error("لم تصل الصورة من Cloudflare.");
    }

    const imageUrl = result.image.startsWith("data:")
      ? result.image
      : `data:image/jpeg;base64,${result.image}`;

    resultImage.onload = () => {
      loadingState.classList.add("hidden");
      resultImage.classList.remove("hidden");

      downloadBtn.href = imageUrl;
      downloadBtn.download = "khayal-ai.jpg";
      downloadBtn.classList.remove("disabled");

      setStatus("تم إنشاء الصورة بنجاح");
    };

    resultImage.onerror = () => {
      showError("وصلت نتيجة، لكن تعذر عرض الصورة.");
    };

    resultImage.src = imageUrl;
  } catch (error) {
    let message = error.message || "حدث خطأ غير معروف.";

    if (error instanceof TypeError) {
      message =
        "تعذر الاتصال بـ Cloudflare. تأكد من الإنترنت وإعدادات CORS في Worker.";
    }

    showError(message);
  } finally {
    generateBtn.disabled = false;
    loadingState.classList.add("hidden");
  }
});
