// modules/auth.js
import { auth, db, fbAuthApi, fbDbApi } from "../src/firebase-config.js";
const { onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, sendPasswordResetEmail, signOut } = fbAuthApi;
const { doc, setDoc, getDoc } = fbDbApi;

export function initAuth(setCurrentUser) {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const showRegisterBtn = document.getElementById("show-register");
    const showLoginBtn = document.getElementById("show-login");
    const resetPasswordBtn = document.getElementById("reset-password-btn");
    const logoutBtn = document.getElementById("logout-btn");
    
    // Extra buttons for OTP/Google login
    const sendOtpBtn = document.getElementById("send-otp-btn");
    const googleLoginBtn = document.getElementById("google-login-btn");

    showRegisterBtn?.addEventListener("click", () => {
        document.getElementById("login-card").classList.add("hidden");
        document.getElementById("register-card").classList.remove("hidden");
    });

    showLoginBtn?.addEventListener("click", () => {
        document.getElementById("register-card").classList.add("hidden");
        document.getElementById("login-card").classList.remove("hidden");
    });

    registerForm?.addEventListener("submit", async (e) => {
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
                language,
                createdAt,
                badges: [],
                division: "",
                district: "",
                upazila: "",
                onboardingCompleted: false
            });
            alert("Account created.");
        } catch (err) {
            if (err.code === "auth/email-already-in-use") {
                alert("Email already registered.");
            } else {
                alert("Registration error.");
            }
        }
    });

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch {
            alert("Invalid credentials.");
        }
    });

    resetPasswordBtn?.addEventListener("click", async () => {
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

    logoutBtn?.addEventListener("click", async () => {
        await signOut(auth);
    });

    // Stub handlers for OTP/Google login (implement later with Firebase providers)
    sendOtpBtn?.addEventListener("click", () => {
        alert("Phone OTP login not implemented yet.");
    });

    googleLoginBtn?.addEventListener("click", () => {
        alert("Google login not implemented yet.");
    });

    onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (!window.HG_UI) return;
        if (user) {
            localStorage.setItem('harvestguard_user', user.uid);
            window.HG_UI.showApp();
            if (window.HG_batches) {
                window.HG_batches.initUserData();
            }
            if (window.HG_profile) {
                window.HG_profile.loadProfile();
            }
        } else {
            localStorage.removeItem('harvestguard_user');
            window.HG_UI.showAuth();
        }
    });
}
