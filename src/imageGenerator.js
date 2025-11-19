import { createCanvas, registerFont } from "canvas";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import { existsSync, mkdirSync, createWriteStream, unlink } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Télécharger une police depuis GitHub
async function downloadFont(url, fontPath) {
  return new Promise((resolve) => {
    const file = createWriteStream(fontPath);
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(true);
          });
        } else {
          file.close();
          unlink(fontPath, () => {});
          resolve(false);
        }
      })
      .on("error", (err) => {
        file.close();
        unlink(fontPath, () => {});
        resolve(false);
      });
  });
}

// Charger la police Poppins depuis Google Fonts ou utiliser la police système
async function loadPoppinsFont() {
  try {
    const fontsDir = join(__dirname, "..", "fonts");
    const boldPath = join(fontsDir, "Poppins-Bold.ttf");
    const mediumPath = join(fontsDir, "Poppins-Medium.ttf");
    const regularPath = join(fontsDir, "Poppins-Regular.ttf");

    // Créer le dossier fonts s'il n'existe pas
    if (!existsSync(fontsDir)) {
      mkdirSync(fontsDir, { recursive: true });
    }

    // Charger Poppins Bold
    if (!existsSync(boldPath)) {
      const downloaded = await downloadFont(
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
        boldPath
      );
      if (!downloaded) {
        console.warn("Impossible de télécharger Poppins Bold");
      }
    }
    if (existsSync(boldPath)) {
      registerFont(boldPath, { family: "Poppins", weight: "bold" });
    }

    // Charger Poppins Medium
    if (!existsSync(mediumPath)) {
      const downloaded = await downloadFont(
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Medium.ttf",
        mediumPath
      );
      if (!downloaded) {
        console.warn("Impossible de télécharger Poppins Medium");
      }
    }
    if (existsSync(mediumPath)) {
      registerFont(mediumPath, { family: "Poppins", weight: "500" });
    }

    // Charger Poppins Regular
    if (!existsSync(regularPath)) {
      const downloaded = await downloadFont(
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
        regularPath
      );
      if (!downloaded) {
        console.warn("Impossible de télécharger Poppins Regular");
      }
    }
    if (existsSync(regularPath)) {
      registerFont(regularPath, { family: "Poppins", weight: "normal" });
    }
  } catch (error) {
    console.warn(
      "Impossible de charger Poppins, utilisation de la police système"
    );
  }
}

// Initialiser la police au chargement du module (non bloquant)
loadPoppinsFont().catch((err) => {
  console.warn("Erreur lors du chargement des polices:", err.message);
});

export async function createCountdownImage(countdown) {
  const now = new Date();
  const target = new Date(countdown.targetDate);

  if (target <= now) {
    return createExpiredImage(countdown);
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

  const canvas = createCanvas(1000, 400);
  const ctx = canvas.getContext("2d");

  // Fond
  ctx.fillStyle = countdown.style.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const textColor = countdown.style.textColor || "#000000";
  const hasTitle = countdown.title && countdown.title.trim() !== "";

  // Titre en haut (optionnel)
  let topOffset = 0;
  if (hasTitle) {
    ctx.fillStyle = textColor;
    ctx.font = `bold 28px Poppins, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(countdown.title.toUpperCase(), canvas.width / 2, 40);
    topOffset = 100;
  }

  // Configuration des blocs
  const fontSize = Math.max(64, Math.min(countdown.style.fontSize || 72, 96));
  const labelFontSize = 16;
  const blockSpacing = 50;
  const blockWidth = (canvas.width - blockSpacing * 3) / 4; // 4 blocs avec 3 espacements

  const countdownBlocks = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
    { value: seconds, label: "SEC" },
  ];

  // Position verticale du centre des blocs
  const centerY = topOffset + (canvas.height - topOffset) / 2;

  // Dessiner chaque bloc
  countdownBlocks.forEach((block, index) => {
    const x = (blockWidth + blockSpacing) * index + blockWidth / 2;

    // Valeur numérique en grand
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px Poppins, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Formater la valeur avec zéro devant si nécessaire
    const formattedValue = String(block.value).padStart(2, "0");
    const valueY = centerY - 30;
    ctx.fillText(formattedValue, x, valueY);

    // Label en dessous
    ctx.font = `500 ${labelFontSize}px Poppins, Arial, sans-serif`;
    ctx.textBaseline = "alphabetic";
    const labelY = valueY + fontSize + 20;
    ctx.fillText(block.label, x, labelY);
  });

  return canvas.toBuffer("image/png");
}

function createExpiredImage(countdown) {
  const canvas = createCanvas(1000, 400);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = countdown.style.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const textColor = countdown.style.textColor || "#000000";

  // Titre si présent
  if (countdown.title && countdown.title.trim() !== "") {
    ctx.fillStyle = textColor;
    ctx.font = `bold 28px Poppins, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(countdown.title.toUpperCase(), canvas.width / 2, 150);
  }

  // Message "Terminé"
  ctx.font = `bold 64px Poppins, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TERMINÉ", canvas.width / 2, canvas.height / 2);

  return canvas.toBuffer("image/png");
}
