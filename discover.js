import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// ======================================
// QUICKSERVE DISCOVER - COURSE DATABASE
// ======================================

const courses = [
  {
    id: "ui-ux-beginners",
    title: "UI/UX Design for Beginners",
    category: "design",
    level: "Beginner",
    duration: "4 Weeks",
    lessons: 12,
    type: "free",
    price: "FREE",
    description: "Learn user interface design, user experience, layouts, colours, typography and practical design fundamentals.",
    icon: "✦"
  },
  {
    id: "canva-design-mastery",
    title: "Canva Design Mastery",
    category: "design",
    level: "Beginner",
    duration: "5 Weeks",
    lessons: 18,
    type: "premium",
    price: "Premium",
    description: "Learn professional social media graphics, posters, presentations and brand design.",
    icon: "◈"
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing Complete Course",
    category: "marketing",
    level: "Beginner",
    duration: "6 Weeks",
    lessons: 20,
    type: "premium",
    price: "Premium",
    description: "Understand social media marketing, content strategy, branding and digital promotion.",
    icon: "↗"
  },
  {
    id: "business-freelancing",
    title: "Business & Freelancing Basics",
    category: "business",
    level: "Beginner",
    duration: "4 Weeks",
    lessons: 15,
    type: "premium",
    price: "Premium",
    description: "Explore freelancing, client communication, service pricing and building a small business.",
    icon: "◇"
  },
  {
    id: "web-development",
    title: "Website Development Basics",
    category: "technology",
    level: "Beginner",
    duration: "8 Weeks",
    lessons: 24,
    type: "premium",
    price: "Premium",
    description: "Understand HTML, CSS, JavaScript and how modern websites are built.",
    icon: "⌘"
  }
];

// ======================================
// CREATIVE TOOLS
// ======================================

const tools = [
  {
    name: "Invoice Maker",
    category: "business",
    description: "Create professional invoices for your business.",
    icon: "▤",
    link: "https://saiyedashra62-lab.github.io/invoice-maker/"
  },
  {
    name: "QR Code Maker",
    category: "productivity",
    description: "Generate QR codes for links and information.",
    icon: "▦",
    link: "https://www.qrcode-monkey.com/"
  },
  {
    name: "Design Workspace",
    category: "design",
    description: "Create posters, presentations and social media designs.",
    icon: "✧",
    link: "https://www.canva.com/"
  },
  {
    name: "Resume Maker",
    category: "business",
    description: "Explore professional resume creation resources.",
    icon: "▣",
    link: "tools.html"
  },
  {
    name: "Digital Visiting Card",
    category: "business",
    description: "Explore digital business card resources.",
    icon: "▤",
    link: "tools.html"
  },
  {
    name: "Text & Notes",
    category: "productivity",
    description: "Write, organise and manage your documents.",
    icon: "✎",
    link: "https://docs.google.com/"
  }
];

// ======================================
// BLOG ARTICLES
// ======================================

const blogs = [
  {
    title: "What Is UI/UX Design?",
    category: "design",
    description: "Understand the difference between UI and UX and why both matter.",
    link: "blogs.html"
  },
  {
    title: "How to Start Freelancing",
    category: "business",
    description: "Learn the basics of services, clients and building a portfolio.",
    link: "blogs.html"
  },
  {
    title: "Digital Marketing Explained",
    category: "marketing",
    description: "An introduction to online promotion and digital branding.",
    link: "blogs.html"
  },
  {
    title: "How Websites Work",
    category: "technology",
    description: "Discover the basics behind websites and web development.",
    link: "blogs.html"
  }
];

// ======================================
// HELPERS
// ======================================

const $ = (id) => document.getElementById(id);

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

let selectedCategory = "all";

function updateYear() {
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();
}

// ======================================
// COURSE CARDS
// ======================================

