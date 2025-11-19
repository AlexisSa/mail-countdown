# ⏰ CountdownMail

Système de création de comptes à rebours pour intégration dans vos emails.

## 🎯 Fonctionnalités

- ✅ Création de plusieurs comptes à rebours
- ✅ Personnalisation (couleurs, taille de police, titre)
- ✅ Génération automatique d'images mises à jour en temps réel
- ✅ Code HTML prêt à intégrer dans vos emails
- ✅ Interface web simple et moderne

## 🚀 Installation

### Prérequis (macOS)

Sur macOS, `canvas` nécessite des dépendances système. Installez-les avec Homebrew :

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

### Installation des dépendances Node.js

1. **Installer les dépendances** :

```bash
npm install
```

2. **Démarrer le serveur** :

```bash
npm start
```

Ou en mode développement avec rechargement automatique :

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📧 Utilisation dans les emails

### Méthode 1 : URL directe de l'image

L'image est mise à jour automatiquement toutes les secondes côté serveur. Utilisez simplement l'URL fournie dans le code d'intégration :

```html
<img
  src="http://votre-domaine.com/api/countdowns/[ID]/image"
  alt="Compte à rebours"
/>
```

### Méthode 2 : Service externe avec mise à jour

Pour une mise à jour plus fréquente, certains clients email peuvent mettre en cache l'image. Dans ce cas, assurez-vous que :

- L'URL est accessible publiquement
- Les en-têtes HTTP incluent `Cache-Control: no-cache` (déjà configuré)

### Limitations des emails

⚠️ **Important** : Les clients email ont des limitations :

- Certains clients (comme Gmail, Outlook) peuvent mettre en cache les images
- La mise à jour peut prendre quelques minutes à apparaître
- Les clients email bloquant les images externes ne pourront pas afficher le compte à rebours

### Recommandation pour la production

Pour une utilisation en production, pensez à :

1. Déployer sur un serveur accessible publiquement
2. Utiliser HTTPS pour éviter les problèmes de sécurité
3. Configurer un nom de domaine pour une meilleure compatibilité email
4. Considérer l'utilisation d'un service d'images proxy si nécessaire

## 🛠️ API

### Créer un compte à rebours

```
POST /api/countdowns
Content-Type: application/json

{
  "title": "Promotion se termine dans...",
  "targetDate": "2024-12-31T23:59:59",
  "style": {
    "backgroundColor": "#ffffff",
    "textColor": "#000000",
    "fontSize": 48
  }
}
```

### Lister tous les comptes à rebours

```
GET /api/countdowns
```

### Obtenir un compte à rebours

```
GET /api/countdowns/:id
```

### Supprimer un compte à rebours

```
DELETE /api/countdowns/:id
```

### Obtenir l'image du compte à rebours

```
GET /api/countdowns/:id/image
```

## 📁 Structure du projet

```
countdownmail/
├── server.js              # Serveur Express
├── src/
│   ├── countdownStore.js  # Gestion du stockage des comptes à rebours
│   └── imageGenerator.js  # Génération des images
├── public/
│   ├── index.html         # Interface web
│   ├── styles.css         # Styles
│   └── app.js             # Logique frontend
├── data/                  # Données (créé automatiquement)
│   └── countdowns.json
└── package.json
```

## 🔧 Configuration

Les comptes à rebours sont stockés dans `data/countdowns.json`. Pour un déploiement en production, considérez l'utilisation d'une vraie base de données (MongoDB, PostgreSQL, etc.).

## 📝 Notes

- Les images sont générées dynamiquement à chaque requête
- Le format d'image est PNG (800x300px par défaut)
- Les dates sont au format ISO 8601
- L'interface se rafraîchit automatiquement pour afficher le compte à rebours en temps réel
