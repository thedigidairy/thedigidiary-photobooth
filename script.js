const startButton = document.querySelector(".cta");
const introScreen = document.querySelector(".intro");
const boothScreen = document.querySelector(".booth");
const cameraFeed = document.querySelector(".camera-feed");
const cameraMessage = document.querySelector(".camera-message");

const setActiveScreen = (activeScreen) => {
  [introScreen, boothScreen].forEach((screen) => {
    if (!screen) {
      return;
    }
    screen.classList.toggle("screen--active", screen === activeScreen);
  });
};

const getCameraStream = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("CameraUnsupported");
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
    },
    audio: false,
  });
};

const showCameraMessage = (message) => {
  if (cameraMessage) {
    cameraMessage.textContent = message;
  }
};

const startBooth = async () => {
  setActiveScreen(boothScreen);
  showCameraMessage("Requesting camera access...");

  try {
    const stream = await getCameraStream();
    if (cameraFeed) {
      cameraFeed.srcObject = stream;
    }
    showCameraMessage("");
  } catch (error) {
    const isDenied =
      error?.name === "NotAllowedError" || error?.name === "SecurityError";
    const message = isDenied
      ? "Camera access was denied. Please allow permission and refresh the page."
      : "We couldn’t access your camera. Please check your browser settings.";
    showCameraMessage(message);
  }
};

if (startButton) {
  startButton.addEventListener("click", startBooth);
}
