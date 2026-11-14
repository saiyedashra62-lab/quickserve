import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);

const profileForm = $("profileForm");
const displayNameInput = $("displayName");
const profileName = $("profileName");
const profileEmail = $("profileEmail");
const emailAddress = $("emailAddress");
const profileAvatar = $("profileAvatar");
const profileStatus = $("profileStatus");
const profileMessage = $("profileMessage");
const accountCreated = $("accountCreated");
const logoutButton = $("logoutButton");
const saveProfileButton = $("saveProfileButton");

let currentUser = null;

function showMessage(message, type = "info") {
  if (!profileMessage) return;

  profileMessage.textContent = message;
  profileMessage.dataset.type = type;
}

function updateProfileUI(user) {
  if (!user) return;

  const name = user.displayName || "QuickServe Member";
  const email = user.email || "Email not available";

  if (profileName) profileName.textContent = name;
  if (profileEmail) profileEmail.textContent = email;
  if (displayNameInput) displayNameInput.value = user.displayName || "";
  if (emailAddress) emailAddress.value = email;

  if (profileAvatar) {
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  }

  if (profileStatus) {
    profileStatus.textContent = "Account active";
  }

  if (accountCreated) {
    accountCreated.textContent = user.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString()
      : "Not available";
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    updateProfileUI(user);
    showMessage("Your profile is ready.", "success");
  } else {
    if (profileName) profileName.textContent = "Guest User";
    if (profileEmail) profileEmail.textContent = "Please sign in";
    if (profileStatus) profileStatus.textContent = "Not signed in";
    if (profileAvatar) profileAvatar.textContent = "G";
    showMessage("Please sign in to manage your profile.", "error");

    if (profileForm) {
      profileForm.querySelectorAll("input, button").forEach((item) => {
        item.disabled = true;
      });
    }
  }
});

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage("Please sign in first.", "error");
      return;
    }

    const newName = displayNameInput?.value.trim();

    if (!newName) {
      showMessage("Please enter your name.", "error");
      return;
    }

    if (saveProfileButton) {
      saveProfileButton.disabled = true;
      saveProfileButton.textContent = "Saving...";
    }

    try {
      await updateProfile(currentUser, {
        displayName: newName
      });

      updateProfileUI(currentUser);
      showMessage("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Profile update error:", error);
      showMessage(error.message || "Could not update profile.", "error");
    } finally {
      if (saveProfileButton) {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Save Changes";
      }
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
      showMessage("Could not sign out. Please try again.", "error");
    }
  });
}

const year = $("year");
if (year) year.textContent = new Date().getFullYear();
