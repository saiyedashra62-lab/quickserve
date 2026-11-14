
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const ordersList = $("ordersList");
const ordersEmpty = $("ordersEmpty");
const orderFilter = $("orderFilter");

let allOrders = [];

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = value.toDate
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function normaliseStatus(status) {
  const value = String(status || "pending").toLowerCase();

  if (["completed", "complete", "delivered"].includes(value)) {
    return "completed";
  }

  if (["processing", "in progress", "in_progress"].includes(value)) {
    return "processing";
  }

  if (["cancelled", "canceled", "rejected"].includes(value)) {
    return "cancelled";
  }

  return "pending";
}

function updateStats(orders) {
  const completed = orders.filter(
    order => normaliseStatus(order.status) === "completed"
  ).length;

  const pending = orders.filter(
    order => normaliseStatus(order.status) === "pending"
  ).length;

  $("totalOrders").textContent = orders.length;
  $("pendingOrders").textContent = pending;
  $("completedOrders").textContent = completed;
}

function createOrderCard(order) {
  const card = makeElement("article", "order-card");

  const top = makeElement("div", "order-card-top");
  const details = makeElement("div", "order-details");

  const service = order.serviceName ||
    order.service ||
    order.title ||
    "Service Order";

  const heading = makeElement("h3", "", service);

  const id = makeElement(
    "p",
    "order-id",
    "Order ID: " + (order.orderId || order.id)
  );

  const description = makeElement(
    "p",
    "",
    order.details || order.requirements || order.description || "No additional details"
  );

  details.append(heading, id, description);

  const status = normaliseStatus(order.status);

  const statusBadge = makeElement(
    "span",
    "order-status " + status,
    status
  );

  top.append(details, statusBadge);

  const bottom = makeElement("div", "order-card-bottom");

  const date = makeElement(
    "span",
    "order-date",
    "Placed: " + formatDate(
      order.createdAt || order.timestamp || order.date
    )
  );

  const amount = order.amount ?? order.price;

  const price = makeElement(
    "span",
    "order-price",
    amount !== undefined && amount !== null
      ? "₹" + amount
      : "Price to be confirmed"
  );

  bottom.append(date, price);

  card.append(top, bottom);

  return card;
}

function renderOrders() {
  const selected = orderFilter.value;

  const filtered = selected === "all"
    ? allOrders
    : allOrders.filter(
        order => normaliseStatus(order.status) === selected
      );

  ordersList.replaceChildren();

  if (filtered.length === 0) {
    ordersEmpty.hidden = false;
    return;
  }

  ordersEmpty.hidden = true;

  filtered.forEach(order => {
    ordersList.appendChild(createOrderCard(order));
  });
}

async function loadOrders(user) {
  ordersList.replaceChildren(
    makeElement("div", "orders-loading", "Loading your orders...")
  );

  try {
    const ordersRef = collection(db, "orders");

    const userQuery = query(
      ordersRef,
      where("userId", "==", user.uid)
    );

    const userSnapshot = await getDocs(userQuery);

    let results = userSnapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    // Also check orders saved using the customer's email.
    if (user.email) {
      const emailQuery = query(
        ordersRef,
        where("customerEmail", "==", user.email)
      );

      const emailSnapshot = await getDocs(emailQuery);

      const emailResults = emailSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      const existingIds = new Set(results.map(item => item.id));

      emailResults.forEach(item => {
        if (!existingIds.has(item.id)) {
          results.push(item);
        }
      });
    }

    allOrders = results.sort((a, b) => {
      const dateA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || a.date || 0).getTime();

      const dateB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || b.date || 0).getTime();

      return dateB - dateA;
    });

    updateStats(allOrders);
    renderOrders();

  } catch (error) {
    console.error("Orders loading error:", error);

    ordersList.replaceChildren(
      makeElement(
        "div",
        "orders-loading",
        "Unable to load orders. Please check your Firebase permissions and order data."
      )
    );

    ordersEmpty.hidden = true;
  }
}

orderFilter.addEventListener("change", renderOrders);

onAuthStateChanged(auth, async user => {
  if (!user) {
    allOrders = [];
    updateStats([]);

    ordersList.replaceChildren(
      makeElement(
        "div",
        "orders-loading",
        "Please sign in to view your orders."
      )
    );

    ordersEmpty.hidden = true;
    return;
  }

  await loadOrders(user);
});
