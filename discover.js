
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

const $ = id => document.getElementById(id);

const coursesGrid = $("coursesGrid");
const premiumGrid = $("premiumCoursesGrid");
const toolsGrid = $("toolsGrid");
const blogsGrid = $("blogsGrid");
const searchInput = $("courseSearch");
const courseFilter = $("courseFilter");

let currentUser = null;
let allCourses = [];
let allTools = [];
let activeCategory = "all";

onAuthStateChanged(auth, user => {
  currentUser = user;
});

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function message(container, text) {
  if (!container) return;
  container.replaceChildren(element("p", "empty-state", text));
}

function getCourseType(course) {
  const raw = String(course.type || course.access || "").toLowerCase();

  if (raw === "free" || raw === "premium") return raw;

  // Keep the known beginner course free.
  return course.id === "ui-ux-beginners" ? "free" : "premium";
}

function courseLink(course) {
  return `course.html?id=${encodeURIComponent(course.id)}`;
}

function makeCourseCard(course) {
  const card = element("article", "course-card");

  const cover = element("div", "course-cover");
  const imageUrl = safeUrl(course.image || course.thumbnail);

  if (imageUrl) {
    const img = element("img");
    img.src = imageUrl;
    img.alt = course.title || "Course cover";
    img.loading = "lazy";
    cover.append(img);
  } else {
    cover.append(element("span", "cover-symbol", "✦"));
  }

  const type = getCourseType(course);
  cover.append(
    element(
      "span",
      `course-badge ${type}`,
      type === "premium" ? "PREMIUM" : "FREE"
    )
  );

  const body = element("div", "course-card-body");

  body.append(
    element("span", "course-category", course.category || "General"),
    element("h3", "", course.title || course.name || "Untitled Course"),
    element("p", "", course.description || "Explore this course.")
  );

  const meta = element("div", "course-meta");
  meta.append(
    element("span", "", course.level || "Beginner"),
    element("span", "", course.duration || "Self paced")
  );
  body.append(meta);

  const link = element(
    "a",
    "card-link",
    type === "premium" ? "View Premium Course →" : "Start Learning →"
  );
  link.href = courseLink(course);
  body.append(link);

  card.append(cover, body);
  return card;
}

function renderCourses() {
  if (!coursesGrid) return;

  coursesGrid.replaceChildren();

  const search = (searchInput?.value || "").trim().toLowerCase();
  const type = courseFilter?.value || "all";

  const filtered = allCourses.filter(course => {
    const courseType = getCourseType(course);
    const category = String(course.category || "").toLowerCase();

    const matchesSearch = [
      course.title,
      course.name,
      course.description,
      course.category
    ].join(" ").toLowerCase().includes(search);

    const matchesType = type === "all" || courseType === type;
    const matchesCategory =
      activeCategory === "all" ||
      category.includes(activeCategory);

    return matchesSearch && matchesType && matchesCategory;
  });

  if (!filtered.length) {
    message(coursesGrid, "No courses found. Try another search.");
  } else {
    filtered.forEach(course => {
      coursesGrid.append(makeCourseCard(course));
    });
  }

  if (premiumGrid) {
    premiumGrid.replaceChildren();

    const premiumCourses = allCourses.filter(
      course => getCourseType(course) === "premium"
    );

    if (!premiumCourses.length) {
      message(premiumGrid, "Premium courses are being prepared.");
    } else {
      premiumCourses.forEach(course => {
        premiumGrid.append(makeCourseCard(course));
      });
    }
  }

  const empty = $("courseEmpty");
  if (empty) empty.classList.toggle("hidden", filtered.length > 0);
}

async function loadCourses() {
  if (!coursesGrid) return;

  message(coursesGrid, "Loading courses...");

  try {
    const q = query(
      collection(db, "courses"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);

    allCourses = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderCourses();
  } catch (error) {
    console.error("Courses error:", error);
    message(coursesGrid, "Unable to load courses. Please try again.");
    if (premiumGrid) {
      message(premiumGrid, "Premium courses could not be loaded.");
    }
  }
}

// Search and price filters
searchInput?.addEventListener("input", renderCourses);
courseFilter?.addEventListener("change", renderCourses);

// Category filters
document.querySelectorAll(".category-chip").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "all";

    document.querySelectorAll(".category-chip").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderCourses();
  });
});

