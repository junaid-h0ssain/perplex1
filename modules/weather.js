// modules/weather.js
import { WEATHER_CONFIG } from "../src/config.js";

// Example: static mapping of district -> coordinates
const DISTRICT_COORDS = {
    "Dhaka": { lat: 23.8103, lon: 90.4125 },
    "Chattogram": { lat: 22.3569, lon: 91.7832 },
    "Rajshahi": { lat: 24.3745, lon: 88.6042 },
    "Khulna": { lat: 22.8456, lon: 89.5403 },
    "Sylhet": { lat: 24.8949, lon: 91.8687 },
    "Barisal": { lat: 22.7010, lon: 90.3535 },
    "Rangpur": { lat: 25.7439, lon: 89.2752 },
    "Mymensingh": { lat: 24.7471, lon: 90.4203 }
};

export function initWeather() {
    window.HG_weather = {
        fetchAndRenderWeather,
        updateBatchRiskFromWeather
    };
}

async function fetchWeatherForDistrict(district) {
    const coords = DISTRICT_COORDS[district];
    if (!coords) return null;

    const url = `${WEATHER_CONFIG.baseUrl}?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_CONFIG.apiKey}&units=metric`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error("Weather fetch error:", err);
        return null;
    }
}

async function fetchAndRenderWeather() {
    const user = window.HG.getCurrentUser();
    if (!user) return;

    const weatherPanel = document.getElementById("weather-panel");
    if (!weatherPanel) return;

    const userData = await getUserData(user.uid);
    if (!userData?.district) {
        weatherPanel.textContent = "জেলা নির্বাচন করুন।";
        return;
    }

    const data = await fetchWeatherForDistrict(userData.district);
    if (!data || !data.list) {
        weatherPanel.textContent = "আবহাওয়া তথ্য পাওয়া যায়নি।";
        return;
    }

    const daily = aggregateToDaily(data.list);
    weatherPanel.innerHTML = "";

    daily.slice(0, 5).forEach(day => {
        const div = document.createElement("div");
        const advice = makeBanglaAdvice(day);
        div.className = "weather-day";
        div.innerHTML = `
      <p>${new Date(day.dt * 1000).toLocaleDateString("bn-BD")}</p>
      <p>তাপমাত্রা: ${Math.round(day.temp)}°C</p>
      <p>আর্দ্রতা: ${Math.round(day.humidity)}%</p>
      <p>বৃষ্টি সম্ভাবনা: ${Math.round(day.rainProb)}%</p>
      <p class="weather-advice">${advice}</p>
    `;
        weatherPanel.appendChild(div);
    });
}

// Aggregate 3-hour forecast into daily averages
function aggregateToDaily(list) {
    const byDay = {};

    list.forEach(item => {
        const dateKey = item.dt_txt.split(" ")[0];
        if (!byDay[dateKey]) byDay[dateKey] = [];
        byDay[dateKey].push(item);
    });

    return Object.keys(byDay).map(dateKey => {
        const items = byDay[dateKey];
        const avg = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;

        return {
            dt: Math.floor(new Date(dateKey).getTime() / 1000),
            temp: avg(items.map(i => i.main.temp)),
            humidity: avg(items.map(i => i.main.humidity)),
            rainProb: avg(items.map(i => (i.pop || 0) * 100))
        };
    });
}

function makeBanglaAdvice(day) {
    if (day.humidity > 85 && day.rainProb > 60) {
        return "আর্দ্রতা ও বৃষ্টির সম্ভাবনা বেশি; শস্য ঘরের ভিতরে শুকান ও বাতাস চলাচল নিশ্চিত করুন।";
    }
    if (day.temp > 32 && day.humidity < 60) {
        return "তাপমাত্রা বেশি; দ্রুত শুকানোর ব্যবস্থা করুন এবং আর্দ্রতা পরীক্ষা করুন।";
    }
    if (day.humidity > 75) {
        return "আর্দ্রতা বেশি; ফসল নিয়মিত পরীক্ষা করুন।";
    }
    return "পরিস্থিতি মাঝারি; নিয়মিত শস্য পরীক্ষা করুন।";
}

// Risk update for batches using weather data
async function updateBatchRiskFromWeather(batches) {
    const user = window.HG.getCurrentUser();
    if (!user) return batches;

    const userData = await getUserData(user.uid);
    if (!userData?.district) return batches;

    const data = await fetchWeatherForDistrict(userData.district);
    if (!data || !data.list) return batches;

    const forecastList = data.list;
    const updated = batches.map(b => {
        if (b.status !== "active") return b;

        const { etcl, level } = calculateETCL(b, forecastList);
        return {
            ...b,
            etclHours: etcl,
            riskStatus: level,
            lastRiskSummaryBn: makeRiskSummaryBn(b, etcl, level)
        };
    });

    if (window.HG_offline) window.HG_offline.saveBatches(updated);
    return updated;
}

function makeRiskSummaryBn(batch, etcl, level) {
    if (level === "high") {
        return `উচ্চ ঝুঁকি, ETCL ${etcl} ঘন্টা; ফসল দ্রুত শুকিয়ে নিরাপদ গুদামে নিন।`;
    }
    if (level === "medium") {
        return `মধ্যম ঝুঁকি, ETCL ${etcl} ঘন্টা; নিয়মিত আর্দ্রতা পরীক্ষা করুন।`;
    }
    return `কম ঝুঁকি, ETCL ${etcl} ঘন্টা; বর্তমান সংরক্ষণ ভালো।`;
}

// ETCL calculation logic
function calculateETCL(batch, forecastList) {
    let etcl = 120; // base hours

    const last48 = forecastList.slice(0, 16); // ~48 hours (3-hour intervals)
    const next72 = forecastList.slice(0, 24); // ~72 hours

    const avgHum = average(last48.map(i => i.main?.humidity || 0));
    const avgTemp = average(last48.map(i => i.main?.temp || 0));
    const maxRainProb = Math.max(...next72.map(i => (i.pop || 0) * 100));

    // Apply risk factors
    if (avgHum > 80) etcl -= 24;
    if (avgHum > 90) etcl -= 24;
    if (avgTemp > 32) etcl -= 12;
    if (maxRainProb > 60) etcl -= 24;

    // Storage type factors
    if (batch.storageType === "Open Area") etcl -= 24;
    if (batch.storageType === "Jute Bag Stack") etcl -= 12;

    // Determine risk level
    if (etcl < 24) return { etcl: 24, level: "high" };
    if (etcl < 72) return { etcl, level: "medium" };
    return { etcl, level: "low" };
}

function average(arr) {
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + x, 0) / arr.length;
}

// Helper to get user data
async function getUserData(uid) {
    try {
        const { db, fbDbApi } = await import("../src/firebase-config.js");
        const { doc, getDoc } = fbDbApi;
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? snap.data() : null;
    } catch (err) {
        console.error("Error fetching user data:", err);
        return null;
    }
}
