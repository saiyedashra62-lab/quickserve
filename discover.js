
import { auth, db, googleProvider } from "./firebase.js";

import {
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const toolsGrid = document.getElementById("toolsGrid");
const blogsGrid = document.getElementById("blogsGrid");
const suggestForm = document.getElementById("suggestForm");
const suggestMessage = document.getElementById("suggestMessage");
const suggestBtn = document.getElementById("suggestBtn");

let allTools = [];
let allBlogs = [];

document.getElementById("year").textContent =
  new Date().getFullYear();

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// TOOL CARDS
function displayTools(category = "all") {
  toolsGrid.replaceChildren();

  const filtered = category === "all"
    ? allTools
    : allTools.filter(tool =>
        String(tool.category || "").toLowerCase() === category
      );

  if (!filtered.length) {
    const message = document.createElement("p");
    message.className = "loading";
    message.textContent = "No tools available in this category yet.";
    toolsGrid.appendChild(message);
    return;
  }

  filtered.forEach(tool => {
    const card = document.createElement("article");
    card.className = "tool-card";

    const tag = document.createElement("span");
    tag.className = "tool-category";
    tag.textContent = tool.category || "Tool";

    const title = document.createElement("h3");
    title.textContent = tool.name || "Untitled Tool";

    const description = document.createElement("p");
    description.textContent = tool.description || "Explore this tool.";

    card.append(tag, title, description);

    if (tool.price) {
      const price = document.createElement("p");
      price.textContent = "Price: " + tool.price;
      card.appendChild(price);
    }

    if (validUrl(tool.url || "")) {
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = tool.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Visit Tool →";
      card.appendChild(link);
    }

    toolsGrid.appendChild(card);
  });
}

// BLOG CARDS WITH FULL CONTENT
function displayBlogs() {
  blogsGrid.replaceChildren();

  if (!allBlogs.length) {
    const message = document.createElement("p");
    message.className = "loading";
    message.textContent = "No articles published yet.";
    blogsGrid.appendChild(message);
    return;
  }

  allBlogs.forEach(blog => {
    const card = document.createElement("article");
    card.className = "blog-card";

    const tag = document.createElement("span");
    tag.className = "tool-category";
    tag.textContent = blog.category || "Article";

    const title = document.createElement("h3");
    title.textContent = blog.title || "Untitled Article";

    const excerpt = document.createElement("p");
    excerpt.textContent = blog.excerpt || "";

    const fullContent = document.createElement("p");
    fullContent.textContent = blog.content || "Full article coming soon.";
    fullContent.hidden = true;

    const readButton = document.createElement("button");
    readButton.className = "primary-btn";
    readButton.type = "button";
    readButton.textContent = "Read More";

    readButton.addEventListener("click", () => {
      fullContent.hidden = !fullContent.hidden;
      readButton.textContent = fullContent.hidden
        ? "Read More"
        : "Show Less";
    });

    card.append(tag, title, excerpt, fullContent, readButton);
    blogsGrid.appendChild(card);
  });
}

// LOAD TOOLS
async function loadTools() {
  toolsGrid.textContent = "Loading tools...";

  try {
    const q = query(
      collection(db, "tools"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);

    allTools = snapshot.docs.map(item => item.data());

    displayTools();

  } catch (error) {
    console.error("Tools error:", error);
    toolsGrid.textContent = "Tools could not load. Please refresh.";
  }
}

// LOAD BLOGS
async function loadBlogs() {
  blogsGrid.textContent = "Loading blogs...";

  try {
    const q = query(
      collection(db, "blogs"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);

    allBlogs = snapshot.docs.map(item => item.data());

    displayBlogs();

  } catch (error) {
    console.error("Blog error:", error);
    blogsGrid.textContent = "Blogs could not load. Please refresh.";
  }
}

// FILTER BUTTONS
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    displayTools(
      (button.dataset.category || "all").toLowerCase()
    );
  });
});

// SUGGEST TOOL FORM
suggestForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("toolName").value.trim();
  const url = document.getElementById("toolUrl").value.trim();
  const description =
    document.getElementById("toolDescription").value.trim();

  if (!name || !url || !description) {
    suggestMessage.textContent = "Please fill all fields.";
    return;
  }

  if (!validUrl(url)) {
    suggestMessage.textContent = "Please enter a valid website URL.";
    return;
  }

  suggestBtn.disabled = true;
  suggestBtn.textContent = "Submitting...";

  try {
    let user = auth.currentUser;

    if (!user) {
      const result = await signInWithPopup(auth, googleProvider);
      user = result.user;
    }

    await addDoc(collection(db, "toolSubmissions"), {
      uid: user.uid,
      name,
      url,
      description,
      status: "pending",
      createdAt: serverTimestamp()
    });

    suggestMessage.textContent =
      "Your suggestion has been submitted successfully!";

    suggestForm.reset();

  } catch (error) {
    console.error("Submission error:", error);

    suggestMessage.textContent =
      "Submission failed: " + error.message;

  } finally {
    suggestBtn.disabled = false;
    suggestBtn.textContent = "Submit Suggestion";
  }
});

// START
loadTools();
loadBlogs();
