// modules/offline.js
const QUEUE_KEY = "hg_sync_queue";
const LOCAL_BATCHES_KEY = "hg_local_batches";

export function initOffline() {
    window.addEventListener("online", () => {
        if (window.HG_offline && typeof window.HG_offline.processQueue === "function") {
            window.HG_offline.processQueue();
        }
    });

    window.HG_offline = {
        enqueue,
        getQueue,
        clearQueue,
        saveBatches,
        loadBatches,
        processQueue: async () => {
            // batches.js will override this later when initialized
        }
    };
}

function getQueue() {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
        return [];
    }
}

function enqueue(op) {
    const q = getQueue();
    q.push(op);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function clearQueue() {
    localStorage.setItem(QUEUE_KEY, "[]");
}

function saveBatches(batches) {
    localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batches));
}

function loadBatches() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_BATCHES_KEY) || "[]");
    } catch {
        return [];
    }
}

export const OfflineKeys = {
    QUEUE_KEY,
    LOCAL_BATCHES_KEY
};
