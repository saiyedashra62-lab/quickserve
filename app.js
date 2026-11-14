function generatePaymentQR(orderId, amount) {
  const container = $("paymentQr");
  container.innerHTML = "";

  currentPaymentLink = createUpiLink(orderId, amount);

  const fallbackQR = () => {
    const image = document.createElement("img");
    image.alt = "Scan to pay QuickServe";
    image.width = 220;
    image.height = 220;
    image.style.display = "block";
    image.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
      encodeURIComponent(currentPaymentLink);

    container.innerHTML = "";
    container.appendChild(image);
  };

  if (!window.QRCode) {
    fallbackQR();
    return;
  }

  try {
    new window.QRCode(container, {
      text: currentPaymentLink,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M
    });

    setTimeout(() => {
      if (!container.querySelector("canvas, img")) {
        fallbackQR();
      }
    }, 1000);
  } catch (error) {
    console.error(error);
    fallbackQR();
  }
}
