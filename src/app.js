// app.js
import { app, auth, db, fbAuthApi, fbDbApi } from "./firebase-config.js";
import { CLOUDINARY_CONFIG, HF_CONFIG } from "./config.js";

const {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} = fbAuthApi;

const {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    addDoc,
    query,
    where,
    updateDoc,
    onSnapshot
} = fbDbApi;

// DOM elements
const authSection = document.getElementById("auth-section");
const mainSection = document.getElementById("main-section");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showRegisterBtn = document.getElementById("show-register");
const showLoginBtn = document.getElementById("show-login");
const resetPasswordBtn = document.getElementById("reset-password-btn");
const logoutBtn = document.getElementById("logout-btn");

const navDashboard = document.getElementById("nav-dashboard");
const navProfile = document.getElementById("nav-profile");
const dashboardView = document.getElementById("dashboard-view");
const profileView = document.getElementById("profile-view");

const batchForm = document.getElementById("batch-form");
const activeBatchesDiv = document.getElementById("active-batches");
const noBatchesMsg = document.getElementById("no-batches-msg");
const badgesList = document.getElementById("badges-list");
const noBadgesMsg = document.getElementById("no-badges-msg");
const alertsContainer = document.getElementById("alerts-container");
const exportBtn = document.getElementById("export-btn");

const statActive = document.getElementById("stat-active");
const statCompleted = document.getElementById("stat-completed");
const statMitigated = document.getElementById("stat-mitigated");
const statWeight = document.getElementById("stat-weight");

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profilePhone = document.getElementById("profile-phone");
const profileBio = document.getElementById("profile-bio");
const profileCreated = document.getElementById("profile-created");
const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");

const languageSelect = document.getElementById("language-select");

// Offline queue key
const QUEUE_KEY = "hg_sync_queue";
const LOCAL_BATCHES_KEY = "hg_local_batches";

// Basic language packs (English/Bengali)
const LANG = {
    en: {
        noBatches: "No active batches.",
        noBadges: "No badges earned yet.",
        riskMitigatedBadge: "Risk Mitigated Expert",
        firstHarvestBadge: "First Harvest Logged",
        lostStatus: "lost",
        mitigatedStatus: "mitigated",
        activeStatus: "active",
        completedStatus: "completed"
    },
    bn: {
        noBatches: "কোনো সক্রিয় ব্যাচ নেই।",
        noBadges: "এখনও কোনো ব্যাজ অর্জিত হয়নি।",
        riskMitigatedBadge: "ঝুঁকি মোকাবিলা বিশেষজ্ঞ",
        firstHarvestBadge: "প্রথম ফসল লগ করা হয়েছে",
        lostStatus: "নষ্ট",
        mitigatedStatus: "প্রতিরোধ করা হয়েছে",
        activeStatus: "সক্রিয়",
        completedStatus: "সম্পন্ন"
    }
};

let currentUser = null;
let currentLang = "en";
let batchesCache = []; // local in-memory

// Language handling (Req 6)
function loadLanguagePreference(user) {
    const fromLocal = localStorage.getItem("hg_lang");
    if (fromLocal) {
        currentLang = fromLocal;
    }
    if (user && user.uid) {
        // user-specific lang from profile if exists
        getDoc(doc(db, "users", user.uid)).then(snap => {
            if (snap.exists() && snap.data().language) {
                currentLang = snap.data().language;
            }
            languageSelect.value = currentLang;
            applyLanguage();
        }).catch(() => {
            languageSelect.value = currentLang;
            applyLanguage();
        });
    } else {
        languageSelect.value = currentLang;
        applyLanguage();
    }
}

function applyLanguage() {
    const l = LANG[currentLang];
    if (!l) return;
    noBatchesMsg.textContent = l.noBatches;
    noBadgesMsg.textContent = l.noBadges;
    localStorage.setItem("hg_lang", currentLang);
}

// Auth UI switches
showRegisterBtn.addEventListener("click", () => {
    document.getElementById("login-card").classList.add("hidden");
    document.getElementById("register-card").classList.remove("hidden");
});

showLoginBtn.addEventListener("click", () => {
    document.getElementById("register-card").classList.add("hidden");
    document.getElementById("login-card").classList.remove("hidden");
});

