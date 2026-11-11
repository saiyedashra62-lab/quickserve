
import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const serviceLinks = document.querySelectorAll("[data-service]");
const serviceSelect = document.getElementById("service");
const orderForm = document.getElementById("orderForm");
const formMessage = document.getElementById("formMessage");

const paymentSection = document.getElementById("paymentSection");
const paymentAmount = document.getElementById("paymentAmount");
const orderIdDisplay = document.getElementById("orderIdDisplay");
const transactionIdInput = document.getElementById("transactionId");
const submitPayment = document.getElementById("submitPayment");
const paymentMessage = document.getElementById("paymentMessage");

let currentOrderId = null;

// Service prices
const prices = {
  "Social Media Posts": 99,
  "Banners & Posters": 199,
  "YouTube Thumbnails": 149,
  "Resume Maker": 149,
  "QR Code Maker": 49,
  "Digital Visiting Card": 99,
  "Invoice Maker": 99,
  "Website Design": 999
};

// Select service from service cards
serviceLinks.forEach((link) => {
  link.addEventListener("click", () => {
    serviceSelect.value = link.dataset.service;
  });
});

// Generate order ID
function generateOrderId() {
  return "QS" + Date.now().toString().slice(-9) +
    Math.floor(100 + Math.random() * 900);
}

// Create order
orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const service = serviceSelect.value;
  const customer = document.getElementById("customer").value.trim();
  const email = document.getElementById("email").value.trim();
  const details = document.getElementById("details").value.trim();

  if (!service || !customer || !email || !details) {
    formMessage.textContent = "Please complete all fields.";
    return;
  }

  const amount = prices[service];

  if (!amount) {
    formMessage.textContent = "Please select a valid service.";
    return;
  }

  const button = orderForm.querySelector('button[type="submit"]');
  button.disabled = true;
  formMessage.textContent = "Creating your order...";

  const orderId = generateOrderId();

  try {
    await setDoc(doc(db, "orders", orderId), {
      orderId,
      service,
      customer,
      email,
      details,
      amount,
      paymentStatus: "pending",
      createdAt: serverTimestamp()
    });

    currentOrderId = orderId;

    paymentAmount.textContent = `Amount to pay: ₹${amount}`;
    orderIdDisplay.textContent = `Order ID: ${orderId}`;

    formMessage.textContent = "Order created successfully!";
    paymentSection.hidden = false;

    paymentSection.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    button.textContent = "Order Created";

  } catch (error) {
    console.error("Order error:", error);
    formMessage.textContent =
      "Could not create order. Please try again.";
    button.disabled = false;
  }
});

// Submit transaction ID for manual verification
submitPayment.addEventListener("click", async () => {
  const transactionId = transactionIdInput.value.trim();

  if (!currentOrderId) {
    paymentMessage.textContent = "Please create an order first.";
    return;
  }

  if (transactionId.length < 6) {
    paymentMessage.textContent = "Please enter a valid transaction ID.";
    return;
  }

  submitPayment.disabled = true;
  paymentMessage.textContent = "Submitting payment details...";

  try {
    await addDoc(collection(db, "paymentSubmissions"), {
      orderId: currentOrderId,
      transactionId,
      verificationStatus: "pending",
      createdAt: serverTimestamp()
    });

    paymentMessage.textContent =
      "Details submitted! Your payment is awaiting verification. Your order is not confirmed yet.";

    transactionIdInput.disabled = true;
    submitPayment.textContent = "Details Submitted";

  } catch (error) {
    console.error("Payment submission error:", error);
    paymentMessage.textContent =
      "Submission failed. Please try again.";
    submitPayment.disabled = false;
  }
});
                           
