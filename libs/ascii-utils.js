// Utility functions for ASCII Art

// Converts grayscale value to an ASCII character based on the character set.
function getChar(gray, asciiChars) {
  return asciiChars[Math.floor(gray / (256 / asciiChars.length))] || " ";
}

// Converts image data from a canvas context to an ASCII string.
function imageToAscii(ctx, canvas, width, height, asciiChars) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let asciiStr = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Calculate grayscale by averaging RGB values
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      asciiStr += getChar(gray, asciiChars);
    }
    asciiStr += "\n";
  }
  return asciiStr;
}

// Adjusts the font size of the ASCII element to fit within its container width.
function fitAsciiToContainer(asciiElem, container) {
  if (!asciiElem || !container) return;
  const lines = asciiElem.textContent.split('\n');
  const maxLineLength = Math.max(...lines.map(line => line.length));
  const containerWidth = container.clientWidth - 32; // Account for padding/margin
  let fontSize = Math.floor(containerWidth / (maxLineLength || 1));
  fontSize = Math.max(8, Math.min(fontSize, 24)); // Clamp font size between 8 and 24 px
  asciiElem.style.fontSize = fontSize + 'px';
}
