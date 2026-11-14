import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

const titleEl = $("courseTitle");
const descriptionEl = $("courseDescription");
const categoryEl = $("courseCategory");
const levelEl = $("courseLevel");
const durationEl = $("courseDuration");
const lessonsEl = $("courseLessons");
const noticeEl = $("courseNotice");
const chaptersEl = $("chaptersContainer");
const lessonViewer = $("lessonViewer");
const lessonTitle = $("lessonTitle");
const lessonContent = $("lessonContent");
const lessonVideo = $("lessonVideo");
const lessonActions = $("lessonActions");
const accessMessage = $("courseAccessMessage");
const lessonCount = $("lessonCount");

let allLessons = [];
let hasAccess = false;
let activeLessonIndex = -1;

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

function showNotice(message) {
  if (noticeEl) noticeEl.textContent = message;
}

function addText(parent, tag, text) {
  const el = document.createElement(tag);
  el.textContent = text || "";
  parent.append(el);
  return el;
}

function safeYouTubeEmbed(value) {
  try {
    const url = new URL(value);
    let videoId = "";

    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com",
       "www.youtube-nocookie.com", "youtube-nocookie.com"]
        .includes(url.hostname)
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return "";

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

function formatLessonContent(content) {
  lessonContent.replaceChildren();

  if (!content) {
    addText(
      lessonContent,
      "p",
      "Lesson content will be available soon."
    );
    return;
  }

  const blocks = String(content).split(/\n{2,}/);

  blocks.forEach(block => {
    const trimmed = block.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("### ")) {
      addText(lessonContent, "h3", trimmed.slice(4));
    } else if (trimmed.startsWith("## ")) {
      addText(lessonContent, "h2", trimmed.slice(3));
    } else if (trimmed.startsWith("- ")) {
      const list = document.createElement("ul");

      trimmed.split("\n").forEach(line => {
        if (line.startsWith("- ")) {
          addText(list, "li", line.slice(2));
        }
      });

      lessonContent.append(list);
    } else {
      addText(lessonContent, "p", trimmed);
    }
  });
}

function showVideo(videoUrl) {
  lessonVideo.replaceChildren();

  const embedUrl = safeYouTubeEmbed(videoUrl);
  if (!embedUrl) return;

  const frame = document.createElement("iframe");

  frame.src = embedUrl;
  frame.title = "Course lesson video";
  frame.loading = "lazy";
  frame.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  frame.allowFullscreen = true;

  lessonVideo.append(frame);
}

function renderLesson(index) {
  if (!hasAccess) {
    showNotice("This premium course is locked.");
    return;
  }

  const lesson = allLessons[index];
  if (!lesson) return;

  activeLessonIndex = index;
  lessonViewer.hidden = false;

  lessonTitle.textContent = lesson.title || "Lesson";

  formatLessonContent(
    lesson.content || lesson.explanation || ""
  );

  showVideo(lesson.videoUrl || lesson.youtubeUrl || "");

  lessonActions.replaceChildren();

  if (index > 0) {
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "← Previous Lesson";

    previous.addEventListener("click", () => {
      renderLesson(index - 1);
    });

    lessonActions.append(previous);
  }

  if (index < allLessons.length - 1) {
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next Lesson →";

    next.addEventListener("click", () => {
      renderLesson(index + 1);
    });

    lessonActions.append(next);
  }

  lessonViewer.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function renderChapters(chapters) {
  chaptersEl.replaceChildren();
  allLessons = [];

  if (!chapters.length) {
    showNotice("Course lessons are being prepared.");
    lessonCount.textContent = "0 Lessons";
    lessonsEl.textContent = "0 Lessons";
    return;
  }

  showNotice("");

  chapters.forEach((chapter, chapterIndex) => {
    const card = document.createElement("article");
    card.className = "chapter-card";

    const header = document.createElement("div");
    header.className = "chapter-header";

    const info = document.createElement("div");

    addText(
      info,
      "h3",
      chapter.title || `Chapter ${chapterIndex + 1}`
    );

    addText(
      info,
      "p",
      chapter.description || "Explore this chapter."
    );

    header.append(info);
    card.append(header);

    const lessonList = document.createElement("div");
    lessonList.className = "chapter-lessons";

    (chapter.lessons || []).forEach(lesson => {
      const globalIndex = allLessons.length;
      allLessons.push(lesson);

      const row = document.createElement("div");
      row.className = "lesson-row";

      const lessonInfo = document.createElement("div");

      addText(
        lessonInfo,
        "h4",
        lesson.title || "Untitled Lesson"
      );

      addText(
        lessonInfo,
        "p",
        lesson.duration || "Self paced"
      );

      const button = document.createElement("button");
      button.type = "button";

      button.textContent = hasAccess
        ? "Start Lesson →"
        : "🔒 Locked";

      button.disabled = !hasAccess;

      button.addEventListener("click", () => {
        renderLesson(globalIndex);
      });

      row.append(lessonInfo, button);
      lessonList.append(row);
    });

    card.append(lessonList);
    chaptersEl.append(card);
  });

  lessonCount.textContent = `${allLessons.length} Lessons`;
  lessonsEl.textContent = `${allLessons.length} Lessons`;
}

async function loadCourse() {
  if (!courseId) {
    titleEl.textContent = "Course not selected";
    showNotice("Open a course from the course catalogue.");
    return;
  }

  try {
    showNotice("Loading course content...");

    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      titleEl.textContent = "Course not found";
      showNotice("This course does not exist.");
      return;
    }

    const courseData = courseSnapshot.data();

    if (courseData.status !== "published") {
      titleEl.textContent = "Course unavailable";
      showNotice("This course is not published yet.");
      return;
    }

    titleEl.textContent = courseData.title || "QuickServe Course";

    descriptionEl.textContent =
      courseData.description || "Start your learning journey.";

    categoryEl.textContent =
      (courseData.category || "GENERAL").toUpperCase();

    levelEl.textContent = courseData.level || "Beginner";
    durationEl.textContent = courseData.duration || "Self paced";

    const courseType = String(
      courseData.type || courseData.access ||
      (courseId === "ui-ux-beginners" ? "free" : "premium")
    ).toLowerCase();

    hasAccess = courseType === "free";

    accessMessage.textContent = hasAccess
      ? "✓ Free course — start learning"
      : "🔒 Premium course — purchase verification required.";

    const chaptersQuery = query(
      collection(db, "courses", courseId, "chapters"),
      where("status", "==", "published"),
      orderBy("order", "asc")
    );

    const chapterSnapshot = await getDocs(chaptersQuery);
    const chapters = [];

    for (const chapterDoc of chapterSnapshot.docs) {
      const chapter = chapterDoc.data();

      const lessonsQuery = query(
        collection(
          db,
          "courses",
          courseId,
          "chapters",
          chapterDoc.id,
          "lessons"
        ),
        where("status", "==", "published"),
        orderBy("order", "asc")
      );

      const lessonsSnapshot = await getDocs(lessonsQuery);

      chapters.push({
        ...chapter,
        lessons: lessonsSnapshot.docs.map(lessonDoc => ({
          id: lessonDoc.id,
          ...lessonDoc.data()
        }))
      });
    }

    renderChapters(chapters);

    if (!hasAccess) {
      showNotice(
        "Premium content is locked. Purchase verification and secure access are required."
      );
    }

  } catch (error) {
    console.error("Course loading error:", error);

    showNotice(
      "Unable to load course. Please check Firebase permissions and indexes."
    );
  }
}

loadCourse();
