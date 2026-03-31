# L'Arche des Jeux – Jeux Chrétiens, Bibliques et Catholiques

Plateforme e-commerce full-stack dédiée aux jeux de société chrétiens et à l'éducation biblique ludique.  
L'Arche des Jeux propose des expériences interactives pour toute la famille, incluant notre bestseller « C’est quoi le verset ? ».

Architecture **Node.js / Express** côté serveur + **React / Vite** côté client, entièrement conteneurisée avec **Docker**.

---

## ✨ Fonctionnalités Clés

| Domaine | Fonctionnalités |
|---|---|
| **SEO Optime** | Meta tags, Sitemap dynamique, robots.txt pour une visibilité maximale |
| **Boutique** | Catalogue de jeux, recherche avancée, filtres par thématique |
| **Panier & Paiement** | Paiement sécurisé **Stripe**, gestion multi-devises (EUR, CHF, USD, GBP) |
| **Codes Promo** | Système de réductions (pourcentage/fixe) avec bannière défilante en temps réel |
| **Logistique** | Frais de port fixes (5€ France, 10€ International) et délais de livraison clairs |
| **Admin** | Dashboard complet : gestion des produits, commandes, messages et codes promo |

---

## 🛠 Stack Technique

- **Backend** : Node.js · Express · TypeScript · Drizzle ORM · PostgreSQL
- **Frontend** : React 18 · Vite · TailwindCSS · shadcn/ui · Framer Motion
- **Paiements** : Stripe
- **Conteneurisation** : Docker · Docker Compose
- **Langue** : Multilingue (FR / EN)

---

## 🚀 Démarrage rapide (Développement)

```bash
# 1. Cloner le projet
git clone https://github.com/Christ-Fotso/arches-des-jeux.git

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env

# 4. Pousser le schéma en base de données
- [ ] `npm run db:push` exécuté pour les nouveaux champs de codes promo.
- [ ] SEO vérifié (Meta tags, Sitemap, robots.txt).
- [ ] Sitemap déclaré dans la Search Console.

# 5. Lancer en mode développement
npm run dev
```

---

## 📂 Structure du Projet

```
Arches-des-jeux/
├── client/          # Frontend React + Vite
├── server/          # Backend Express + TypeScript
├── shared/          # Schémas Zod partagés
├── secrets/         # Secrets Docker (non versionnés)
├── Dockerfile       # Configuration pour le build production
└── README.md
```

---

## 📖 Guide de Déploiement

Pour les instructions complètes sur le déploiement VPS, consultez le fichier [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🔑 Variables d'Environnement

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (sk_...) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (pk_...) |
| `JWT_SECRET` | Secret pour l'authentification |
| `EMAIL_USER` | Email pour les notifications |

---

## 🛡 Sécurité & SEO

- **SEO** : Meta tags optimisés pour la niche "jeux chrétiens" et "éducation religieuse".
- **HPP & Helmet** : Protection contre les attaques web classiques.
- **Validation Zod** : Intégrité des données garantie.
- **Rate Limiting** : Protection contre le brute force.

---

## 📄 Licence

MIT – L'Arche des Jeux © 2026
