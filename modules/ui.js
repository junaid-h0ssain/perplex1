// modules/ui.js
export function initUI() {
    const navDashboard = document.getElementById("nav-dashboard");
    const navProfile = document.getElementById("nav-profile");
    const dashboardView = document.getElementById("dashboard-view");
    const profileView = document.getElementById("profile-view");
    const authSection = document.getElementById("auth-section");
    const mainSection = document.getElementById("main-section");

    navDashboard?.addEventListener("click", () => {
        dashboardView.classList.remove("hidden");
        profileView.classList.add("hidden");
    });

    navProfile?.addEventListener("click", () => {
        dashboardView.classList.add("hidden");
        profileView.classList.remove("hidden");
    });

    // Helpers to show/hide top-level sections
    window.HG_UI = {
        showAuth() {
            authSection?.classList.remove("hidden");
            mainSection?.classList.add("hidden");
        },
        showApp() {
            authSection?.classList.add("hidden");
            mainSection?.classList.remove("hidden");
        }
    };
}
