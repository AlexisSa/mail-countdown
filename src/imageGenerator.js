import sharp from "sharp";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";

// Générer un SVG pour le compte à rebours
function generateCountdownSVG(countdown, days, hours, minutes, seconds) {
  const textColor = countdown.style.textColor || "#000000";
  const bgColor = countdown.style.backgroundColor || "#ffffff";
  const hasTitle = countdown.title && countdown.title.trim() !== "";
  const fontSize = Math.max(64, Math.min(countdown.style.fontSize || 72, 96));
  const labelFontSize = 16;

  const width = 1000;
  const height = 400;
  const topOffset = hasTitle ? 100 : 0;
  const blockSpacing = 50;
  const blockWidth = (width - blockSpacing * 3) / 4;
  const centerY = topOffset + (height - topOffset) / 2;

  const countdownBlocks = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
    { value: seconds, label: "SEC" },
  ];

  const blocksHTML = countdownBlocks
    .map((block, index) => {
      const x = (blockWidth + blockSpacing) * index + blockWidth / 2;
      const formattedValue = String(block.value).padStart(2, "0");
      const valueY = centerY - 30;
      const labelY = valueY + fontSize + 20;

      return `
        <text 
          x="${x}" 
          y="${valueY}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="bold" 
          fill="${textColor}" 
          text-anchor="middle" 
          dominant-baseline="alphabetic"
        >${escapeSVG(formattedValue)}</text>
        <text 
          x="${x}" 
          y="${labelY}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${labelFontSize}" 
          font-weight="normal" 
          fill="${textColor}" 
          text-anchor="middle" 
          dominant-baseline="alphabetic"
        >${escapeSVG(block.label)}</text>
      `;
    })
    .join("");

  const titleHTML = hasTitle
    ? `<text 
         x="${width / 2}" 
         y="40" 
         font-family="Arial, sans-serif" 
         font-size="28" 
         font-weight="bold" 
         fill="${textColor}" 
         text-anchor="middle" 
         dominant-baseline="text-before-edge"
       >${escapeSVG(countdown.title.toUpperCase())}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  ${titleHTML}
  ${blocksHTML}
</svg>`;
}

// Générer un SVG pour l'image expirée
function generateExpiredSVG(countdown) {
  const textColor = countdown.style.textColor || "#000000";
  const bgColor = countdown.style.backgroundColor || "#ffffff";
  const hasTitle = countdown.title && countdown.title.trim() !== "";

  const width = 1000;
  const height = 400;

  const titleHTML = hasTitle
    ? `<text 
         x="${width / 2}" 
         y="150" 
         font-family="Arial, sans-serif" 
         font-size="28" 
         font-weight="bold" 
         fill="${textColor}" 
         text-anchor="middle" 
         dominant-baseline="middle"
       >${escapeSVG(countdown.title.toUpperCase())}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  ${titleHTML}
  <text 
    x="${width / 2}" 
    y="${height / 2}" 
    font-family="Arial, sans-serif" 
    font-size="64" 
    font-weight="bold" 
    fill="${textColor}" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >TERMINÉ</text>
</svg>`;
}

// Échapper les caractères spéciaux pour SVG
function escapeSVG(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function createCountdownImage(countdown) {
  const now = new Date();
  const target = new Date(countdown.targetDate);

  if (target <= now) {
    return await createExpiredImage(countdown);
  }

  const days = differenceInDays(target, now);
  const remainingAfterDays = new Date(
    target.getTime() - days * 24 * 60 * 60 * 1000
  );
  const hours = differenceInHours(remainingAfterDays, now);
  const remainingAfterHours = new Date(
    remainingAfterDays.getTime() - hours * 60 * 60 * 1000
  );
  const minutes = differenceInMinutes(remainingAfterHours, now);
  const remainingAfterMinutes = new Date(
    remainingAfterHours.getTime() - minutes * 60 * 1000
  );
  const seconds = differenceInSeconds(remainingAfterMinutes, now);

  const svg = generateCountdownSVG(countdown, days, hours, minutes, seconds);
  const pngBuffer = await sharp(Buffer.from(svg, "utf-8")).png().toBuffer();

  return pngBuffer;
}

async function createExpiredImage(countdown) {
  const svg = generateExpiredSVG(countdown);
  const pngBuffer = await sharp(Buffer.from(svg, "utf-8")).png().toBuffer();

  return pngBuffer;
}
