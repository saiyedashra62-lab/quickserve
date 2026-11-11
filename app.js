
import { db } from "./firebase.js";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const services = [
  {
    name: "Social Media Posts",
    price: 99,
    icon: "📱",
    description: "Creative Instagram and social media designs."
  },
  {
    name: "Banners & Posters",
    price: 199,
    icon: "🎨",
    description: "Professional promotional banners and posters."
  },
  {
    name: "YouTube Thumbnails",
    price: 149,
    icon: "▶️",
    description: "Eye-catching YouTube thumbnail designs."
  },
  {
    name: "Resume Maker",
    price: 149,
    icon: "📄",
    description: "Clean and professional resume designs."
  },
  {
    name: "QR Code Maker",
    price: 49,
    icon: "▦",
    description: "Custom QR code designs for your business."
  },
  {
    name: "Digital Visiting Card",
    price: 99,
    icon: "💳",
    description: "Modern digital business cards."
  },
  {
    name: "Invoice Maker",
    price: 99,
    icon: "🧾",
    description: "Professional invoice designs."
  },
  {
    name: "Website Design",
    price: 999,
    icon: "💻",
    description: "Modern responsive website designs."
  }
];

const demoStyles = [
  "Modern Minimal",
  "Luxury Premium",
  "Bold Creative",
  "Neon Glow",
  "Elegant Classic",
  "Business Professional"
];

const serviceGrid = document.getElementById("serviceGrid");
const demoModal = document.getElementById("demoModal");
const demoGrid = document.getElementById("demoGrid");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalContinue = document.getElementById("modalContinue");
const closeModal = document.getElementById("closeModal");

const orderForm = document.getElementById("orderForm");
const serviceSelect = document.getElementById("service");
const demoStyleInput = document.getElementById("demoStyle");
const customerInput = document.getElementById("customer");
const emailInput = document.getElementById("email");
const detailsInput = document.getElementById("details");
const formMessage = document.getElementById("formMessage");

const paymentSection = document.getElementById("paymentSection");
const paymentAmount = document.getElementById("paymentAmount");
const orderReference = document.getElementById("orderReference");
const transactionId = document.getElementById("transactionId");
const submitPayment = document.getElementById("submitPayment");
const copyUpi = document.getElementById("copyUpi");

const UPI_ID = "YOUR_UPI_ID_HERE";

let selectedService = null;
let selectedStyle = "";
let currentOrderId = "";

function createId() {
  return "QS" + Date.now().toString().slice(-8);
}

function renderServices() {
  if (!serviceGrid) return;

  serviceGrid.innerHTML = services.map((service, index) => `
    <article class="service-card">
      <div class="service-icon">${service.icon}</div>
      <h3>${service.name}</h3>
      <p>${service.description}</p>
      <button type="button" data-index="${index}">
        View 6 demos →
      </button>
      <strong>₹${service.price}</strong>
    </article>
  `).join("");

  serviceGrid.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      openDemos(Number(button.dataset.index));
    });
  });
}

function openDemos(index) {
  selectedService = services[index];
  selectedStyle = "";

  modalTitle.textContent = selectedService.name + " — Choose Your Style";
  modalPrice.textContent = "₹" + selectedService.price;

  demoGrid.innerHTML = demoStyles.map((style, i) => `
    <button type="button" class="demo-card" data-style="${style}">
      <div class="demo-art" style="background:
        ${[
          "linear-gradient(135deg,#253b80,#11152e)",
          "linear-gradient(135deg,#8b5cf6,#24103f)",
          "linear-gradient(135deg,#f97316,#401329)",
          "linear-gradient(135deg,#06b6d4,#171047)",
          "linear-gradient(135deg,#a16207,#292019)",
          "linear-gradient(135deg,#166534,#101d2c)"
        ][i]}">
        <div class="art-copy">
          <small>QUICKSERVE DESIGN</small>
          ${style}
        </div>
      </div>
      <span class="demo-name">${i + 1}. ${style}</span>
    </button>
  `).join("");

  demoGrid.querySelectorAll(".demo-card").forEach(card => {
    card.addEventListener("click", () => {
      demoGrid.querySelectorAll(".demo-card").forEach(item => {
        item.classList.remove("selected");
      });

      card.classList.add("selected");
      selectedStyle = card.dataset.style;
    });
  });

  demoModal.classList.add("open");
}

closeModal?.addEventListener("click", () => {
  demoModal.classList.remove("open");
});

demoModal?.addEventListener("click", event => {
  if (event.target === demoModal) {
    demoModal.classList.remove("open");
  }
});

modalContinue?.addEventListener("click", () => {
  if (!selectedService || !selectedStyle) {
    alert("Please select a design style first.");
    return;
  }

  serviceSelect.value = selectedService.name;
  demoStyleInput.value = selectedStyle;

  demoModal.classList.remove("open");

  document.getElementById("checkout")?.scrollIntoView({
    behavior: "smooth"
  });
});

orderForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!selectedService || !selectedStyle) {
    formMessage.textContent = "Please choose a service and design demo first.";
    return;
  }

  const customer = customerInput.value.trim();
  const email = emailInput.value.trim();
  const details = detailsInput.value.trim();

  if (!customer || !email || !details) {
    formMessage.textContent = "Please complete all required fields.";
    return;
  }

  currentOrderId = createId();

  const order = {
    orderId: currentOrderId,
    service: selectedService.name,
    style: selectedStyle,
    customer,
    email,
    details,
    amount: selectedService.price,
    paymentStatus: "pending",
    createdAt: serverTimestamp()
  };

  const submitButton = orderForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Creating order...";

  try {
    await setDoc(doc(db, "orders", currentOrderId), order);

    paymentAmount.textContent = "₹" + selectedService.price;
    orderReference.textContent = "Order ID: " + currentOrderId;

    paymentSection.hidden = false;
    formMessage.textContent =
      "Order created. Complete payment and submit your transaction reference.";

    paymentSection.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error(error);
    formMessage.textContent =
      "Could not create order. Please check Firebase settings and try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Continue to Payment";
  }
});

copyUpi?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(UPI_ID);
    copyUpi.textContent = "Copied!";
  } catch {
    copyUpi.textContent = "Copy unavailable";
  }
});

submitPayment?.addEventListener("click", async () => {
  const reference = transactionId.value.trim();

  if (!currentOrderId) {
    alert("Please create an order first.");
    return;
  }

  if (reference.length < 6) {
    alert("Please enter a valid transaction reference.");
    return;
  }

  submitPayment.disabled = true;
  submitPayment.textContent = "Submitting...";

  try {
    await addDoc(collection(db, "paymentSubmissions"), {
      orderId: currentOrderId,
      transactionId: reference,
      verificationStatus: "pending",
      submittedAt: serverTimestamp()
    });

    alert(
      "Payment reference submitted. Your order is pending payment verification."
    );

    transactionId.value = "";
    submitPayment.textContent = "Reference Submitted";

  } catch (error) {
    console.error(error);
    alert("Could not submit reference. Please try again.");
    submitPayment.disabled = false;
    submitPayment.textContent = "Submit Payment Reference";
  }
});

renderServices();
      