// Tools
function renderTools() {
  if (!toolsGrid) return;

  toolsGrid.replaceChildren();

  if (!allTools.length) {
    message(toolsGrid, "Creative tools are coming soon.");
    return;
  }

  allTools.forEach(tool => {
    const card = element("article", "tool-card");

    card.append(
      element("span", "tool-category", tool.category || "Creative Tool"),
      element("h3", "", tool.name || tool.title || "Untitled Tool"),
      element("p", "", tool.description || "Explore this tool.")
    );

    const url = safeUrl(tool.url);

    if (url) {
      const link = element("a", "card-link", "Open Tool →");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }

    toolsGrid.append(card);
  });
}

async function loadTools() {
  if (!toolsGrid) return;

  message(toolsGrid, "Loading tools...");

  try {
    const q = query(
      collection(db, "tools"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);

    allTools = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderTools();
  } catch (error) {
    console.error("Tools error:", error);
    message(toolsGrid, "Unable to load tools.");
  }
}

// Blogs
async function loadBlogs() {
  if (!blogsGrid) return;

  message(blogsGrid, "Loading articles...");

  try {
    const q = query(
      collection(db, "blogs"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(q);
    blogsGrid.replaceChildren();

    if (snapshot.empty) {
      message(blogsGrid, "New articles are coming soon.");
      return;
    }

    snapshot.forEach(item => {
      const blog = item.data();
      const card = element("article", "blog-card");

      const imageUrl = safeUrl(blog.image || blog.thumbnail);

      if (imageUrl) {
        const img = element("img");
        img.src = imageUrl;
        img.alt = blog.title || "Article image";
        img.loading = "lazy";
        card.append(img);
      }

      card.append(
        element("span", "blog-category", blog.category || "QuickServe Blog"),
        element("h3", "", blog.title || "Untitled Article"),
        element(
          "p",
          "",
          blog.excerpt || blog.description || "Read our latest article."
        )
      );

      if (blog.content) {
        const content = element("p", "blog-full-content", blog.content);
        content.hidden = true;

        const button = element("button", "read-more", "Read More");
        button.type = "button";

        button.addEventListener("click", () => {
          content.hidden = !content.hidden;
          button.textContent = content.hidden ? "Read More" : "Show Less";
        });

        card.append(button, content);
      }

      blogsGrid.append(card);
    });
  } catch (error) {
    console.error("Blogs error:", error);
    message(blogsGrid, "Unable to load articles.");
  }
}

// Course and tool suggestion
const suggestForm = $("suggestForm");

if (suggestForm) {
  suggestForm.addEventListener("submit", async event => {
    event.preventDefault();

    const input = $("suggestionInput");
    const suggestion = input?.value.trim();

    if (!suggestion) return;

    const button = suggestForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Submitting...";

    try {
      if (!currentUser) {
        const result = await signInWithPopup(auth, googleProvider);
        currentUser = result.user;
      }

      await addDoc(collection(db, "toolSubmissions"), {
        uid: currentUser.uid,
        email: currentUser.email || "",
        name: suggestion,
        description: suggestion,
        url: "",
        status: "pending",
        createdAt: serverTimestamp()
      });

      suggestForm.reset();
      button.textContent = "Suggestion Sent ✓";
    } catch (error) {
      console.error("Suggestion error:", error);
      button.textContent = "Try Again";
      alert("Suggestion could not be submitted. Please check your login and Firestore rules.");
    } finally {
      button.disabled = false;

      setTimeout(() => {
        button.textContent = "Send Suggestion →";
      }, 2500);
    }
  });
}

// Footer year
const year = $("year");
if (year) year.textContent = new Date().getFullYear();

// Start
loadCourses();
loadTools();
loadBlogs();
    
