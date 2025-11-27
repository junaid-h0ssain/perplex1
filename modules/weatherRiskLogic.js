// modules/weatherRiskLogic.js
export function calculateETCL(batch, forecastList) {
    let etcl = 120;
    const last48 = forecastList.slice(0, 16); // 3-hour steps * 16 ≈ 48h
    const next72 = forecastList.slice(0, 24); // ≈ 72h

    const avgHum = average(last48.map(i => i.main.humidity));
    const avgTemp = average(last48.map(i => i.main.temp));
    const maxRainProb = Math.max(...next72.map(i => (i.pop || 0) * 100));

    if (avgHum > 80) etcl -= 24;
    if (avgHum > 90) etcl -= 24;
    if (avgTemp > 32) etcl -= 12;
    if (maxRainProb > 60) etcl -= 24;
    if (batch.storageType === "Open Area") etcl -= 24;
    if (batch.storageType === "Jute Bag Stack") etcl -= 12;

    if (etcl < 24) return { etcl: 24, level: "high" };
    if (etcl < 72) return { etcl, level: "medium" };
    return { etcl, level: "low" };
}

function average(arr) {
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + x, 0) / arr.length;
}
