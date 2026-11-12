import { auth, db, googleProvider } from "./firebase.js";

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const ADMIN_EMAIL = "saiyedashra62@gmail.com";

const services = [
  { id: "posts", name: "Social Media Posts", icon: "🎨", price: 99, desc: "Instagram, Facebook and promotional posts." },
  { id: "banners", name: "Banners & Posters", icon: "🖼️", price: 199, desc: "Promotional banners and event posters." },
  { id: "thumbnails", name: "YouTube Thumbnails", icon: "▶️", price: 149, desc: "Eye-catching video thumbnail designs." },
  { id: "resume", name: "Resume Maker", icon: "📄", price: 149, desc: "Professional resume design." },
  { id: "qr", name: "QR Code Maker", icon: "🔳", price: 49, desc: "Custom QR design requests." },
  { id: "card", name: "Digital Visiting Card", icon: "💳", price: 99, desc: "Digital business card design." },
  { id: "invoice", name: "Invoice Maker", icon: "🧾", price: 99, desc: "Invoice template design requests." },
  { id: "website", name: "Website Design", icon: "💻", price: 999, desc: "Website design and development requests." }
];

const styles = [
  { name: "Neon Glow", colors: ["#401a88", "#151a45"], title: "NEON STYLE" },
  { name: "Luxury Dark", colors: ["#5c4520", "#171717"], title: "LUXURY LOOK" },
  { name: "Modern Blue", colors: ["#075985", "#101d43"], title: "MODERN DESIGN" },
  { name: "Purple Gradient", colors: ["#8b35ce", "#27104e"], title: "PURPLE VIBE" },
  { name: "Minimal Clean", colors: ["#526174", "#202b3b"], title: "CLEAN DESIGN" },
  { name: "Bold Creative", colors: ["#b83254", "#3a173c"], title: "BOLD CREATIVE" }
];

let currentUser = null;
let selectedService = null;
let selectedStyle = 0;
let currentOrderId = null;

const $ = id => document.getElementById(id);

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3500);
}

function showSection(id) {
  $(id).classList.remove("hidden");
  $(id).scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderServices() {
  $("servicesGrid").innerHTML = services.map(service => `
    <article class="service-card">
      <div class="service-icon">${service.icon}</div>
      <h3>${escapeHTML(service.name)}</h3>
      <p>${escapeHTML(service.desc)}</p>
      <div class="price">₹${service.price}</div>
      <button class="btn btn-primary choose-service" data-id="${service.id}">
        Explore & Order
      </button>
    </article>
  `).join("");

  document.querySelectorAll(".choose-service").forEach(button => {
    button.addEventListener("click", () => {
      selectService(button.dataset.id);
    });
  });
}

function selectService(id) {
  selectedService = services.find(item => item.id === id);
  selectedStyle = 0;

  if (!selectedService) return;

  $("galleryTitle").textContent = selectedService.name + " — Choose a style";
  $("selectedServiceInfo").textContent =
    `${selectedService.name} | Service price: ₹${selectedService.price}`;

  renderStyles();
  drawPreview();

  showSection("gallery");
}

function renderStyles() {
  $("stylesGrid").innerHTML = styles.map((style, index) => `
    <article class="style-card ${index === selectedStyle ? "selected" : ""}"
      data-index="${index}">
      <div class="style-art"
        style="background:linear-gradient(130deg,${style.colors[0]},${style.colors[1]})">
        <span>${style.title}</span>
      </div>
      <h3>${style.name}</h3>
      <p>Sample layout ${index + 1}</p>
    </article>
  `).join("");

  document.querySelectorAll(".style-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedStyle = Number(card.dataset.index);
      renderStyles();
      drawPreview();
    });
  });
}

function drawPreview() {
  const canvas = $("previewCanvas");
  const ctx = canvas.getContext("2d");
  const style = styles[selectedStyle];

  const gradient = ctx.createLinearGradient(0, 0, 900, 560);
  gradient.addColorStop(0, style.colors[0]);
  gradient.addColorStop(1, style.colors[1]);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 560);

  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.beginPath();
  ctx.arc(770, 100, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(55, 55, 790, 450);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 25px Arial";
  ctx.fillText("QUICKSERVE SAMPLE", 85, 115);

  ctx.font = "bold 58px Arial";
  ctx.fillText(selectedService ? selectedService.name.toUpperCase() : "YOUR DESIGN", 85, 245, 720);

  ctx.font = "24px Arial";
  ctx.fillText(style.name.toUpperCase(), 85, 305);

  ctx.font = "18px Arial";
  ctx.fillText("YOUR TEXT • YOUR IDEA • YOUR STYLE", 85, 390);

  ctx.save();
  ctx.translate(450, 300);
  ctx.rotate(-0.45);
  ctx.fillStyle = "rgba(255,255,255,.23)";
  ctx.font = "bold 62px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SAMPLE PREVIEW", 0, 0);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "17px Arial";
  ctx.fillText("QUICKSERVE • PREVIEW ONLY", 85, 465);
}

