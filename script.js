const video = document.getElementById('video');
const statusText = document.getElementById('status');

let savedDescriptors = [];
let faceMatcher;

async function startVideo() {
  // Load models from GitHub-hosted URL
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam: ", err);
    statusText.innerText = '❌ Cannot access webcam';
    return;
  }

  statusText.innerText = '✅ Ready to register or unlock!';
}

async function captureFaceDescriptor() {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  console.log('Detection:', detection);

  if (!detection) {
    statusText.innerText = '😞 No face detected. Make sure your face is visible and well-lit.';
    return null;
  }

  return detection.descriptor;
}

async function registerFace() {
  const descriptor = await captureFaceDescriptor();
  if (descriptor) {
    savedDescriptors.push(new faceapi.LabeledFaceDescriptors("User" + savedDescriptors.length, [descriptor]));
    statusText.innerText = `😀 Face ${savedDescriptors.length} registered!`;
    if (savedDescriptors.length >= 3) {
      faceMatcher = new faceapi.FaceMatcher(savedDescriptors, 0.6);
      statusText.innerText += " You can now try to unlock!";
    }
  }
}

async function unlockWithFace() {
  if (!faceMatcher) {
    statusText.innerText = "⚠️ Register 3 faces first!";
    return;
  }

  const descriptor = await captureFaceDescriptor();
  if (descriptor) {
    const match = faceMatcher.findBestMatch(descriptor);
    if (match.label !== 'unknown') {
      statusText.innerText = `✅ UNLOCKED! Welcome ${match.label}`;
    } else {
      statusText.innerText = `⛔ Face not recognized!`;
    }
  }
}

startVideo();
