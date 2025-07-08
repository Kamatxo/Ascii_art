// Main logic for the ASCII Art application

// ============================================================================
// Variable and DOM Element Declarations
// ============================================================================
// These variables store references to DOM elements and state for the ASCII Art app.
let gifWorkerURL = null;
const fileInput = document.getElementById("fileInput");
const resolutionInput = document.getElementById("resolution");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("video");
const ascii = document.getElementById("ascii");
let asciiChars = "@%#*+=-:. ";
let isDotted = false;
let isExtendedCharSet = false;

// ----------------------------------------------------------------------------
// GIF Worker Setup
// ----------------------------------------------------------------------------
// Loads the GIF worker script for GIF encoding in a web worker, if not already loaded.
async function setupGifWorker() {
  if (gifWorkerURL) return gifWorkerURL;
  const response = await fetch("./libs/gif.worker.js");
  const workerCode = await response.text();
  const blob = new Blob([workerCode], { type: "application/javascript" });
  gifWorkerURL = URL.createObjectURL(blob);
  GIF.prototype.workerScript = gifWorkerURL;
  return gifWorkerURL;
}

// ============================================================================
// Event Listeners
// ============================================================================
// Handles file input change events to show/hide export buttons and controls.
fileInput.addEventListener('change', function() {
  const file = fileInput.files[0];
  const gifBtn = document.getElementById('saveGifBtn');
  const webmBtn = document.getElementById('saveWebmBtn');
  const videoControls = document.getElementById('videoControls');
  if (file && file.type.startsWith('video')) {
    gifBtn.style.display = '';
    webmBtn.style.display = '';
    if (videoControls) videoControls.style.display = '';
  } else {
    gifBtn.style.display = 'none';
    webmBtn.style.display = 'none';
    if (videoControls) videoControls.style.display = 'none';
  }
});

// ============================================================================
// Character Set Toggles
// ============================================================================
// Switches between the default and extended ASCII character sets.
function setCharSet() {
  const btn = document.getElementById("toggleCharSetBtn");
  if (!isExtendedCharSet) {
    asciiChars = "$@B%8&WM#*(){}[]|/\\?<>+=-_:;,.!~^`'\" ";
    isExtendedCharSet = true;
    btn.textContent = "-Character";
  } else {
    asciiChars = "@%#*+=-:. ";
    isExtendedCharSet = false;
    btn.textContent = "+Character";
  }
  startAscii();
}

// Switches between the default ASCII character set and a dotted style.
function setDottedAscii() {
  const btn = document.getElementById("toggleAsciiBtn");
  if (!isDotted) {
    asciiChars = "........        ";
    isDotted = true;
    btn.textContent = "Character";
  } else {
    asciiChars = "@%#*+=-:. ";
    isDotted = false;
    btn.textContent = "Dotted";
  }
  startAscii();
}

// ============================================================================
// Video Control Functions
// ============================================================================
// Plays the video from the beginning if at the end.
function playVideo() {
  if (video.currentTime >= video.duration) {
    video.currentTime = 0;
  }
  video.play();
}
// Pauses the video playback.
function pauseVideo() {
  video.pause();
}
// Stops the video and resets playback position to start.
function stopVideo() {
  video.pause();
  video.currentTime = 0;
}

