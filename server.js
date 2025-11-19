import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createCountdownImage } from "./src/imageGenerator.js";
import { CountdownStore } from "./src/countdownStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(join(__dirname, "public")));

const countdownStore = new CountdownStore();

// Route pour servir la page d'accueil
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// API : Créer un compte à rebours
app.post("/api/countdowns", (req, res) => {
  try {
    const { title, targetDate, style = {} } = req.body;

    // Validation de la date
    if (!targetDate) {
      return res.status(400).json({ error: "La date cible est requise" });
    }

    const date = new Date(targetDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Date invalide" });
    }

    if (date < new Date()) {
      return res.status(400).json({ error: "La date doit être dans le futur" });
    }

    // Validation du titre
    if (title && title.length > 200) {
      return res
        .status(400)
        .json({ error: "Titre trop long (max 200 caractères)" });
    }

    // Validation des couleurs hex
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const backgroundColor = hexColorRegex.test(style.backgroundColor)
      ? style.backgroundColor
      : "#ffffff";
    const textColor = hexColorRegex.test(style.textColor)
      ? style.textColor
      : "#000000";

    // Validation de la taille de police
    const fontSize =
      typeof style.fontSize === "number" &&
      style.fontSize >= 12 &&
      style.fontSize <= 120
        ? style.fontSize
        : 48;

    const countdown = countdownStore.create({
      title: title || "Compte à rebours",
      targetDate: date,
      style: {
        backgroundColor,
        textColor,
        fontSize,
        fontFamily: style.fontFamily || "Arial",
      },
    });

    res.json(countdown);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API : Lister tous les comptes à rebours
app.get("/api/countdowns", (req, res) => {
  const countdowns = countdownStore.getAll();
  res.json(countdowns);
});

// API : Obtenir un compte à rebours spécifique
app.get("/api/countdowns/:id", (req, res) => {
  const countdown = countdownStore.get(req.params.id);
  if (!countdown) {
    return res.status(404).json({ error: "Compte à rebours introuvable" });
  }
  res.json(countdown);
});

// API : Mettre à jour un compte à rebours
app.put("/api/countdowns/:id", (req, res) => {
  try {
    const { title, targetDate, style = {} } = req.body;
    const countdown = countdownStore.get(req.params.id);

    if (!countdown) {
      return res.status(404).json({ error: "Compte à rebours introuvable" });
    }

    // Validation de la date si fournie
    if (targetDate) {
      const date = new Date(targetDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Date invalide" });
      }
      if (date < new Date()) {
        return res.status(400).json({ error: "La date doit être dans le futur" });
      }
    }

    // Validation du titre si fourni
    if (title !== undefined && title !== null) {
      if (title.length > 200) {
        return res
          .status(400)
          .json({ error: "Titre trop long (max 200 caractères)" });
      }
    }

    // Validation des couleurs hex si fournies
    const updateData = { title, targetDate, style: {} };

    if (style.backgroundColor !== undefined) {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      updateData.style.backgroundColor = hexColorRegex.test(style.backgroundColor)
        ? style.backgroundColor
        : countdown.style.backgroundColor;
    }

    if (style.textColor !== undefined) {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      updateData.style.textColor = hexColorRegex.test(style.textColor)
        ? style.textColor
        : countdown.style.textColor;
    }

    if (style.fontSize !== undefined) {
      updateData.style.fontSize =
        typeof style.fontSize === "number" &&
        style.fontSize >= 12 &&
        style.fontSize <= 120
          ? style.fontSize
          : countdown.style.fontSize;
    }

    if (style.fontFamily !== undefined) {
      updateData.style.fontFamily = style.fontFamily || countdown.style.fontFamily;
    }

    const updated = countdownStore.update(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ error: "Compte à rebours introuvable" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API : Supprimer un compte à rebours
app.delete("/api/countdowns/:id", (req, res) => {
  const deleted = countdownStore.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Compte à rebours introuvable" });
  }
  res.json({ success: true });
});

// Route pour générer l'image du compte à rebours
app.get("/api/countdowns/:id/image", async (req, res) => {
  try {
    const countdown = countdownStore.get(req.params.id);
    if (!countdown) {
      return res.status(404).json({ error: "Compte à rebours introuvable" });
    }

    const imageBuffer = await createCountdownImage(countdown);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(imageBuffer);
  } catch (error) {
    console.error("Erreur lors de la génération de l'image:", error);
    res.status(500).json({ error: "Erreur lors de la génération de l'image" });
  }
});

// Gestion des routes non trouvées (404) - doit être après toutes les routes
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Gestion des erreurs serveur (500)
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

// Export de l'app pour Vercel (serverless)
export default app;

// Démarrage du serveur uniquement en local (pas sur Vercel)
if (process.env.VERCEL !== "1") {
  app
    .listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Erreur: Le port ${PORT} est déjà utilisé.`);
        console.error(
          `💡 Solution: Arrêtez le processus avec: lsof -ti:${PORT} | xargs kill -9`
        );
        process.exit(1);
      } else {
        console.error("❌ Erreur lors du démarrage du serveur:", err);
        process.exit(1);
      }
    });
}
