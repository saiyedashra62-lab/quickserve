import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const services = [
  { id: "posts", name: "Social Media Posts", price: 99, icon: "📱", desc: "Creative posts for Instagram and social media." },
  { id: "banners", name: "Banners & Posters", price: 199, icon: "🎨", desc: "Eye-catching banners, flyers and posters." },
  { id: "thumbnails", name: "YouTube Thumbnails", price: 149, icon: "▶️", desc: "Bold thumbnail layouts for your videos." },
  { id: "resume", name: "Resume Maker", price: 149, icon: "📄", desc: "Clean and professional resume layouts." },
  { id: "qr", name: "QR Code Maker", price: 49, icon: "▦", desc: "Simple branded QR design layouts." },
  { id: "card", name: "Digital Visiting Card", price: 99, icon: "💳", desc: "Digital business card design layouts." },
  { id: "invoice", name: "Invoice Maker", price: 99, icon: "🧾", desc: "Professional invoice layout designs." },
  { id: "website", name: "Website Design", price: 999, icon: "🌐", desc: "Website layout concepts for your business." }
];

const styles = [
  { name: "Purple Glow", bg: "#24134b", accent: "#d7a6ff" },
  { name: "Midnight", bg: "#101b32", accent: "#76c9ff" },
  { name: "Luxury Gold", bg: "#282015", accent: "#e9c77a" },
  { name: "Neon", bg: "#111522", accent: "#75ffd2" },
  { name: "Rose", bg: "#35172e", accent: "#ffb0d1" },
  { name: "Minimal", bg: "#e9e7f1", accent: "#6e4ad1", dark: true }
];

const $ = (id) => document.getElementById(id);

let selectedStyle = 0;
let currentOrderId = "";
let currentOrderAmount = 0;
let designReady = false;

function fillServiceSelect(select) {
  select.innerHTML = services.map(service =>
    `<option value="${service.id}">${service.name} — ₹${service.price}</option>`
  ).join("");
}