// ============================================================================
// ASCII Conversion and Rendering
// ============================================================================
// Converts the loaded image or video to ASCII art and renders it in the DOM.
function startAscii() {
  const file = fileInput.files[0];
  const res = parseInt(resolutionInput.value);
  if (!file || isNaN(res)) return;
  if (file.type.startsWith("image")) {
    // Handle image files: draw to canvas, convert to ASCII, and display
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      const width = res;
      const height = Math.floor(res * ratio * 0.5);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      ascii.textContent = imageToAscii(ctx, canvas, width, height, asciiChars);
      fitAsciiToContainer(ascii, document.querySelector('.col-main'));
    };
    img.src = URL.createObjectURL(file);
  } else if (file.type.startsWith("video")) {
    // Handle video files: play and process frames to ASCII
    video.src = URL.createObjectURL(file);
    video.play();
    let lastFrame = 0;
    video.addEventListener("play", function stepper() {
      function step() {
        if (video.paused || video.ended) return;
        // Update ASCII art only every 0.2 seconds
        if (video.currentTime - lastFrame >= 0.2) {
          lastFrame = video.currentTime;
          const vidW = video.videoWidth;
          const vidH = video.videoHeight;
          const aspect = vidH / vidW;
          const targetW = res;
          const targetH = Math.floor(res * aspect * 0.5);
          canvas.width = targetW;
          canvas.height = targetH;
          ctx.drawImage(video, 0, 0, targetW, targetH);
          const asciiFrame = imageToAscii(ctx, canvas, targetW, targetH, asciiChars);
          ascii.textContent = asciiFrame;
          fitAsciiToContainer(ascii, document.querySelector('.col-main'));
        }
        if (!video.paused && !video.ended) requestAnimationFrame(step);
      }
      step();
    }, { once: true });
  }
}

// ============================================================================
// Export Functions
// ============================================================================
// Exports the displayed ASCII art to a PNG image file.
function saveAsPNG() {
  const lines = ascii.textContent.split("\n");
  const fontSize = 10;
  const padding = 10;
  const width = Math.max(...lines.map((line) => line.length)) * fontSize * 0.6 + padding * 2;
  const height = lines.length * fontSize + padding * 2;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext("2d");
  tmpCtx.fillStyle = "black";
  tmpCtx.fillRect(0, 0, width, height);
  tmpCtx.font = `${fontSize}px monospace`;
  tmpCtx.fillStyle = "white";
  // Draw each ASCII line to the temporary canvas
  lines.forEach((line, i) => {
    tmpCtx.fillText(line, padding, padding + i * fontSize);
  });
  // Export the canvas as a PNG file
  tmpCanvas.toBlob(function (blob) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ascii-art.png";
    link.click();
  });
}

