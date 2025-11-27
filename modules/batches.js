import { db, fbDbApi } from "../src/firebase-config.js";
import { CLOUDINARY_CONFIG } from "../src/config.js";
const { collection, addDoc, query, where, getDocs, updateDoc, doc } = fbDbApi;

const LOCATIONS = [
{ value: "Chattogram", label: "Chattogram (Chittagong)" },
{ value: "Coxs Bazar", label: "Cox’s Bazar" },
{ value: "Cumilla", label: "Cumilla (Comilla)" },
{ value: "Feni", label: "Feni" },
{ value: "Brahmanbaria", label: "Brahmanbaria" },
{ value: "Chandpur", label: "Chandpur" },
{ value: "Noakhali", label: "Noakhali" },
{ value: "Lakshmipur", label: "Lakshmipur" },
{ value: "Khagrachhari", label: "Khagrachhari" },
{ value: "Bandarban", label: "Bandarban" }
];

let batchesCache = [];

function populateLocationSelect() {
const select = document.getElementById("batch-location");
if (!select) return;
select.innerHTML = "";

const placeholder = document.createElement("option");
placeholder.value = "";
placeholder.textContent = "Select district";
placeholder.disabled = true;
placeholder.selected = true;
select.appendChild(placeholder);

LOCATIONS.forEach(loc => {
const opt = document.createElement("option");
opt.value = loc.value;
opt.textContent = loc.label;
select.appendChild(opt);
});
}

export function initBatches() {
const batchForm = document.getElementById("batch-form");
const exportBtn = document.getElementById("export-btn");

populateLocationSelect();

batchForm?.addEventListener("submit", onCreateBatch);
exportBtn?.addEventListener("click", onExport);

window.HG_batches = {
initUserData,
updateLatestBatchHealth
};

// let offline.js know how to process queue
if (window.HG_offline) {
window.HG_offline.processQueue = processQueue;
}
}

async function initUserData() {
batchesCache = window.HG_offline?.loadBatches() || [];
renderBatches();
await processQueue();
if (window.HG_weather) {
batchesCache = await window.HG_weather.updateBatchRiskFromWeather(batchesCache);
renderBatches();
}
}

async function onCreateBatch(e) {
e.preventDefault();
const user = window.HG.getCurrentUser();
if (!user) return;

const crop = document.getElementById("batch-crop").value.trim();
const weight = parseFloat(document.getElementById("batch-weight").value);
const storage = document.getElementById("batch-storage").value;
const location = document.getElementById("batch-location").value;
const dateType = document.getElementById("batch-date-type").value;
const file = document.getElementById("batch-image").files[0];
const dateRaw = document.getElementById("batch-date").value;
const dateIso = dateRaw ? new Date(dateRaw).toISOString() : null;

const batch = {
userId: user.uid,
cropType: crop,
estimatedWeightKg: weight,
harvestDate: dateIso,
dateType: dateType,
storageType: storage,
storageLocationFreeText: location,
status: "active",
riskStatus: null,
etclHours: null,
lastRiskSummaryBn: "",
createdAt: new Date().toISOString(),
imageUrl: null,
cropHealthStatus: null
};

try {
if (file) {
batch.imageUrl = await uploadToCloudinary(file);
}
} catch {
alert("Image upload failed; continuing without image.");
}

batchesCache.push(batch);
window.HG_offline?.saveBatches(batchesCache);
renderBatches();
awardFirstHarvestBadge();

if (navigator.onLine) {
await pushBatchToFirestore(batch);
} else {
window.HG_offline?.enqueue({ type: "addBatch", data: batch });
}

e.target.reset();
}

async function uploadToCloudinary(file) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    const res = await fetch(url, { method: "POST", body: data });
    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload failed");
    return json.secure_url;
}

async function pushBatchToFirestore(batch) {
    await addDoc(collection(db, "batches"), batch);
}

async function processQueue() {
    const queue = window.HG_offline?.getQueue() || [];
    if (!queue.length || !navigator.onLine) return;
    for (const op of queue) {
        try {
            if (op.type === "addBatch") {
                await pushBatchToFirestore(op.data);
            } else if (op.type === "updateBatchStatus") {
                await updateBatchStatusRemote(op.data);
            }
        } catch {
            // keep in queue
        }
    }
    window.HG_offline?.clearQueue();
}

