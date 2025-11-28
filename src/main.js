// main.js
import { initAuth } from "../modules/auth.js";
import { initProfile } from "../modules/profile.js";
import { initBatches } from "../modules/batches.js";
import { initWeather } from "../modules/weather.js";
import { initAiScanner } from "../modules/aiScan.js";
import { initOffline } from "../modules/offline.js";
import { initUI } from "../modules/ui.js";
import { auth } from "./firebase-config.js";

let currentUser = null;

function setCurrentUser(user) {
    currentUser = user;
}

function getCurrentUser() {
    return currentUser;
}

window.HG = { getCurrentUser }; // simple global accessor

async function bootstrap() {
    initUI();
    initOffline();
    initAuth(setCurrentUser);
    initProfile();
    initBatches();
    initWeather();
    initAiScanner();
}

bootstrap();