function courseCard(course) {
  const premium = course.type === "premium";

  return `
    <article class="course-card">
      <div class="course-card-top">
        <span class="course-icon">${escapeHTML(course.icon)}</span>
        <span class="course-badge ${premium ? "premium" : "free"}">
          ${premium ? "PREMIUM" : "FREE COURSE"}
        </span>
      </div>

      <div class="course-card-content">
        <span class="course-category">
          ${escapeHTML(course.category)}
        </span>

        <h3>${escapeHTML(course.title)}</h3>

        <p>${escapeHTML(course.description)}</p>

        <div class="course-meta">
          <span>${escapeHTML(course.level)}</span>
          <span>${escapeHTML(course.duration)}</span>
          <span>${course.lessons} Lessons</span>
        </div>

        <div class="course-card-bottom">
          <strong>${escapeHTML(course.price)}</strong>

          <a href="course.html?id=${encodeURIComponent(course.id)}"
             class="course-open-btn">
            ${premium ? "Explore Course →" : "Start Learning →"}
          </a>
        </div>
      </div>
    </article>
  `;
}

// ======================================
// RENDER COURSES
// ======================================

function renderCourses() {
  const grid = $("coursesGrid");
  const premiumGrid = $("premiumCoursesGrid");

  const search = ($("courseSearch")?.value || "")
    .trim()
    .toLowerCase();

  const filter = $("courseFilter")?.value || "all";

  const filtered = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search) ||
      course.description.toLowerCase().includes(search) ||
      course.category.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "all" ||
      course.category === selectedCategory;

    const matchesType =
      filter === "all" || course.type === filter;

    return matchesSearch && matchesCategory && matchesType;
  });

  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map(courseCard).join("")
      : `<div class="course-empty-message">
           No courses found. Try another search or category.
         </div>`;
  }

  if (premiumGrid) {
    const premiumCourses = courses.filter(
      (course) => course.type === "premium"
    );

    premiumGrid.innerHTML = premiumCourses
      .map(courseCard)
      .join("");
  }

  const empty = $("courseEmpty");
  if (empty) empty.hidden = filtered.length > 0;
}

// ======================================
// CATEGORY FILTERS
// ======================================

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category || "all";

    document.querySelectorAll("[data-category]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    renderCourses();
  });
});

// ======================================
// SEARCH AND COURSE TYPE
// ======================================

$("courseSearch")?.addEventListener("input", renderCourses);
$("courseFilter")?.addEventListener("change", renderCourses);

// ======================================
// TOOLS
// ======================================

function renderTools() {
  const grid = $("toolsGrid");
  if (!grid) return;

  grid.innerHTML = tools.map((tool) => `
    <article class="tool-card" data-filter="${escapeHTML(tool.category)}">
      <div class="tool-icon">${escapeHTML(tool.icon)}</div>
      <h3>${escapeHTML(tool.name)}</h3>
      <p>${escapeHTML(tool.description)}</p>
      <a href="${escapeHTML(tool.link)}" target="_blank"
         rel="noopener noreferrer">
        Open Tool →
      </a>
    </article>
  `).join("");
}

// ======================================
// BLOGS
// ======================================

function renderBlogs() {
  const grid = $("blogsGrid");
  if (!grid) return;

  grid.innerHTML = blogs.map((blog) => `
    <article class="blog-card">
      <span class="blog-category">
        ${escapeHTML(blog.category)}
      </span>
      <h3>${escapeHTML(blog.title)}</h3>
      <p>${escapeHTML(blog.description)}</p>
      <a href="${escapeHTML(blog.link)}">
        Read Articles →
      </a>
    </article>
  `).join("");
}

// ======================================
// SUGGESTION FORM
// ======================================

const suggestForm = $("suggestForm");

suggestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const input = $("suggestionInput");
  const suggestion = input?.value.trim();

  if (!suggestion) return;

  if (!auth.currentUser) {
    alert("Please sign in before submitting a suggestion.");
    return;
  }

  const submitButton = suggestForm.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) submitButton.disabled = true;

  try {
    await addDoc(collection(db, "toolSubmissions"), {
      suggestion,
      userId: auth.currentUser.uid,
      email: auth.currentUser.email || "",
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Thank you! Your suggestion has been submitted.");
    suggestForm.reset();

  } catch (error) {
    console.error("Suggestion error:", error);
    alert("Could not submit your suggestion. Please try again.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// ======================================
// INITIALISE
// ======================================

updateYear();
renderCourses();
renderTools();
renderBlogs();

console.log("QuickServe Discover loaded successfully.");
