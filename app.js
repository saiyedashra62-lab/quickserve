function generatePaymentQR(orderId, amount) {
  const container = $("paymentQr");

  if (!container) {
    console.error("paymentQr element missing in HTML");
    toast("Payment QR section not found.");
    return;
  }

  container.innerHTML = "";
  currentPaymentLink = createUpiLink(orderId, amount);

  if (!window.QRCode) {
    container.innerHTML = `
      <p>QR library loading failed. Use UPI payment below.</p>
    `;
    return;
  }

  new window.QRCode(container, {
    text: currentPaymentLink,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.M
  });
}
