
const serviceLinks = document.querySelectorAll("[data-service]");
const serviceSelect = document.getElementById("service");
const orderForm = document.getElementById("orderForm");
const formMessage = document.getElementById("formMessage");

serviceLinks.forEach((link) => {
  link.addEventListener("click", () => {
    serviceSelect.value = link.dataset.service;
  });
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const service = serviceSelect.value;
  const customer = document.getElementById("customer").value.trim();
  const email = document.getElementById("email").value.trim();
  const details = document.getElementById("details").value.trim();

  if (!service || !customer || !email || !details) {
    formMessage.textContent = "Please complete all fields.";
    return;
  }

  const subject = encodeURIComponent("QuickServe Service Order");
  const body = encodeURIComponent(
    `New order enquiry\n\nService: ${service}\nName: ${customer}\nEmail: ${email}\nDetails: ${details}`
  );

  formMessage.textContent =
    "Your email app will open to send this order enquiry.";

  window.location.href =
    `mailto:YOUR_EMAIL@example.com?subject=${subject}&body=${body}`;
});