async function login() {
  try {
    await signInWithPopup(auth, googleProvider);
    toast("Google sign-in successful.");
  } catch (error) {
    console.error(error);
    toast("Login failed: " + error.message);
  }
}

async function logout() {
  try {
    await signOut(auth);
    toast("Logged out.");
  } catch (error) {
    toast("Logout failed.");
  }
}

onAuthStateChanged(auth, async user => {
  currentUser = user;

  $("loginBtn").classList.toggle("hidden", !!user);
  $("logoutBtn").classList.toggle("hidden", !user);

  $("accountMessage").textContent = user
    ? `Signed in as ${user.email}`
    : "Sign in to view your orders.";

  $("adminPanel").classList.toggle(
    "hidden",
    !(user && user.email === ADMIN_EMAIL)
  );

  if (user) {
    await loadMyOrders();

    if (user.email === ADMIN_EMAIL) {
      await loadAdminOrders();
    }
  } else {
    $("ordersList").innerHTML = "";
    $("adminOrders").innerHTML = "";
  }
});

$("loginBtn").addEventListener("click", login);
$("logoutBtn").addEventListener("click", logout);

$("orderForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    toast("Please sign in with Google first.");
    await login();
    return;
  }

  if (!selectedService) {
    toast("Please select a service first.");
    return;
  }

  const customerName = $("customerName").value.trim();
  const whatsapp = $("whatsapp").value.trim();
  const requirements = $("requirements").value.trim();

  if (!customerName || !whatsapp || !requirements) {
    toast("Please complete all fields.");
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const order = {
      uid: currentUser.uid,
      email: currentUser.email,
      customerName,
      whatsapp,
      requirements,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      styleName: styles[selectedStyle].name,
      amount: selectedService.price,
      paymentStatus: "pending",
      orderStatus: "pending_payment",
      transactionId: "",
      deliveryNote: "",
      deliveryUrl: "",
      createdAt: serverTimestamp()
    };

    const result = await addDoc(collection(db, "orders"), order);

    currentOrderId = result.id;

    $("paymentOrderInfo").textContent =
      `Order: ${result.id} | ${selectedService.name} | Amount: ₹${selectedService.price}`;

    $("transactionId").value = "";
    showSection("paymentSection");

    toast("Order created. Complete payment and submit transaction ID.");
    await loadMyOrders();

  } catch (error) {
    console.error(error);
    toast("Order failed: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Submit Order";
  }
});

$("paymentForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || !currentOrderId) {
    toast("Create an order first.");
    return;
  }

  const transactionId = $("transactionId").value.trim();

  if (transactionId.length < 6) {
    toast("Please enter a valid transaction reference.");
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const orderRef = doc(db, "orders", currentOrderId);

    await updateDoc(orderRef, {
      transactionId,
      paymentStatus: "submitted",
      orderStatus: "pending_verification",
      paymentSubmittedAt: serverTimestamp()
    });

    toast("Payment details submitted for admin verification.");
    currentOrderId = null;

    await loadMyOrders();

  } catch (error) {
    console.error(error);
    toast("Payment submission failed: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Submit Payment Details";
  }
});

function statusLabel(value) {
  return String(value || "pending").replaceAll("_", " ");
}

