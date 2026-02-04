const startButton = document.querySelector(".cta");
const introScreen = document.querySelector(".intro");
const boothScreen = document.querySelector(".booth");
const cameraFeed = document.querySelector(".camera-feed");
const cameraMessage = document.querySelector(".camera-message");
const stripButtons = document.querySelectorAll(".strip-selector__button");
const captureButton = document.querySelector(".capture");
const countdownDisplay = document.querySelector(".countdown");
const cameraFlash = document.querySelector(".camera-flash");

const CAPTURE_INTERVAL_MS = 700;
const COUNTDOWN_SECONDS = 3;

let selectedStripCount = 1;
let capturedImages = [];
let isCapturing = false;

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

const sleep = (duration) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const setCaptureState = (state) => {
  isCapturing = state;
  if (captureButton) {
    captureButton.disabled = state;
  }
};

const updateStripSelection = (button) => {
  stripButtons.forEach((stripButton) => {
    stripButton.classList.toggle("is-selected", stripButton === button);
  });
};

const showCountdownValue = (value) => {
  if (!countdownDisplay) {
    return;
  }
  countdownDisplay.textContent = value;
  countdownDisplay.classList.add("is-visible");
  window.setTimeout(() => {
    countdownDisplay.classList.remove("is-visible");
  }, 700);
};

const runCountdown = async () => {
  for (let counter = COUNTDOWN_SECONDS; counter >= 1; counter -= 1) {
    showCountdownValue(counter);
    await sleep(1000);
  }
};

const triggerFlash = () => {
  if (!cameraFlash) {
    return;
  }
  cameraFlash.classList.add("is-active");
  window.setTimeout(() => {
    cameraFlash.classList.remove("is-active");
  }, 200);
};

const captureFrame = () => {
  if (!cameraFeed) {
    return null;
  }
  const width = cameraFeed.videoWidth;
  const height = cameraFeed.videoHeight;
  if (!width || !height) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(cameraFeed, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.92);
};

const handleCaptureSequence = async () => {
  if (isCapturing || !cameraFeed?.srcObject) {
    return;
  }

  setCaptureState(true);
  capturedImages = [];
  showCameraMessage(`Get ready... (${selectedStripCount} shot${selectedStripCount > 1 ? "s" : ""})`);

  for (let shotIndex = 0; shotIndex < selectedStripCount; shotIndex += 1) {
    await runCountdown();
    const imageData = captureFrame();
    if (imageData) {
      capturedImages.push(imageData);
    }
    triggerFlash();
    showCameraMessage(`Captured ${capturedImages.length} of ${selectedStripCount}.`);
    if (shotIndex < selectedStripCount - 1) {
      await sleep(CAPTURE_INTERVAL_MS);
    }
  }

  showCameraMessage(`Capture complete. ${capturedImages.length} photo${capturedImages.length !== 1 ? "s" : ""} saved.`);
  setCaptureState(false);
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

stripButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextCount = Number(button.textContent);
    if (!Number.isNaN(nextCount)) {
      selectedStripCount = nextCount;
      updateStripSelection(button);
      showCameraMessage(`Strip set to ${selectedStripCount} photo${selectedStripCount > 1 ? "s" : ""}.`);
    }
  });
});

if (stripButtons.length > 0) {
  selectedStripCount = Number(stripButtons[0].textContent) || 1;
  updateStripSelection(stripButtons[0]);
}

if (startButton) {
  startButton.addEventListener("click", startBooth);
}

if (captureButton) {
  captureButton.addEventListener("click", handleCaptureSequence);
}
