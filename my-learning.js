
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const coursesGrid = $("myCoursesGrid");
const continueGrid = $("continueLearning");
const emptyState = $("learningEmpty");

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

function showMessage(container, message) {
  if (!container) return;

  container.replaceChildren();

  const box = document.createElement("div");
  box.className = "learning-loading";
  box.textContent = message;

  container.appendChild(box);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function createCourseCard(course, enrollment) {
  const card = createElement("article", "learning-card");

  const cover = createElement("div", "learning-card-cover", "✦");

  const body = createElement("div", "learning-card-body");

  const title = createElement(
    "h3",
    "",
    course.title || course.name || "Untitled Course"
  );

  const description = createElement(
    "p",
    "",
    course.description || "Continue learning and build your skills."
  );

  const meta = createElement("div", "learning-card-meta");

  const category = createElement(
    "span",
    "",
    course.category || "General"
  );

  const level = createElement(
    "span",
    "",
    course.level || "Beginner"
  );

  meta.append(category, level);

  const progress = Math.min(
    100,
    Math.max(0, Number(enrollment.progress || 0))
  );

  const progressLabel = createElement("div", "progress-label");

  const progressText = createElement("span", "", "Your Progress");
  const progressValue = createElement("span", "", `${progress}%`);

  progressLabel.append(progressText, progressValue);

  const track = createElement("div", "progress-track");
  const fill = createElement("div", "progress-fill");

  fill.style.width = `${progress}%`;

  track.appendChild(fill);

  const link = createElement(
    "a",
    "continue-button",
    progress >= 100 ? "Review Course →" : "Continue Learning →"
  );

  link.href = `course.html?id=${encodeURIComponent(enrollment.courseId)}`;

  body.append(
    title,
    description,
    meta,
    progressLabel,
    track,
    link
  );

  card.append(cover, body);

  return card;
}

function updateStats(enrollments) {
  const total = enrollments.length;

  const completed = enrollments.filter(item => {
    return item.completed === true ||
      Number(item.progress || 0) >= 100;
  }).length;

  const average = total
    ? Math.round(
        enrollments.reduce(
          (sum, item) => sum + Math.min(
            100,
            Math.max(0, Number(item.progress || 0))
          ),
          0
        ) / total
      )
    : 0;

  $("enrolledCount").textContent = total;
  $("completedCount").textContent = completed;
  $("learningProgress").textContent = `${average}%`;
}

async function loadLearning(user) {
  showMessage(coursesGrid, "Loading your courses...");
  showMessage(continueGrid, "Finding your next lesson...");

  try {
    const enrollmentQuery = query(
      collection(db, "enrollments"),
      where("userId", "==", user.uid)
    );

    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    const enrollments = enrollmentSnapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    const availableCourses = [];

    for (const enrollment of enrollments) {
      if (!enrollment.courseId) continue;

      const courseRef = doc(db, "courses", enrollment.courseId);
      const courseSnapshot = await getDoc(courseRef);

      if (!courseSnapshot.exists()) continue;

      const course = courseSnapshot.data();

      if (course.status !== "published") continue;

      availableCourses.push({
        course,
        enrollment
      });
    }

    updateStats(enrollments);

    coursesGrid.replaceChildren();
    continueGrid.replaceChildren();

    if (availableCourses.length === 0) {
      emptyState.hidden = false;

      showMessage(
        coursesGrid,
        "No enrolled courses found yet."
      );

      showMessage(
        continueGrid,
        "Explore courses to start learning."
      );

      return;
    }

    emptyState.hidden = true;

    availableCourses.forEach(item => {
      coursesGrid.appendChild(
        createCourseCard(item.course, item.enrollment)
      );
    });

    const nextCourse = availableCourses.find(item => {
      return Number(item.enrollment.progress || 0) < 100;
    }) || availableCourses[0];

    continueGrid.appendChild(
      createCourseCard(nextCourse.course, nextCourse.enrollment)
    );

  } catch (error) {
    console.error("My Learning error:", error);

    showMessage(
      coursesGrid,
      "Unable to load courses. Please check your Firebase permissions."
    );

    showMessage(
      continueGrid,
      "Your learning dashboard could not be loaded."
    );
  }
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    updateStats([]);

    emptyState.hidden = false;

    showMessage(
      coursesGrid,
      "Please sign in to see your enrolled courses."
    );

    showMessage(
      continueGrid,
      "Sign in to continue learning."
    );

    return;
  }

  await loadLearning(user);
});
      