function renderServices() {
  $("serviceGrid").innerHTML = services.map(service => `
    <article class="service-card">
      <div class="service-icon">${service.icon}</div>
      <h3>${service.name}</h3>
      <p>${service.desc}</p>
      <div class="service-bottom">
        <span class="price">₹${service.price}</span>
        <button class="choose-btn" data-service="${service.id}">Choose ↗</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-service]").forEach(button => {
    button.addEventListener("click", () => selectService(button.dataset.service));
  });
}

function renderDemoStyles() {
  $("demoGrid").innerHTML = styles.map((style, index) => `
    <button type="button" class="demo-option ${index === selectedStyle ? "active" : ""}"
      data-style="${index}">${style.name}</button>
  `).join("");

  document.querySelectorAll("[data-style]").forEach(button => {
    button.addEventListener("click", () => {
      selectedStyle = Number(button.dataset.style);
      renderDemoStyles();
    });
  });
}

function selectService(id) {
  $("selectedService").value = id;
  $("orderService").value = id;
  updateOrderPrice();
  $("studio").scrollIntoView({ behavior: "smooth" });
}

function updateOrderPrice() {
  const service = services.find(item => item.id === $("orderService").value);
  $("orderAmount").value = service ? `₹${service.price}` : "";
}

function drawDesign() {
  const canvas = $("designCanvas");
  const ctx = canvas.getContext("2d");
  const style = styles[selectedStyle];
  const service = services.find(item => item.id === $("selectedService").value);

  const title = $("designTitle").value.trim() || service.name.toUpperCase();
  const subtitle = $("designSubtitle").value.trim() || "YOUR IDEA. YOUR STYLE.";
  const prompt = $("designPrompt").value.trim();

  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dark = style.dark;
  const mainColor = dark ? "#171326" : "#ffffff";
  const textColor = dark ? "#171326" : "#ffffff";

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, style.accent);
  gradient.addColorStop(1, style.bg);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(850, 180, 350, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = style.accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(55, 55, 970, 970);

  ctx.fillStyle = style.accent;
  ctx.font = "bold 28px Arial";
  ctx.fillText("QUICKSERVE  /  CREATIVE STUDIO", 95, 135);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = style.accent;
  ctx.beginPath();
  ctx.arc(830, 720, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = textColor;
  ctx.font = "bold 82px Arial";

  const words = title.split(" ");
  let lines = [];
  let line = "";

  words.forEach(word => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > 850 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  let y = 420;
  lines.slice(0, 3).forEach(item => {
    ctx.fillText(item, 95, y);
    y += 105;
  });

  ctx.fillStyle = style.accent;
  ctx.fillRect(95, y + 5, 170, 8);

  ctx.fillStyle = textColor;
  ctx.font = "32px Arial";
  ctx.fillText(subtitle.slice(0, 55), 95, y + 100);

  ctx.font = "bold 23px Arial";
  ctx.fillStyle = style.accent;
  ctx.fillText(service.name.toUpperCase(), 95, 900);

  ctx.font = "20px Arial";
  ctx.fillStyle = textColor;
  ctx.fillText("DESIGN  •  CREATE  •  GROW", 95, 950);

  if (prompt) {
    ctx.globalAlpha = 0.7;
    ctx.font = "18px Arial";
    ctx.fillStyle = textColor;
    ctx.fillText("CUSTOM CONCEPT PREVIEW", 95, 990);
    ctx.globalAlpha = 1;
  }

  designReady = true;
  $("downloadBtn").disabled = false;
}

function downloadDesign() {
  if (!designReady) return;
  const link = document.createElement("a");
  link.download = "quickserve-design.png";
  link.href = $("designCanvas").toDataURL("image/png");
  link.click();
}

async function createOrder(event) {
  event.preventDefault();

  const name = $("customerName").value.trim();
  const whatsapp = $("whatsapp").value.trim();
  const service = services.find(item => item.id === $("orderService").value);
  const requirements = $("requirements").value.trim();

  if (!service) {
    alert("Please select a service.");
    return;
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(whatsapp)) {
    alert("Please enter a valid contact number.");
    return;
  }

  const button = $("placeOrderBtn");
  button.disabled = true;
  button.textContent = "Creating order...";

  try {
    const order = await addDoc(collection(db, "orders"), {
      customerName: name,
      whatsapp,
      serviceId: service.id,
      serviceName: service.name,
      requirements,
      amount: service.price,
      paymentStatus: "pending",
      orderStatus: "pending_verification",
      createdAt: serverTimestamp()
    });

    currentOrderId = order.id;
    currentOrderAmount = service.price;

    $("paymentAmount").textContent = `₹${service.price}`;
    $("paymentPanel").classList.remove("hidden");
    $("orderStatus").textContent = `Order reference: ${order.id}`;
    $("paymentPanel").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    alert("Order could not be saved. Please check your internet and Firebase setup.");
  } finally {
    button.disabled = false;
    button.textContent = "Continue to Payment →";
  }
}

async function submitPayment(event) {
  event.preventDefault();

  if (!currentOrderId) {
    alert("Please create an order first.");
    return;
  }

  const transactionId = $("transactionId").value.trim();
  if (transactionId.length < 5) {
    alert("Please enter a valid transaction/reference ID.");
    return;
  }

  const button = $("paymentForm").querySelector("button");
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    await addDoc(collection(db, "paymentSubmissions"), {
      orderId: currentOrderId,
      transactionId,
      amount: currentOrderAmount,
      verificationStatus: "pending",
      submittedAt: serverTimestamp()
    });

    $("orderStatus").textContent =
      "Payment details submitted. Your payment is pending manual verification. Keep your order reference safe.";

    $("paymentForm").reset();
  } catch (error) {
    console.error(error);
    alert("Payment details could not be submitted. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Submit Payment Details";
  }
}

function init() {
  fillServiceSelect($("selectedService"));
  fillServiceSelect($("orderService"));
  renderServices();
  renderDemoStyles();
  updateOrderPrice();

  $("selectedService").addEventListener("change", () => {
    $("orderService").value = $("selectedService").value;
    updateOrderPrice();
    designReady = false;
    $("downloadBtn").disabled = true;
  });

  $("orderService").addEventListener("change", updateOrderPrice);
  $("generateBtn").addEventListener("click", drawDesign);
  $("downloadBtn").addEventListener("click", downloadDesign);
  $("orderForm").addEventListener("submit", createOrder);
  $("paymentForm").addEventListener("submit", submitPayment);

  $("year").textContent = new Date().getFullYear();
}

init();
