import { RF_CONFIG } from "../src/config.js";

export function initAiScanner() {
    const fileInput = document.getElementById("ai-scan-input");
    const scanButton = document.getElementById("ai-scan-button");
    const statusEl = document.getElementById("ai-scan-status");
    const resultEl = document.getElementById("ai-scan-result");
    const previewEl = document.getElementById("ai-scan-preview");

    let selectedFile = null;

    if (!fileInput || !scanButton || !resultEl || !previewEl) return;

    // Show image preview on file select
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        selectedFile = file;
        resultEl.textContent = "";
        statusEl.textContent = "";
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                previewEl.src = reader.result;
                previewEl.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        } else {
            previewEl.src = "";
            previewEl.classList.add("hidden");
        }
    });

    scanButton.addEventListener("click", async () => {
        const file = selectedFile || fileInput.files[0];
        if (!file) {
            resultEl.textContent = "Please select an image first.";
            return;
        }
        resultEl.textContent = "";
        statusEl.textContent = "স্ক্যান হচ্ছে...";
        try {
            // Convert to base64
            const base64 = await fileToBase64(file);
            const base64Payload = base64.split(",")[1];
            // Set endpoint with api_key as query param
            const url = `${RF_CONFIG.apiUrl}?api_key=${RF_CONFIG.apiKey}`;

            // Debug logs
            console.log("[AI SCAN] API URL:", url);
            console.log("[AI SCAN] Base64 preview:", base64.substring(0, 50) + "...");

            // Post to Roboflow per docs
            // Send the base64 string directly as the body.
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: base64Payload
            });
            const data = await res.json();
            console.log("[AI SCAN] Roboflow response:", data);
            if (!res.ok) throw new Error("Roboflow error: " + (data.message || res.status));

            let label = "";
            if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
                // Find prediction with highest confidence
                const topPrediction = data.predictions.reduce((prev, current) => {
                    return (prev.confidence > current.confidence) ? prev : current;
                });
                label = topPrediction.class.toLowerCase();
            } else {
                label = data.label?.toLowerCase?.() || data.result?.toLowerCase?.() || "";
            }

            const status = interpretLabel(label);
            resultEl.textContent = status.messageBn;
            statusEl.textContent = "";
        } catch (err) {
            statusEl.textContent = "স্ক্যান করা যায়নি। পরে চেষ্টা করুন।";
            resultEl.textContent = "";
            console.error("[AI SCAN] ERROR:", err);
        }
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

function interpretLabel(label) {
    if (label.includes("rot") || label.includes("mold") || label.includes("unhealthy") || label.includes("sick") || label.includes("disease") || label.includes("blight")) {
        return {
            healthStatus: "rotten",
            messageBn: "ফসল নষ্ট হতে পারে, দ্রুত শুকান ও আলাদা রাখুন।"
        };
    }
    return {
        healthStatus: "fresh",
        messageBn: "ফসল দেখতে সুস্থ।"
    };
}