// Requirement 1: Authentication
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const phone = document.getElementById("reg-phone").value.trim();
    const language = document.getElementById("reg-language").value || "en";

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        const createdAt = new Date().toISOString();

        await setDoc(doc(db, "users", user.uid), {
            name,
            email,
            phone,
            bio: "",
            language,
            createdAt,
            badges: []
        });

        currentLang = language;
        localStorage.setItem("hg_lang", currentLang);
        alert("Account created.");
    } catch (err) {
        if (err.code === "auth/email-already-in-use") {
            alert("Email already registered.");
        } else {
            alert("Registration error.");
        }
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert("Invalid credentials.");
    }
});

resetPasswordBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    if (!email) {
        alert("Enter your email first.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent.");
    } catch {
        alert("Could not send reset email.");
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

// Auth state handling + navigation (Req 10)
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        authSection.classList.add("hidden");
        mainSection.classList.remove("hidden");
        loadLanguagePreference(user);
        initUserData();
    } else {
        mainSection.classList.add("hidden");
        authSection.classList.remove("hidden");
    }
});

navDashboard.addEventListener("click", () => {
    dashboardView.classList.remove("hidden");
    profileView.classList.add("hidden");
});

navProfile.addEventListener("click", () => {
    dashboardView.classList.add("hidden");
    profileView.classList.remove("hidden");
});

// Profile management (Req 8)
async function loadProfile() {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) {
        const data = snap.data();
        profileName.textContent = data.name || "";
        profileEmail.textContent = data.email || currentUser.email;
        profilePhone.textContent = data.phone || "";
        profileBio.textContent = data.bio || "";
        profileCreated.textContent = data.createdAt || "";
        document.getElementById("edit-name").value = data.name || "";
        document.getElementById("edit-phone").value = data.phone || "";
        document.getElementById("edit-bio").value = data.bio || "";
    }
}

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const name = document.getElementById("edit-name").value.trim();
    const phone = document.getElementById("edit-phone").value.trim();
    const bio = document.getElementById("edit-bio").value.trim();
    try {
        await updateDoc(doc(db, "users", currentUser.uid), { name, phone, bio });
        await loadProfile();
        alert("Profile updated.");
    } catch {
        alert("Error updating profile.");
    }
});

passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const currentPwd = document.getElementById("current-password").value;
    const newPwd = document.getElementById("new-password").value;
    const cred = EmailAuthProvider.credential(currentUser.email, currentPwd);
    try {
        await reauthenticateWithCredential(currentUser, cred);
        await updatePassword(currentUser, newPwd);
        alert("Password updated.");
    } catch {
        alert("Password update failed.");
    }
});

// Language selector
languageSelect.addEventListener("change", async () => {
    currentLang = languageSelect.value;
    applyLanguage();
    if (currentUser) {
        try {
            await updateDoc(doc(db, "users", currentUser.uid), { language: currentLang });
        } catch {
            // ignore
        }
    }
});

// Batch management (Req 2 + 5)
batchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const crop = document.getElementById("batch-crop").value.trim();
    const weight = parseFloat(document.getElementById("batch-weight").value);
    const date = document.getElementById("batch-date").value;
    const storage = document.getElementById("batch-storage").value.trim();
    const location = document.getElementById("batch-location").value.trim();
    const imageFile = document.getElementById("batch-image").files[0];

    const newBatch = {
        userId: currentUser.uid,
        crop,
        weight,
        harvestDate: date,
        storageType: storage,
        location,
        status: "active",
        createdAt: new Date().toISOString(),
        imageUrl: null,
        riskStatus: null
    };

    try {
        if (imageFile) {
            const imgUrl = await uploadToCloudinary(imageFile);
            newBatch.imageUrl = imgUrl;
        }
    } catch {
        alert("Image upload failed, saving batch without image.");
    }

    batchesCache.push(newBatch);
    saveLocalBatches();
    renderBatches();
    awardFirstHarvestBadge();

    if (navigator.onLine) {
        await pushBatchToFirestore(newBatch);
    } else {
        enqueueOperation({ type: "addBatch", data: newBatch });
    }

    batchForm.reset();
});

// Cloudinary upload (image storage)
async function uploadToCloudinary(file) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    const res = await fetch(url, {
        method: "POST",
        body: data
    });
    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload failed");
    return json.secure_url;
}

// Firestore sync helpers
async function pushBatchToFirestore(batch) {
    const colRef = collection(db, "batches");
    await addDoc(colRef, batch);
}