async function loadMyOrders() {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, "orders"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      $("ordersList").innerHTML =
        `<div class="order-card"><p>No orders yet. Explore our services to get started.</p></div>`;
      return;
    }

    $("ordersList").innerHTML = snapshot.docs.map(item => {
      const data = item.data();

      return `
        <article class="order-card">
          <h3>${escapeHTML(data.serviceName)}</h3>
          <p>Order ID: ${escapeHTML(item.id)}</p>
          <p>Amount: ₹${Number(data.amount || 0)}</p>
          <p>Style: ${escapeHTML(data.styleName)}</p>
          <p>Payment: ${escapeHTML(statusLabel(data.paymentStatus))}</p>
          <p>Order status: ${escapeHTML(statusLabel(data.orderStatus))}</p>
          ${data.deliveryNote ? `<p>Delivery note: ${escapeHTML(data.deliveryNote)}</p>` : ""}
          ${data.deliveryUrl ? `<p>Delivery: <a href="${escapeHTML(data.deliveryUrl)}" target="_blank" rel="noopener">Open delivery link</a></p>` : ""}
          <span class="status">${escapeHTML(statusLabel(data.orderStatus))}</span>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error(error);
    $("ordersList").innerHTML =
      `<div class="order-card"><p>Could not load orders. Check Firestore indexes and rules.</p></div>`;
  }
}

async function loadAdminOrders() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;

  try {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      $("adminOrders").innerHTML =
        `<div class="admin-card"><p>No orders received yet.</p></div>`;
      return;
    }

    $("adminOrders").innerHTML = snapshot.docs.map(item => {
      const data = item.data();

      return `
        <article class="admin-card" data-order="${escapeHTML(item.id)}">
          <h3>${escapeHTML(data.serviceName)} — ₹${Number(data.amount || 0)}</h3>
          <p><b>Order ID:</b> ${escapeHTML(item.id)}</p>
          <p><b>Customer:</b> ${escapeHTML(data.customerName)}</p>
          <p><b>Email:</b> ${escapeHTML(data.email)}</p>
          <p><b>WhatsApp:</b> ${escapeHTML(data.whatsapp)}</p>
          <p><b>Style:</b> ${escapeHTML(data.styleName)}</p>
          <p><b>Requirements:</b> ${escapeHTML(data.requirements)}</p>
          <p><b>Transaction ID:</b> ${escapeHTML(data.transactionId || "Not submitted")}</p>
          <p><b>Payment:</b> ${escapeHTML(statusLabel(data.paymentStatus))}</p>
          <p><b>Order:</b> ${escapeHTML(statusLabel(data.orderStatus))}</p>

          <div class="admin-actions">
            <button class="btn btn-primary verify-btn" data-id="${escapeHTML(item.id)}">
              Verify payment
            </button>
            <button class="btn btn-outline reject-btn" data-id="${escapeHTML(item.id)}">
              Reject payment
            </button>
            <input class="delivery-note" placeholder="Delivery note / instructions">
            <input class="delivery-url" type="url" placeholder="Optional delivery URL (https://...)">
            <button class="btn btn-primary deliver-btn" data-id="${escapeHTML(item.id)}">
              Mark delivered
            </button>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll(".verify-btn").forEach(button => {
      button.addEventListener("click", () => updatePayment(button.dataset.id, true));
    });

    document.querySelectorAll(".reject-btn").forEach(button => {
      button.addEventListener("click", () => updatePayment(button.dataset.id, false));
    });

    document.querySelectorAll(".deliver-btn").forEach(button => {
      button.addEventListener("click", () => {
        const card = button.closest(".admin-card");
        updateDelivery(
          button.dataset.id,
          card.querySelector(".delivery-note").value.trim(),
          card.querySelector(".delivery-url").value.trim()
        );
      });
    });

  } catch (error) {
    console.error(error);
    $("adminOrders").innerHTML =
      `<div class="admin-card"><p>Admin orders could not load: ${escapeHTML(error.message)}</p></div>`;
  }
}

async function updatePayment(orderId, approved) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    toast("Admin access required.");
    return;
  }

  try {
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
      paymentStatus: approved ? "verified" : "rejected",
      orderStatus: approved ? "paid_processing" : "payment_rejected",
      verifiedAt: serverTimestamp()
    });

    toast(approved ? "Payment marked verified." : "Payment marked rejected.");

    await loadAdminOrders();
    await loadMyOrders();

  } catch (error) {
    console.error(error);
    toast("Update failed: " + error.message);
  }
}

async function updateDelivery(orderId, note, url) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    toast("Admin access required.");
    return;
  }

  if (!note && !url) {
    toast("Enter a delivery note or delivery URL.");
    return;
  }

  try {
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
      orderStatus: "delivered",
      deliveryNote: note,
      deliveryUrl: url,
      deliveredAt: serverTimestamp()
    });

    toast("Order marked delivered.");
    await loadAdminOrders();
    await loadMyOrders();

  } catch (error) {
    console.error(error);
    toast("Delivery update failed: " + error.message);
  }
}

renderServices();
$("year").textContent = new Date().getFullYear();
