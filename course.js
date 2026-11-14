
import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

const titleEl = document.getElementById("courseTitle");
const descriptionEl = document.getElementById("courseDescription");
const categoryEl = document.getElementById("courseCategory");
const levelEl = document.getElementById("courseLevel");
const durationEl = document.getElementById("courseDuration");
const lessonsEl = document.getElementById("courseLessons");
const noticeEl = document.getElementById("courseNotice");
const chaptersEl = document.getElementById("chaptersContainer");
const lessonViewer = document.getElementById("lessonViewer");
const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const lessonVideo = document.getElementById("lessonVideo");
const lessonActions = document.getElementById("lessonActions");
const accessMessage = document.getElementById("courseAccessMessage");
const lessonCount = document.getElementById("lessonCount");

document.getElementById("year").textContent =
  new Date().getFullYear();

let courseData = null;
let allLessons = [];
let activeLessonIndex = -1;
let hasAccess = false;

function showNotice(message) {
  noticeEl.textContent = message;
}

function safeYouTubeEmbed(value) {
  try {
    const url = new URL(value);
    let videoId = "";

    if (url.hostname.includes("youtu.be")) {
      videoId = url.pathname.slice(1);
    } else if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtube-nocookie.com")
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

function addText(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text || "";
  parent.append(element);
  return element;
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

  const blocks = content.split(/\n{2,}/);

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
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;

  lessonVideo.append(frame);
}

function renderLesson(index) {
  if (!hasAccess) {
    showNotice("This Premium course is locked.");
    return;
  }

  const lesson = allLessons[index];
  if (!lesson) return;

  activeLessonIndex = index;
  lessonViewer.hidden = false;

  lessonTitle.textContent = lesson.title || "Lesson";
  formatLessonContent(lesson.content || lesson.explanation || "");
  showVideo(lesson.videoUrl || lesson.youtubeUrl || "");

  lessonActions.replaceChildren();

  if (index > 0) {
    const previous = document.createElement("button");
    previous.textContent = "← Previous Lesson";
    previous.addEventListener("click", () => renderLesson(index - 1));
    lessonActions.append(previous);
  }

  if (index < allLessons.length - 1) {
    const next = document.createElement("button");
    next.textContent = "Next Lesson →";
    next.addEventListener("click", () => renderLesson(index + 1));
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
      button.textContent = hasAccess ? "Start Lesson →" : "🔒 Locked";
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
    showNotice("Course ID missing. Open a course from the catalogue.");
    titleEl.textContent = "Course not selected";
    return;
  }

  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      titleEl.textContent = "Course not found";
      showNotice("This course does not exist.");
      return;
    }

    courseData = courseSnapshot.data();

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

    const courseType =
      (courseData.type || "premium").toLowerCase();

    hasAccess = courseType === "free";

    if (hasAccess) {
      accessMessage.textContent = "✓ Free course — start learning";
    } else {
      accessMessage.textContent =
        "🔒 Premium course — purchase verification required.";
    }

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
        "Premium content is locked. Complete the purchase and access verification to unlock lessons."
      );
    }

  } catch (error) {
    console.error("Course loading error:", error);
    showNotice(
      "Unable to load course. Please check the Firebase setup and permissions."
    );
  }
}

loadCourse();
    
