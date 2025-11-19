const API_BASE = window.location.origin;

let countdowns = [];

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadCountdowns();
  setupForm();
  setupModal();
  setupColorInputs();
  updateFontSizeDisplay();
});

// Configuration du formulaire
function setupForm() {
  const form = document.getElementById("countdownForm");
  const fontSizeSlider = document.getElementById("fontSize");
  const fontSizeValue = document.getElementById("fontSizeValue");

  fontSizeSlider.addEventListener("input", (e) => {
    fontSizeValue.textContent = `${e.target.value}px`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await createCountdown();
  });
}

// Configuration des inputs de couleur
function setupColorInputs() {
  const backgroundColor = document.getElementById("backgroundColor");
  const backgroundColorText = document.getElementById("backgroundColorText");
  const textColor = document.getElementById("textColor");
  const textColorText = document.getElementById("textColorText");

  // Synchroniser couleur de fond
  backgroundColor.addEventListener("input", (e) => {
    backgroundColorText.value = e.target.value.toUpperCase();
  });

  backgroundColorText.addEventListener("click", () => {
    backgroundColor.click();
  });

  // Synchroniser couleur de texte
  textColor.addEventListener("input", (e) => {
    textColorText.value = e.target.value.toUpperCase();
  });

  textColorText.addEventListener("click", () => {
    textColor.click();
  });
}

// Mise à jour de l'affichage de la taille de police
function updateFontSizeDisplay() {
  const slider = document.getElementById("fontSize");
  const value = document.getElementById("fontSizeValue");
  value.textContent = `${slider.value}px`;
}

// Créer un compte à rebours
async function createCountdown() {
  const title = document.getElementById("title").value.trim();
  const targetDate = document.getElementById("targetDate").value;
  const backgroundColor = document.getElementById("backgroundColor").value;
  const textColor = document.getElementById("textColor").value;
  const fontSize = parseInt(document.getElementById("fontSize").value);

  if (!targetDate) {
    alert("Veuillez sélectionner une date cible");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/countdowns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        targetDate,
        style: {
          backgroundColor,
          textColor,
          fontSize,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la création");
    }

    const countdown = await response.json();
    document.getElementById("countdownForm").reset();
    document.getElementById("backgroundColorText").value = "#FFFFFF";
    document.getElementById("textColorText").value = "#000000";
    updateFontSizeDisplay();
    await loadCountdowns();

    // Réinitialiser les icônes après le chargement
    lucide.createIcons();
  } catch (error) {
    alert(`Erreur: ${error.message}`);
  }
}

// Charger tous les comptes à rebours
async function loadCountdowns() {
  try {
    const response = await fetch(`${API_BASE}/api/countdowns`);
    if (!response.ok) throw new Error("Erreur lors du chargement");

    countdowns = await response.json();
    displayCountdowns();
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Afficher les comptes à rebours
function displayCountdowns() {
  const container = document.getElementById("countdownsList");

  if (countdowns.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clock"></i>
        <p>Aucun compte à rebours créé pour le moment</p>
        <span>Créez votre premier compte à rebours ci-dessus</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = countdowns
    .map((countdown) => {
      const targetDate = new Date(countdown.targetDate);
      const imageUrl = `${API_BASE}/api/countdowns/${
        countdown.id
      }/image?t=${Date.now()}`;

      return `
      <div class="countdown-card">
        <h3>${escapeHtml(countdown.title || "Sans titre")}</h3>
        <img src="${imageUrl}" alt="Compte à rebours" class="countdown-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'300\\'%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'%3EErreur de chargement%3C/text%3E%3C/svg%3E'">
        <div class="countdown-info">
          <i data-lucide="calendar"></i>
          <strong>Date cible:</strong> ${targetDate.toLocaleString("fr-FR")}
        </div>
        <div class="countdown-actions">
          <button class="btn btn-secondary btn-small" onclick="showIntegrationModal('${
            countdown.id
          }')">
            <i data-lucide="code"></i>
            <span>Intégration</span>
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteCountdown('${
            countdown.id
          }')">
            <i data-lucide="trash-2"></i>
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  // Réinitialiser les icônes Lucide
  lucide.createIcons();

  // Rafraîchir les images toutes les secondes pour les compteurs actifs
  refreshImages();
}

// Rafraîchir les images des compteurs actifs
function refreshImages() {
  const images = document.querySelectorAll(".countdown-image");
  images.forEach((img) => {
    const originalSrc = img.src.split("?")[0];
    setInterval(() => {
      img.src = `${originalSrc}?t=${Date.now()}`;
    }, 1000);
  });
}

// Afficher la modal d'intégration
function showIntegrationModal(countdownId) {
  const countdown = countdowns.find((c) => c.id === countdownId);
  if (!countdown) return;

  const baseUrl = window.location.origin;
  const imageUrl = `${baseUrl}/api/countdowns/${countdownId}/image`;
  const htmlCode = `<img src="${imageUrl}" alt="${escapeHtml(
    countdown.title || "Compte à rebours"
  )}" style="max-width: 100%; height: auto;">`;

  document.getElementById("imageUrl").value = imageUrl;
  document.getElementById("htmlCode").value = htmlCode;
  document.getElementById("previewImage").src = `${imageUrl}?t=${Date.now()}`;

  const modal = document.getElementById("modal");
  modal.style.display = "block";

  // Réinitialiser les icônes Lucide dans la modal
  lucide.createIcons();
}

// Fermer la modal
window.closeModal = function () {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
};

// Configuration de la modal
function setupModal() {
  const modal = document.getElementById("modal");

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Fermer avec la touche Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
    }
  });
}

// Copier dans le presse-papier
window.copyToClipboard = async function (elementId, event) {
  const element = document.getElementById(elementId);
  element.select();
  element.setSelectionRange(0, 99999);

  try {
    // Utiliser l'API moderne si disponible
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(element.value);
    } else {
      document.execCommand("copy");
    }

    // Feedback visuel temporaire
    if (event) {
      const button = event.target.closest("button");
      if (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i data-lucide="check"></i><span>Copié !</span>';
        lucide.createIcons();

        setTimeout(() => {
          button.innerHTML = originalHTML;
          lucide.createIcons();
        }, 2000);
      }
    }
  } catch (err) {
    alert("Erreur lors de la copie");
  }
};

// Supprimer un compte à rebours
async function deleteCountdown(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte à rebours ?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/countdowns/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Erreur lors de la suppression");

    await loadCountdowns();
  } catch (error) {
    alert(`Erreur: ${error.message}`);
  }
}

// Échapper le HTML pour éviter les injections XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
