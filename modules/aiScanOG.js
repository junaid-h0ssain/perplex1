// modules/aiScanOG.js
import { HF_CONFIG } from "../src/config.js";

export function initAiScanner() {
    // HTML IDs from app.html
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
        statusEl.textContent = "Scanning...";
        try {
            const blob = await compressImage(file, 512);
            const res = await fetch(HF_CONFIG.apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HF_CONFIG.apiKey}`
                },
                body: blob
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            const label = json[0]?.label?.toLowerCase?.() || "";
            const status = interpretLabel(label);
            resultEl.textContent = status.messageBn;
            statusEl.textContent = "";
            // Optional: attach to latest active batch
            if (window.HG_batches) {
                window.HG_batches.updateLatestBatchHealth(status.healthStatus);
            }
        } catch (err) {
            statusEl.textContent = "Could not scan—please try again later.";
            resultEl.textContent = "";
        }
    });
}

function interpretLabel(label) {
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
                const canvas = document.createElement("canvas");
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
