// modules/profile.js
import { db, fbDbApi, auth, fbAuthApi } from "../src/firebase-config.js";
import { CLOUDINARY_CONFIG } from "../src/config.js";
const { doc, getDoc, updateDoc, setDoc } = fbDbApi;
const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = fbAuthApi;

export function initProfile() {
    const profileForm = document.getElementById("profile-form");
    const languageSelect = document.getElementById("language-select");
    const uploadPictureBtn = document.getElementById("upload-picture-btn");
    const removePictureBtn = document.getElementById("remove-picture-btn");
    const profilePictureInput = document.getElementById("profile-picture-input");
    const passwordForm = document.getElementById("password-form");

    // Password change handler
    passwordForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = window.HG.getCurrentUser();
        if (!user) {
            alert("You are not logged in.");
            return;
        }
        const currentPwd = document.getElementById("current-password").value;
        const newPwd = document.getElementById("new-password").value;

        // Validate inputs
        if (!currentPwd || !newPwd) {
            alert("Please fill in both password fields.");
            return;
        }

        if (newPwd.length < 6) {
            alert("New password must be at least 6 characters long.");
            return;
        }

        const cred = EmailAuthProvider.credential(user.email, currentPwd);
        try {
            console.log("Reauthenticating user...");
            await reauthenticateWithCredential(user, cred);
            console.log("Reauthentication successful, updating password...");
            await updatePassword(user, newPwd);
            console.log("Password update successful");
            alert("Password updated successfully.");
            passwordForm.reset();
        } catch (error) {
            console.error("Password update error:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            if (error.code === "auth/wrong-password") {
                alert("Current password is incorrect.");
            } else if (error.code === "auth/weak-password") {
                alert("New password is too weak. Use at least 6 characters.");
            } else if (error.code === "auth/requires-recent-login") {
                alert("Please log in again for security reasons, then try updating your password.");
            } else {
                alert("Password update failed. Please try again.");
            }
        }
    });

    // Profile picture upload handler
    uploadPictureBtn?.addEventListener("click", () => {
        profilePictureInput?.click();
    });

    profilePictureInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const user = window.HG.getCurrentUser();
        if (!user) {
            alert("You are not logged in.");
            return;
        }

        const uploadStatus = document.getElementById("upload-status");
        uploadStatus.textContent = "Uploading...";
        uploadStatus.style.color = "#666";

        try {
            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
            formData.append("folder", `harvestguard/profiles/${user.uid}`);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Cloudinary upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            const imageUrl = data.secure_url;

            // Save URL to Firestore
            await setDoc(doc(db, "users", user.uid), { profilePictureUrl: imageUrl }, { merge: true });

            // Update UI
            await loadProfile();
            uploadStatus.textContent = "Picture uploaded successfully!";
            uploadStatus.style.color = "#4cc896";
            setTimeout(() => {
                uploadStatus.textContent = "";
            }, 3000);
        } catch (error) {
            console.error("Error uploading picture:", error);
            uploadStatus.textContent = "Error uploading picture: " + error.message;
            uploadStatus.style.color = "#ff6363";
        }

        // Reset file input
        profilePictureInput.value = "";
    });

    removePictureBtn?.addEventListener("click", async () => {
        const user = window.HG.getCurrentUser();
        if (!user) {
            alert("You are not logged in.");
            return;
        }

        if (!confirm("Are you sure you want to remove your profile picture?")) return;

        const uploadStatus = document.getElementById("upload-status");
        uploadStatus.textContent = "Removing...";
        uploadStatus.style.color = "#666";

        try {
            // Remove URL from Firestore
            await setDoc(doc(db, "users", user.uid), { profilePictureUrl: null }, { merge: true });

            // Update UI
            await loadProfile();
            uploadStatus.textContent = "Picture removed successfully!";
            uploadStatus.style.color = "#4cc896";
            setTimeout(() => {
                uploadStatus.textContent = "";
            }, 3000);
        } catch (error) {
            console.error("Error removing picture:", error);
            uploadStatus.textContent = "Error removing picture: " + error.message;
            uploadStatus.style.color = "#ff6363";
        }
    });

    profileForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Profile form submitted");
        const user = window.HG.getCurrentUser();
        if (!user) {
            console.error("No current user found!");
            alert("You are not logged in.");
            return;
        }
        console.log("Updating profile for user:", user.uid);
        const name = document.getElementById("edit-name").value.trim();
        const phone = document.getElementById("edit-phone").value.trim();
        const bio = document.getElementById("edit-bio").value.trim();
        const division = document.getElementById("edit-division")?.value || "";
        const district = document.getElementById("edit-district")?.value || "";
        const upazila = document.getElementById("edit-upazila")?.value || "";

        try {
            await setDoc(doc(db, "users", user.uid), {
                name, phone, bio, division, district, upazila, onboardingCompleted: true
            }, { merge: true });
            await loadProfile();
            alert("Profile updated.");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error updating profile: " + error.message);
        }
    });

    languageSelect?.addEventListener("change", async () => {
        const user = window.HG.getCurrentUser();
        const lang = languageSelect.value;
        localStorage.setItem("hg_lang", lang);
        if (user) {
            try {
                await setDoc(doc(db, "users", user.uid), { language: lang }, { merge: true });
            } catch {
                // ignore
            }
        }
    });

    window.HG_profile = { loadProfile };
}

export async function loadProfile() {
    const user = window.HG.getCurrentUser();
    if (!user) return;

    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profilePhone = document.getElementById("profile-phone");
    const profileBio = document.getElementById("profile-bio");
    const profileCreated = document.getElementById("profile-created");
    const profilePicture = document.getElementById("profile-picture");
    const noPictureText = document.getElementById("no-picture-text");
    const removePictureBtn = document.getElementById("remove-picture-btn");

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
        const data = snap.data();
        profileName.textContent = data.name || "";
        profileEmail.textContent = data.email || user.email;
        profilePhone.textContent = data.phone || "";
        profileBio.textContent = data.bio || "";
        profileCreated.textContent = data.createdAt || "";
        document.getElementById("edit-name").value = data.name || "";
        document.getElementById("edit-phone").value = data.phone || "";
        document.getElementById("edit-bio").value = data.bio || "";
        const languageSelect = document.getElementById("language-select");
        if (languageSelect && data.language) languageSelect.value = data.language;

        // Load profile picture
        if (data.profilePictureUrl) {
            profilePicture.src = data.profilePictureUrl;
            profilePicture.style.display = "block";
            noPictureText.style.display = "none";
            removePictureBtn.style.display = "block";
        } else {
            profilePicture.style.display = "none";
            noPictureText.style.display = "block";
            removePictureBtn.style.display = "none";
        }
    }
}
