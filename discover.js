
import { auth, db, googleProvider } from "./firebase.js";

import {
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// ELEMENTS
const coursesGrid = document.getElementById("coursesGrid");
const toolsGrid = document.getElementById("toolsGrid");
const blogsGrid = document.getElementById("blogsGrid");
const searchInput = document.getElementById("courseSearch");

const suggestForm = document.getElementById("suggestForm");
const suggestMessage = document.getElementById("suggestMessage");

let coursesData = [];
let toolsData = [];
let currentUser = null;
let courseFilter = "all";
let toolFilter = "all";

// AUTH
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// HELPERS
function makeElement(tag, className, text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function createLink(url, label) {
  const safe = safeUrl(url);
  if (!safe) return null;

  const link = makeElement("a", "card-link", label);
  link.href = safe;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function showMessage(container, message) {
  if (container) container.textContent = message;
}

// COURSES
function renderCourses() {
  if (!coursesGrid) return;

  coursesGrid.replaceChildren();

  const search = (searchInput?.value || "").toLowerCase();

  const filtered = coursesData.filter(course => {
    const type = (course.type || course.access || "free").toLowerCase();

    const matchesType =
      courseFilter === "all" || type === courseFilter;

    const matchesSearch =
      `${course.title || course.name || ""} ${course.description || ""} ${course.category || ""}`
        .toLowerCase()
        .includes(search);

    return matchesType && matchesSearch;
  });

  if (!filtered.length) {
    coursesGrid.append(
      makeElement("p", "empty-state", "No courses found. New courses coming soon!")
    );
    return;
  }

  filtered.forEach(course => {
    const card = makeElement("article", "course-card");

    const cover = makeElement("div", "course-cover");
    const imageUrl = safeUrl(course.image || course.thumbnail);

    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = course.title || "Course";
      image.loading = "lazy";
      cover.append(image);
    } else {
      cover.append(makeElement("span", "cover-symbol", "✦"));
    }

    const type = (course.type || course.access || "free").toLowerCase();
    cover.append(
      makeElement(
        "span",
        `course-badge ${type}`,
        type === "premium" ? "PREMIUM" : "FREE"
      )
    );

    const body = makeElement("div", "course-card-body");

    body.append(
      makeElement("span", "course-category", course.category || "General"),
      makeElement("h3", "", course.title || course.name || "Untitled Course"),
      makeElement("p", "", course.description || "Explore this course.")
    );

    const meta = makeElement("div", "course-meta");
    meta.append(
      makeElement("span", "", course.level || "Beginner"),
      makeElement("span", "", course.lessons || "Lessons available"),
      makeElement("span", "", course.duration || "Self paced")
    );

    body.append(meta);

    const link = createLink(course.url, "Explore Course ↗");
    if (link) body.append(link);

    card.append(cover, body);
    coursesGrid.append(card);
  });
}

async function loadCourses() {
  if (!coursesGrid) return;

  showMessage(coursesGrid, "Loading courses...");

  try {
    const q = query(
      collection(db, "courses"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);
    coursesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderCourses();
  } catch (error) {
    console.error("Courses error:", error);
    showMessage(coursesGrid, "Unable to load courses. Please try again later.");
  }
}

// COURSE FILTERS
document.querySelectorAll(".course-filter").forEach(button => {
  button.addEventListener("click", () => {
    courseFilter = button.dataset.courseType || "all";

    document.querySelectorAll(".course-filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderCourses();
  });
});

searchInput?.addEventListener("input", renderCourses);

// TOOLS
function renderTools() {
  if (!toolsGrid) return;

  toolsGrid.replaceChildren();

  const filtered = toolsData.filter(tool => {
    const category = (tool.category || "").toLowerCase();
    const price = (tool.price || tool.type || "free").toLowerCase();

    if (toolFilter === "ai") return category.includes("ai");
    if (toolFilter === "free") return price.includes("free");
    if (toolFilter === "premium") return price.includes("premium");

    return true;
  });

  if (!filtered.length) {
    toolsGrid.append(
      makeElement("p", "empty-state", "No tools available in this category.")
    );
    return;
  }

  filtered.forEach(tool => {
    const card = makeElement("article", "tool-card");

    card.append(
      makeElement("span", "tool-category", tool.category || "Tool"),
      makeElement("h3", "", tool.name || tool.title || "Untitled Tool"),
      makeElement("p", "", tool.description || "Explore this tool.")
    );

    const link = createLink(tool.url, "Visit Tool ↗");
    if (link) card.append(link);

    toolsGrid.append(card);
  });
}

async function loadTools() {
  if (!toolsGrid) return;

  showMessage(toolsGrid, "Loading tools...");

  try {
    const q = query(
      collection(db, "tools"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);
    toolsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderTools();
  } catch (error) {
    console.error("Tools error:", error);
    showMessage(toolsGrid, "Unable to load tools.");
  }
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    toolFilter = button.dataset.category || "all";

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderTools();
  });
});

// BLOGS
async function loadBlogs() {
  if (!blogsGrid) return;

  showMessage(blogsGrid, "Loading articles...");

  try {
    const q = query(
      collection(db, "blogs"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);
    blogsGrid.replaceChildren();

    if (snapshot.empty) {
      blogsGrid.append(
        makeElement("p", "empty-state", "Articles coming soon.")
      );
      return;
    }

    snapshot.forEach(documentSnapshot => {
      const blog = documentSnapshot.data();
      const card = makeElement("article", "blog-card");

      card.append(
        makeElement("span", "blog-category", blog.category || "QuickServe Blog"),
        makeElement("h3", "", blog.title || "Untitled Article"),
        makeElement("p", "", blog.excerpt || blog.description || "Read our latest article.")
      );

      if (blog.content) {
        const content = makeElement("p", "blog-full-content", blog.content);
        content.hidden = true;

        const readButton = makeElement("button", "read-more", "Read More");
        readButton.type = "button";

        readButton.addEventListener("click", () => {
          content.hidden = !content.hidden;
          readButton.textContent = content.hidden ? "Read More" : "Show Less";
        });

        card.append(readButton, content);
      }

      blogsGrid.append(card);
    });
  } catch (error) {
    console.error("Blogs error:", error);
    showMessage(blogsGrid, "Unable to load articles.");
  }
}

// TOOL SUGGESTION FORM
suggestForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("toolName")?.value.trim();
  const url = safeUrl(document.getElementById("toolUrl")?.value.trim());
  const description = document.getElementById("toolDescription")?.value.trim();

  if (!name || !url || !description) {
    showMessage(suggestMessage, "Please fill all fields with a valid URL.");
    return;
  }

  const submitButton = document.getElementById("suggestBtn");
  if (submitButton) submitButton.disabled = true;

  try {
    if (!currentUser) {
      const result = await signInWithPopup(auth, googleProvider);
      currentUser = result.user;
    }

    await addDoc(collection(db, "toolSubmissions"), {
      uid: currentUser.uid,
      name,
      url,
      description,
      status: "pending",
      createdAt: serverTimestamp()
    });

    suggestForm.reset();
    showMessage(suggestMessage, "Suggestion submitted successfully!");

  } catch (error) {
    console.error("Suggestion error:", error);
    showMessage(suggestMessage, "Could not submit. Please sign in and try again.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// MOBILE SIDEBAR
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

menuToggle?.addEventListener("click", () => {
  sidebar?.classList.toggle("open");
});

document.querySelectorAll(".sidebar a").forEach(link => {
  link.addEventListener("click", () => {
    sidebar?.classList.remove("open");
  });
});

// FOOTER YEAR
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// START
loadCourses();
loadTools();
loadBlogs();