// Exports the displayed ASCII art as a plain text file.
function saveAsTXT() {
  const blob = new Blob([ascii.textContent], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ascii-art.txt";
  link.click();
}

// Exports the displayed ASCII art as an HTML file with styling for readability.
function saveAsHTML() {
  const doc = document.implementation.createHTMLDocument("ASCII Art");
  doc.body.style.background = "black";
  doc.body.style.color = "white";
  const pre = document.createElement("pre");
  pre.style.fontFamily = "monospace";
  pre.style.whiteSpace = "pre";
  pre.innerHTML = ascii.textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  doc.body.appendChild(pre);
  const htmlBlob = new Blob([doc.documentElement.outerHTML], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(htmlBlob);
  link.download = "ascii-art.html";
  link.click();
}

// Exports the ASCII art as a GIF file.
// For images, a single frame GIF is created; for videos, multiple frames are captured.
async function saveAsGIF() {
  await setupGifWorker();
  const file = fileInput.files[0];
  const res = parseInt(resolutionInput.value);
  if (!file || isNaN(res)) {
    alert("Please load an image or video and generate the ASCII first.");
    return;
  }
  const fontSize = 10;
  const padding = 10;
  if (file.type.startsWith("image")) {
    // Create a single-frame GIF from the ASCII art of the image
    const lines = ascii.textContent.split("\n");
    const width = Math.max(...lines.map((line) => line.length)) * fontSize * 0.6 + padding * 2;
    const height = lines.length * fontSize + padding * 2;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.fillStyle = "black";
    tmpCtx.fillRect(0, 0, width, height);
    tmpCtx.font = `${fontSize}px monospace`;
    tmpCtx.fillStyle = "white";
    lines.forEach((line, i) => {
      tmpCtx.fillText(line, padding, padding + i * fontSize);
    });
    const gif = new GIF({ workers: 2, quality: 10, width: width, height: height, workerScript: GIF.prototype.workerScript });
    gif.addFrame(tmpCanvas, { copy: true, delay: 1000 });
    gif.on("finished", function (blob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ascii-art.gif";
      link.click();
    });
    gif.render();
  } else if (file.type.startsWith("video")) {
    // Create an animated GIF by capturing video frames as ASCII art
    if (video.readyState < 2) {
      await new Promise((resolve) => { video.onloadeddata = resolve; });
    }
    const aspect = video.videoHeight / video.videoWidth;
    const width = res;
    const height = Math.floor(res * aspect * 0.5);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width * 6;
    tmpCanvas.height = height * 12;
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.font = "12px monospace";
    tmpCtx.fillStyle = "white";
    const gif = new GIF({ workers: 2, quality: 10, width: tmpCanvas.width, height: tmpCanvas.height, workerScript: GIF.prototype.workerScript });
    let frameCount = 0;
    const fps = 5;
    const totalFrames = Math.min(Math.floor(video.duration * fps), 60);
    video.currentTime = 0;
    // Function to capture each video frame and add to GIF
    function captureFrame() {
      if (video.currentTime >= video.duration || frameCount >= totalFrames) {
        gif.render();
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      const asciiFrame = imageToAscii(ctx, canvas, width, height, asciiChars);
      tmpCtx.fillStyle = "black";
      tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
      tmpCtx.fillStyle = "white";
      asciiFrame.split("\n").forEach((line, i) => {
        tmpCtx.fillText(line, 10, 15 + i * 12);
      });
      gif.addFrame(tmpCanvas, { copy: true, delay: 1000 / fps });
      frameCount++;
      video.currentTime += 1 / fps;
      setTimeout(captureFrame, 60);
    }
    gif.on("finished", function (blob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ascii-video.gif";
      link.click();
    });
    captureFrame();
  } else {
    alert("Unsupported file type.");
  }
}

// Exports the ASCII art video as a WEBM file by capturing video frames as ASCII art.
async function saveAsWEBM() {
  const file = fileInput.files[0];
  if (!file || !file.type.startsWith('video')) {
    alert('Please load a video first.');
    return;
  }
  const res = parseInt(resolutionInput.value);
  const aspect = video.videoHeight / video.videoWidth;
  const width = res;
  const height = Math.floor(res * aspect * 0.5);
  canvas.width = width;
  canvas.height = height;
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = width * 6;
  tmpCanvas.height = height * 12;
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.font = '12px monospace';
  tmpCtx.fillStyle = 'white';
  // Create a stream from the canvas and set up the MediaRecorder
  const stream = tmpCanvas.captureStream(5);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ascii-video.webm';
    link.click();
  };
  recorder.start();
  let frameCount = 0;
  const fps = 5;
  const totalFrames = Math.min(Math.floor(video.duration * fps), 60);
  video.currentTime = 0;
  // Function to capture each video frame and draw ASCII art to canvas
  function captureFrame() {
    if (video.currentTime >= video.duration || frameCount >= totalFrames) {
      recorder.stop();
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const asciiFrame = imageToAscii(ctx, canvas, width, height, asciiChars);
    tmpCtx.fillStyle = 'black';
    tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCtx.fillStyle = 'white';
    asciiFrame.split('\n').forEach((line, i) => {
      tmpCtx.fillText(line, 10, 15 + i * 12);
    });
    frameCount++;
    video.currentTime += 1 / fps;
    setTimeout(captureFrame, 60);
  }
  captureFrame();
}

// ============================================================================
// Global Exposure for UI Controls
// ============================================================================
// Expose functions globally so they can be bound to UI controls (buttons, etc).
window.setCharSet = setCharSet;
window.setDottedAscii = setDottedAscii;
window.startAscii = startAscii;
window.saveAsPNG = saveAsPNG;
window.saveAsTXT = saveAsTXT;
window.saveAsHTML = saveAsHTML;
window.saveAsGIF = saveAsGIF;
window.saveAsWEBM = saveAsWEBM;
window.playVideo = playVideo;
window.pauseVideo = pauseVideo;
window.stopVideo = stopVideo;
