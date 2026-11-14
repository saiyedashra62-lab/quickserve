
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

// HTML elements
const toolsGrid = document.getElementById("toolsGrid");
const blogsGrid = document.getElementById("blogsGrid");
const suggestForm = document.getElementById("suggestForm");
const suggestMessage = document.getElementById("suggestMessage");
const suggestBtn = document.getElementById("suggestBtn");

let allTools = [];

// Footer year
document.getElementById("year").textContent =
  new Date().getFullYear();

// Safe URL validation
function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Create a tool card
function createToolCard(tool) {
  const card = document.createElement("article");
  card.className = "tool-card";

  const category = document.createElement("span");
  category.className = "tool-category";
  category.textContent = tool.category || "Tool";

  const title = document.createElement("h3");
  title.textContent = tool.name || "Untitled Tool";

  const description = document.createElement("p");
  description.textContent =
    tool.description || "Explore this useful digital tool.";

  card.append(category, title, description);

  if (tool.category === "premium" && tool.price) {
    const price = document.createElement("p");
    price.textContent = "Price: " + tool.price;
    card.appendChild(price);
  }

  if (tool.url && validUrl(tool.url)) {
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = tool.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Visit Tool →";
    card.appendChild(link);
  }

  return card;
}

// Create a blog card
function createBlogCard(blog) {
  const card = document.createElement("article");
  card.className = "blog-card";

  const category = document.createElement("span");
  category.className = "tool-category";
  category.textContent = blog.category || "Article";

  const title = document.createElement("h3");
  title.textContent = blog.title || "Untitled Article";

  const excerpt = document.createElement("p");
  excerpt.textContent =
    blog.excerpt || "Read more about this topic.";

  card.append(category, title, excerpt);

  return card;
}

// Display tools
function displayTools(tools) {
  toolsGrid.replaceChildren();

  if (tools.length === 0) {
    const message = document.createElement("p");
    message.className = "loading";
    message.textContent = "No tools found in this category yet.";
    toolsGrid.appendChild(message);
    return;
  }

  tools.forEach(tool => {
    toolsGrid.appendChild(createToolCard(tool));
  });
}

// Display blogs
function displayBlogs(blogs) {
  blogsGrid.replaceChildren();

  if (blogs.length === 0) {
    const message = document.createElement("p");
    message.className = "loading";
    message.textContent = "No articles published yet.";
    blogsGrid.appendChild(message);
    return;
  }

  blogs.forEach(blog => {
    blogsGrid.appendChild(createBlogCard(blog));
  });
}

// Load published tools from Firebase
async function loadTools() {
  toolsGrid.textContent = "Loading tools...";

  try {
    const toolsQuery = query(
      collection(db, "tools"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(toolsQuery);

    allTools = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

    displayTools(allTools);

  } catch (error) {
    console.error("Tools loading error:", error);
    toolsGrid.textContent = "Unable to load tools. Please try again later.";
  }
}

// Load published blogs from Firebase
async function loadBlogs() {
  blogsGrid.textContent = "Loading articles...";

  try {
    const blogsQuery = query(
      collection(db, "blogs"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(blogsQuery);

    const blogs = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

    displayBlogs(blogs);

  } catch (error) {
    console.error("Blogs loading error:", error);
    blogsGrid.textContent = "Unable to load articles. Please try again later.";
  }
}

// Tool category filters
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const category = button.dataset.category;

    if (category === "all") {
      displayTools(allTools);
    } else {
      const filteredTools = allTools.filter(
        tool => tool.category === category
      );

      displayTools(filteredTools);
    }
  });
});

// Submit a new tool suggestion
suggestForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("toolName").value.trim();
  const url = document.getElementById("toolUrl").value.trim();
  const description = document.getElementById("toolDescription").value.trim();

  if (!name || !url || !description) {
    suggestMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (!validUrl(url)) {
    suggestMessage.textContent = "Please enter a valid website URL.";
    return;
  }

  suggestBtn.disabled = true;
  suggestBtn.textContent = "Submitting...";
  suggestMessage.textContent = "";

  try {
    let user = auth.currentUser;

    // Google login if user is not signed in
    if (!user) {
      const result = await signInWithPopup(auth, googleProvider);
      user = result.user;
    }

    await addDoc(collection(db, "toolSubmissions"), {
      uid: user.uid,
      name: name,
      url: url,
      description: description,
      status: "pending",
      createdAt: serverTimestamp()
    });

    suggestMessage.textContent =
      "Suggestion submitted! Our team will review it.";

    suggestForm.reset();

  } catch (error) {
    console.error("Suggestion error:", error);

    suggestMessage.textContent =
      "Submission failed. Please sign in and try again.";

  } finally {
    suggestBtn.disabled = false;
    suggestBtn.textContent = "Submit Suggestion";
  }
});

// Start loading page data
loadTools();
loadBlogs();
      