// Render + analytics + actions
function formatDate(isoString) {
    if (!isoString) return "N/A";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch {
        return isoString;
    }
}

function formatDateTime(isoString) {
    if (!isoString) return "N/A";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return isoString;
    }
}

function renderBatches() {
    const list = document.getElementById("active-batches");
    const noMsg = document.getElementById("no-batches-msg");
    const statActive = document.getElementById("stat-active");
    const statCompleted = document.getElementById("stat-completed");
    const statMitigated = document.getElementById("stat-mitigated");
    const statWeight = document.getElementById("stat-weight");
    const badgesList = document.getElementById("badges-list");
    const noBadgesMsg = document.getElementById("no-badges-msg");

    list.innerHTML = "";
    const active = batchesCache.filter(b => b.status !== "completed");
    if (!active.length) {
        noMsg.classList.remove("hidden");
    } else {
        noMsg.classList.add("hidden");
    }

    active.forEach((b, idx) => {
        const card = document.createElement("div");
        card.className = "batch-card";
        const dateTypeLabel = b.dateType || "Harvest";
        card.innerHTML = `
      <p><strong>${b.cropType}</strong> (${b.estimatedWeightKg} kg)</p>
      <p>${dateTypeLabel} Date: ${formatDate(b.harvestDate)} – ${b.storageType}</p>
      <p>Location: ${b.storageLocationFreeText}</p>
      <p>Date Added: ${formatDateTime(b.createdAt)}</p>
      <p>Status: ${b.status}${b.riskStatus ? " (" + b.riskStatus + ")" : ""}</p>
      ${b.etclHours ? `<p>ETCL: ${b.etclHours} ঘন্টা</p>` : ""}
      ${b.lastRiskSummaryBn ? `<p>${b.lastRiskSummaryBn}</p>` : ""}
      ${b.imageUrl ? `<img src="${b.imageUrl}" class="batch-img" />` : ""}
      ${b.cropHealthStatus ? `<p>স্বাস্থ্য: ${b.cropHealthStatus}</p>` : ""}
      <button data-idx="${idx}" class="complete-btn">Complete</button>
      <button data-idx="${idx}" class="mitigate-btn">Mitigate</button>
      <button data-idx="${idx}" class="lose-btn">Mark Lost</button>
    `;
        list.appendChild(card);
    });

    list.querySelectorAll(".complete-btn").forEach(btn => {
        btn.addEventListener("click", () => updateStatus(btn, "completed"));
    });
    list.querySelectorAll(".mitigate-btn").forEach(btn => {
        btn.addEventListener("click", () => updateStatus(btn, "mitigated"));
    });
    list.querySelectorAll(".lose-btn").forEach(btn => {
        btn.addEventListener("click", () => updateStatus(btn, "lost"));
    });

    const completed = batchesCache.filter(b => b.status === "completed");
    const mitigated = batchesCache.filter(b => b.status === "mitigated");
    const totalWeight = batchesCache.reduce((s, b) => s + (b.estimatedWeightKg || 0), 0);

    statActive.textContent = active.length;
    statCompleted.textContent = completed.length;
    statMitigated.textContent = mitigated.length;
    statWeight.textContent = totalWeight.toFixed(2);

    renderBadges(badgesList, noBadgesMsg);
}

async function updateStatus(btn, status) {
    const idx = parseInt(btn.getAttribute("data-idx"), 10);
    const batch = batchesCache[idx];
    if (!batch) return;
    batch.status = status;
    if (status === "mitigated") awardRiskMitigatedBadge();
    if (status === "completed") awardCompletionistBadge();
    window.HG_offline?.saveBatches(batchesCache);
    renderBatches();

    if (navigator.onLine) {
        await updateBatchStatusRemote(batch);
    } else {
        window.HG_offline?.enqueue({ type: "updateBatchStatus", data: batch });
    }
}

