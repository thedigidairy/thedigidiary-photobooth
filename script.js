const startButton = document.querySelector(".cta");
const introScreen = document.querySelector(".intro");
const boothScreen = document.querySelector(".booth");
const reviewScreen = document.querySelector(".review");
const outputScreen = document.querySelector(".output");
const cameraFeed = document.querySelector(".camera-feed");
const cameraMessage = document.querySelector(".camera-message");
const stripButtons = document.querySelectorAll(".strip-selector__button");
const captureButton = document.querySelector(".capture");
const countdownDisplay = document.querySelector(".countdown");
const cameraFlash = document.querySelector(".camera-flash");
const reviewStrip = document.querySelector(".review__strip");
const retakeButton = document.querySelector(".review__button--ghost");
const looksGoodButton = document.querySelector(".review__button--solid");

const CAPTURE_INTERVAL_MS = 700;
const COUNTDOWN_SECONDS = 3;

let selectedStripCount = 1;
let capturedImages = [];
let isCapturing = false;
let activeStream = null;

const screens = [introScreen, boothScreen, reviewScreen, outputScreen].filter(
  Boolean,
);

const setActiveScreen = (activeScreen) => {
  screens.forEach((screen) => {
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

const stopCameraStream = () => {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
  }
  activeStream = null;
  if (cameraFeed) {
    cameraFeed.srcObject = null;
  }
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

const renderReviewStrip = () => {
  if (!reviewStrip) {
    return;
  }
  reviewStrip.innerHTML = "";
  capturedImages.forEach((imageData, index) => {
    const image = document.createElement("img");
    image.src = imageData;
    image.alt = `Captured photo ${index + 1}`;
    reviewStrip.appendChild(image);
  });
};

const showReviewScreen = () => {
  renderReviewStrip();
  setActiveScreen(reviewScreen);
};

const handleCaptureSequence = async () => {
  if (isCapturing || !cameraFeed?.srcObject) {
    return;
  }

  setCaptureState(true);
  capturedImages = [];
  showCameraMessage(
    `Get ready... (${selectedStripCount} shot${selectedStripCount > 1 ? "s" : ""})`,
  );

  for (let shotIndex = 0; shotIndex < selectedStripCount; shotIndex += 1) {
    await runCountdown();
    const imageData = captureFrame();
    if (imageData) {
      capturedImages.push(imageData);
    }
    triggerFlash();
    showCameraMessage(
      `Captured ${capturedImages.length} of ${selectedStripCount}.`,
    );
    if (shotIndex < selectedStripCount - 1) {
      await sleep(CAPTURE_INTERVAL_MS);
    }
  }

  showCameraMessage("");
  setCaptureState(false);
  stopCameraStream();
  showReviewScreen();
};

const startBooth = async () => {
  setActiveScreen(boothScreen);
  showCameraMessage("Requesting camera access...");

  try {
    const stream = await getCameraStream();
    activeStream = stream;
    if (cameraFeed) {
      cameraFeed.srcObject = stream;
    }
    showCameraMessage("");
    setCaptureState(false);
  } catch (error) {
    const isDenied =
      error?.name === "NotAllowedError" || error?.name === "SecurityError";
    const message = isDenied
      ? "Camera access was denied. Please allow permission and refresh the page."
      : "We couldn’t access your camera. Please check your browser settings.";
    showCameraMessage(message);
  }
};

const resetCaptureFlow = () => {
  capturedImages = [];
  renderReviewStrip();
  stopCameraStream();
  startBooth();
};

const handleLooksGood = () => {
  setActiveScreen(outputScreen);
};

stripButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextCount = Number(button.textContent);
    if (!Number.isNaN(nextCount)) {
      selectedStripCount = nextCount;
      updateStripSelection(button);
      showCameraMessage(
        `Strip set to ${selectedStripCount} photo${selectedStripCount > 1 ? "s" : ""}.`,
      );
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

if (retakeButton) {
  retakeButton.addEventListener("click", resetCaptureFlow);
}

if (looksGoodButton) {
  looksGoodButton.addEventListener("click", handleLooksGood);
}
