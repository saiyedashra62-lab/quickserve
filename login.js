import { auth, googleProvider } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);

const loginForm = $("loginForm");
const signupForm = $("signupForm");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const authTitle = $("authTitle");
const authSubtitle = $("authSubtitle");
const authMessage = $("authMessage");
const googleLogin = $("googleLogin");

let currentMode = "login";

function showMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.dataset.type = type;
}

function setLoading(button, loading, normalText) {
  button.disabled = loading;
  button.textContent = loading ? "Please wait..." : normalText;
}

function switchMode(mode) {
  currentMode = mode;

  const isLogin = mode === "login";

  loginForm.hidden = !isLogin;
  signupForm.hidden = isLogin;

  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", !isLogin);

  authTitle.textContent = isLogin ? "Welcome Back" : "Create Your Account";
  authSubtitle.textContent = isLogin
    ? "Sign in to continue your journey."
    : "Join QuickServe and start exploring.";

  showMessage("");
}

loginTab.addEventListener("click", () => switchMode("login"));
signupTab.addEventListener("click", () => switchMode("signup"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const button = $("loginSubmit");

  setLoading(button, true, "Sign In");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    showMessage("Login successful! Redirecting...", "success");

    window.location.href = "profile.html";
  } catch (error) {
    console.error("Login error:", error);
    showMessage(getFriendlyError(error), "error");
  } finally {
    setLoading(button, false, "Sign In");
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;
  const button = $("signupSubmit");

  if (name.length < 2) {
    showMessage("Please enter a valid name.", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters.", "error");
    return;
  }

  setLoading(button, true, "Create Account");

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(result.user, {
      displayName: name
    });

    showMessage("Account created! Redirecting...", "success");

    window.location.href = "profile.html";
  } catch (error) {
    console.error("Signup error:", error);
    showMessage(getFriendlyError(error), "error");
  } finally {
    setLoading(button, false, "Create Account");
  }
});

googleLogin.addEventListener("click", async () => {
  googleLogin.disabled = true;
  googleLogin.textContent = "Connecting to Google...";

  try {
    await signInWithPopup(auth, googleProvider);

    showMessage("Google sign-in successful!", "success");

    window.location.href = "profile.html";
  } catch (error) {
    console.error("Google sign-in error:", error);
    showMessage(getFriendlyError(error), "error");
  } finally {
    googleLogin.disabled = false;
    googleLogin.innerHTML =
      '<span class="google-symbol">G</span> Continue with Google';
  }
});

function getFriendlyError(error) {
  const messages = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "This email already has an account. Please login.",
    "auth/weak-password": "Please choose a stronger password.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Popup blocked. Please allow popups and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later."
  };

  return messages[error.code] || error.message || "Something went wrong.";
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Signed in:", user.email);
  }
});