function enqueueOperation(op) {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(op);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function processQueue() {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (!queue.length || !navigator.onLine || !currentUser) return;
    for (const op of queue) {
        try {
            if (op.type === "addBatch") {
                await pushBatchToFirestore(op.data);
            } else if (op.type === "updateBatchStatus") {
                await updateBatchStatusRemote(op.data.id, op.data.status, op.data.riskStatus);
            }
        } catch {
            // leave in queue
        }
    }
    localStorage.setItem(QUEUE_KEY, "[]");
}

window.addEventListener("online", processQueue);

// Local batches storage
function saveLocalBatches() {
    localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batchesCache));
}

function loadLocalBatches() {
    const raw = localStorage.getItem(LOCAL_BATCHES_KEY);
    if (raw) {
        try {
            batchesCache = JSON.parse(raw);
        } catch {
            batchesCache = [];
        }
    } else {
        batchesCache = [];
    }
}

// Render batches & analytics (Req 2, 9)
function renderBatches() {
    activeBatchesDiv.innerHTML = "";
    const active = batchesCache.filter(b => b.status === "active" || b.status === "mitigated" || b.status === "lost");
    if (!active.length) {
        noBatchesMsg.classList.remove("hidden");
    } else {
        noBatchesMsg.classList.add("hidden");
    }
    active.forEach((batch, idx) => {
        const div = document.createElement("div");
        div.className = "batch-card";
        div.innerHTML = `
      <p><strong>${batch.crop}</strong> (${batch.weight} kg)</p>
      <p>Date: ${batch.harvestDate}</p>
      <p>Storage: ${batch.storageType}</p>
      <p>Location: ${batch.location}</p>
      <p>Status: ${batch.status}</p>
      ${batch.imageUrl ? `<img src="${batch.imageUrl}" class="batch-img" />` : ""}
      <button data-idx="${idx}" class="complete-btn">Mark completed</button>
    `;
        activeBatchesDiv.appendChild(div);
    });

    activeBatchesDiv.querySelectorAll(".complete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            markBatchCompleted(idx);
        });
    });

    updateAnalytics();
    renderAlerts();
    renderBadges();
}

function updateAnalytics() {
    const active = batchesCache.filter(b => b.status === "active");
    const completed = batchesCache.filter(b => b.status === "completed");
    const mitigated = batchesCache.filter(b => b.riskStatus === "mitigated");
    const totalWeight = batchesCache.reduce((sum, b) => sum + (b.weight || 0), 0);
    statActive.textContent = active.length;
    statCompleted.textContent = completed.length;
    statMitigated.textContent = mitigated.length;
    statWeight.textContent = totalWeight.toFixed(2);
}

function markBatchCompleted(idx) {
    const batch = batchesCache[idx];
    batch.status = "completed";
    saveLocalBatches();
    renderBatches();
    if (navigator.onLine) {
        updateBatchStatusRemoteByFields(batch);
    } else {
        enqueueOperation({ type: "updateBatchStatus", data: { id: batch.id || null, status: "completed" } });
    }
}

async function updateBatchStatusRemoteByFields(batch) {
    // For simplicity, try to find Firestore doc matching userId+createdAt
    const q = query(collection(db, "batches"),
        where("userId", "==", currentUser.uid),
        where("createdAt", "==", batch.createdAt)
    );
    const snaps = await getDocs(q);
    snaps.forEach(async (d) => {
        await updateDoc(doc(db, "batches", d.id), {
            status: batch.status,
            riskStatus: batch.riskStatus || null
        });
    });
}

async function updateBatchStatusRemote(id, status, riskStatus) {
    // optional if you store doc IDs in cache
    await updateDoc(doc(db, "batches", id), { status, riskStatus });
}

// Gamification (Req 7)
async function awardFirstHarvestBadge() {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    const label = LANG[currentLang].firstHarvestBadge;
    if (!badges.includes(label)) {
        badges.push(label);
        await updateDoc(doc(db, "users", currentUser.uid), { badges });
        renderBadgesFromData(badges);
    }
}

async function awardRiskMitigatedBadge() {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const badges = data.badges || [];
    const label = LANG[currentLang].riskMitigatedBadge;
    if (!badges.includes(label)) {
        badges.push(label);
        await updateDoc(doc(db, "users", currentUser.uid), { badges });
        renderBadgesFromData(badges);
    }
}