async function updateBatchStatusRemote(batch) {
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const q = query(
        collection(db, "batches"),
        where("userId", "==", user.uid),
        where("createdAt", "==", batch.createdAt)
    );
    const snaps = await getDocs(q);
    snaps.forEach(async d => {
        await updateDoc(doc(db, "batches", d.id), {
            status: batch.status,
            riskStatus: batch.riskStatus || null,
            etclHours: batch.etclHours || null,
            lastRiskSummaryBn: batch.lastRiskSummaryBn || "",
            cropHealthStatus: batch.cropHealthStatus || null
        });
    });
}

// Badges
async function awardFirstHarvestBadge() {
    const { loadProfile } = await import("./profile.js");
    const { db, fbDbApi } = await import("../src/firebase-config.js");
    const { doc, getDoc, updateDoc } = fbDbApi;
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    if (!badges.includes("First Harvest Logged")) {
        badges.push("First Harvest Logged");
        await updateDoc(doc(db, "users", user.uid), { badges });
        await loadProfile();
    }
}

async function awardRiskMitigatedBadge() {
    const { loadProfile } = await import("./profile.js");
    const { db, fbDbApi } = await import("../src/firebase-config.js");
    const { doc, getDoc, updateDoc } = fbDbApi;
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    
    // Count how many batches have been mitigated
    const mitigatedCount = batchesCache.filter(b => b.status === "mitigated").length;
    
    // Only award badge if at least 5 batches have been mitigated
    if (mitigatedCount >= 5 && !badges.includes("Risk Mitigated Expert")) {
        badges.push("Risk Mitigated Expert");
        await updateDoc(doc(db, "users", user.uid), { badges });
        alert("Achievement unlocked: Risk Mitigated Expert badge earned!");
        await loadProfile();
    }
}

async function awardCompletionistBadge() {
    const { loadProfile } = await import("./profile.js");
    const { db, fbDbApi } = await import("../src/firebase-config.js");
    const { doc, getDoc, updateDoc } = fbDbApi;
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    
    // Count how many batches have been completed
    const completedCount = batchesCache.filter(b => b.status === "completed").length;
    
    // Only award badge if at least 5 batches have been completed
    if (completedCount >= 5 && !badges.includes("Completionist")) {
        badges.push("Completionist");
        await updateDoc(doc(db, "users", user.uid), { badges });
        alert("Achievement unlocked: Completionist badge earned!");
        await loadProfile();
    }
}

async function renderBadges(listEl, emptyEl) {
    const { db, fbDbApi } = await import("../src/firebase-config.js");
    const { doc, getDoc } = fbDbApi;
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    listEl.innerHTML = "";
    if (!badges.length) {
        emptyEl.classList.remove("hidden");
        return;
    }
    emptyEl.classList.add("hidden");
    badges.forEach(b => {
        const li = document.createElement("li");
        li.textContent = b;
        listEl.appendChild(li);
    });
}

// Export
function onExport() {
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const jsonStr = JSON.stringify({ userId: user.uid, batches: batchesCache }, null, 2);
    downloadFile(`harvestguard-${user.uid}.json`, jsonStr, "application/json");
    const csv = toCsv(batchesCache);
    downloadFile(`harvestguard-${user.uid}.csv`, csv, "text/csv");
}

function toCsv(batches) {
    const headers = ["cropType", "estimatedWeightKg", "harvestDate", "storageType",
        "storageLocationFreeText", "status", "riskStatus", "etclHours",
        "cropHealthStatus", "createdAt"];
    const lines = [headers.join(",")];
    batches.forEach(b => {
        const row = headers.map(h => JSON.stringify(b[h] ?? ""));
        lines.push(row.join(","));
    });
    return lines.join("\n");
}

function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// AI scanner hook
function updateLatestBatchHealth(status) {
    if (!batchesCache.length) return;
    const latest = batchesCache[batchesCache.length - 1];
    latest.cropHealthStatus = status;
    window.HG_offline?.saveBatches(batchesCache);
    renderBatches();
    if (navigator.onLine) {
        updateBatchStatusRemote(latest);
    } else {
        window.HG_offline?.enqueue({ type: "updateBatchStatus", data: latest });
    }
}

export { updateLatestBatchHealth };
