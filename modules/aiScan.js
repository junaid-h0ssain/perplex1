// modules/aiScanner.js
import { HF_CONFIG } from "../src/config.js";

export function initAiScanner() {
    const scanInput = document.getElementById("scan-image-input");
    if (!scanInput) return;

    scanInput.addEventListener("change", async () => {
        const user = window.HG.getCurrentUser();
        if (!user) return;
        const file = scanInput.files[0];
        if (!file) return;
        const resultEl = document.getElementById("scan-result");
        resultEl.textContent = "স্ক্যান হচ্ছে...";

        try {
            const blob = await compressImage(file, 512);
            const res = await fetch(HF_CONFIG.imageApiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HF_CONFIG.apiKey}`
                },
                body: blob
            });
            const json = await res.json();
            const label = json[0]?.label?.toLowerCase() || "";
            const status = interpretLabel(label);
            resultEl.textContent = status.messageBn;
            // Optional: attach to latest active batch
            if (window.HG_batches) {
                window.HG_batches.updateLatestBatchHealth(status.healthStatus);
            }
        } catch {
            resultEl.textContent = "স্ক্যান করা যায়নি। পরে চেষ্টা করুন।";
        }
    });
}

function interpretLabel(label) {
    // Very simple mapping; customize by model labels
    if (label.includes("rotten") || label.includes("mold")) {
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

// Basic image compression using canvas
function compressImage(file, maxSize) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = e => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    blob => {
                        if (!blob) return reject(new Error("Blob error"));
                        resolve(blob);
                    },
                    "image/jpeg",
                    0.7
                );
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