async function loadBadges() {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (!snap.exists()) return;
    renderBadgesFromData(snap.data().badges || []);
}

function renderBadgesFromData(badges) {
    badgesList.innerHTML = "";
    if (!badges.length) {
        noBadgesMsg.classList.remove("hidden");
        return;
    }
    noBadgesMsg.classList.add("hidden");
    badges.forEach(b => {
        const li = document.createElement("li");
        li.textContent = b;
        badgesList.appendChild(li);
    });
}

function renderBadges() {
    // keep UI in sync with last loaded badge data
    loadBadges();
}

// Risk detection + alerts (Req 3 + simple HF usage)
async function runRiskDetection() {
    // Example: send concatenated batch description to HF sentiment model and treat negative as high risk
    if (!navigator.onLine) return;
    for (const batch of batchesCache) {
        if (batch.status !== "active") continue;
        const text = `${batch.crop} at ${batch.location} stored in ${batch.storageType}`;
        try {
            const res = await fetch(HF_CONFIG.apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HF_CONFIG.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: text })
            });
            const json = await res.json();
            const label = json[0]?.label || "";
            if (label.toLowerCase().includes("negative")) {
                batch.riskStatus = "high";
            } else {
                batch.riskStatus = "low";
            }
        } catch {
            // ignore HF errors
        }
    }
    saveLocalBatches();
    renderAlerts();
}

function renderAlerts() {
    alertsContainer.innerHTML = "";
    const highRisk = batchesCache.filter(b => b.riskStatus === "high" && b.status === "active");
    highRisk.forEach((batch, idx) => {
        const div = document.createElement("div");
        div.className = "alert-card";
        div.innerHTML = `
      <p>High moisture risk detected for ${batch.crop} at ${batch.location}.</p>
      <p>Suggested actions: dry, move to ventilated storage, treat with recommended method.</p>
      <button data-idx="${idx}" class="mitigate-btn">Accept mitigation</button>
      <button data-idx="${idx}" class="ignore-btn">Ignore alert</button>
    `;
        alertsContainer.appendChild(div);
    });

    alertsContainer.querySelectorAll(".mitigate-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            handleMitigation(idx);
        });
    });
    alertsContainer.querySelectorAll(".ignore-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            handleIgnore(idx);
        });
    });
}

function handleMitigation(idx) {
    const riskBatches = batchesCache.filter(b => b.riskStatus === "high" && b.status === "active");
    const batch = riskBatches[idx];
    if (!batch) return;
    batch.status = "mitigated";
    batch.riskStatus = "mitigated";
    saveLocalBatches();
    renderBatches();
    awardRiskMitigatedBadge();
    if (navigator.onLine) {
        updateBatchStatusRemoteByFields(batch);
    } else {
        enqueueOperation({ type: "updateBatchStatus", data: { id: batch.id || null, status: "mitigated", riskStatus: "mitigated" } });
    }
}

function handleIgnore(idx) {
    const riskBatches = batchesCache.filter(b => b.riskStatus === "high" && b.status === "active");
    const batch = riskBatches[idx];
    if (!batch) return;
    batch.status = "lost";
    batch.riskStatus = "lost";
    saveLocalBatches();
    renderBatches();
    if (navigator.onLine) {
        updateBatchStatusRemoteByFields(batch);
    } else {
        enqueueOperation({ type: "updateBatchStatus", data: { id: batch.id || null, status: "lost", riskStatus: "lost" } });
    }
}

// Data export (Req 4)
exportBtn.addEventListener("click", () => {
    if (!currentUser) return;
    const exportObj = {
        userId: currentUser.uid,
        batches: batchesCache
    };

    const jsonStr = JSON.stringify(exportObj, null, 2);
    downloadFile(`harvestguard-${currentUser.uid}.json`, jsonStr, "application/json");

    const csv = batchesToCsv(batchesCache);
    downloadFile(`harvestguard-${currentUser.uid}.csv`, csv, "text/csv");
});

function batchesToCsv(batches) {
    const headers = ["crop", "weight", "harvestDate", "storageType", "location", "status", "riskStatus", "createdAt"];
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

// Initialization
async function initUserData() {
    loadLocalBatches();
    renderBatches();
    await loadProfile();
    await processQueue();
    runRiskDetection();
}
