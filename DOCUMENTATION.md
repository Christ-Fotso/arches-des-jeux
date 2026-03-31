# Documentation technique – Müe

---

## Architecture

```
Client (React/Vite) ──► Express API (Node.js/TS) ──► PostgreSQL (Neon/Docker)
                                 │
                                 ├── Stripe (paiements)
                                 ├── Shippo (livraison)
                                 └── Nodemailer/SMTP (e-mails)
```

Le client et le serveur sont **servis par la même instance Express** sur le port `5000`.  
En production, Vite build le frontend en fichiers statiques que l'API sert directement.

---

## Référence API

> Toutes les routes API sont préfixées par `/api`.  
> Les routes protégées nécessitent un header `Authorization: Bearer <token>`.

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Créer un compte |
| POST | `/api/auth/login` | Public | Connexion, retourne un JWT |
| POST | `/api/auth/forgot-password` | Public | Envoyer un e-mail de reset |
| POST | `/api/auth/reset-password/:token` | Public | Réinitialiser le mot de passe |

### Produits

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/products` | Public | Liste tous les produits (`?search=`) |
| GET | `/api/products/:id` | Public | Détail d'un produit |
| POST | `/api/products` | Admin | Créer un produit |
| PUT | `/api/products/:id` | Admin | Modifier un produit |
| DELETE | `/api/products/:id` | Admin | Supprimer un produit |

### Commandes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/orders` | Connecté | Créer une commande (sans paiement Stripe) |
| GET | `/api/orders` | Connecté/Admin | Ses commandes (ou toutes pour Admin) |
| GET | `/api/orders/my-orders` | Connecté | Commandes avec détails |
| GET | `/api/orders/:id` | Connecté | Détail d'une commande |
| PATCH | `/api/orders/:id/status` | Admin | Changer le statut |

### Paiement

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/create-payment-intent` | Connecté | Crée une intention de paiement Stripe |
| POST | `/api/confirm-order` | Connecté | Confirme la commande après paiement |

### Codes promo

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/discount/validate` | Connecté | Valider un code promo |
| GET | `/api/discount` | Admin | Lister tous les codes |
| POST | `/api/discount` | Admin | Créer un code |
| PUT | `/api/discount/:id` | Admin | Modifier un code |
| DELETE | `/api/discount/:id` | Admin | Supprimer un code |

### Autres

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/brands` | Liste les marques |
| GET | `/api/settings` | Paramètres du site |
| PUT | `/api/settings` | Modifier les paramètres (Admin) |
| POST | `/api/shipping/rates` | Tarifs de livraison (Shippo) |
| POST | `/api/upload` | Upload d'image (Admin) |
| GET | `/api/exchange-rates` | Taux de change (CHF base) |
| GET/POST/PUT/DELETE | `/api/shipping-addresses` | Gestion des adresses |
| GET/POST/DELETE | `/api/reviews` | Avis produits |

---

## Sécurité

### Middleware appliqués globalement

| Middleware | Rôle |
|---|---|
| `helmetConfig` | Injecte les headers de sécurité HTTP (CSP, HSTS, X-Frame-Options…) |
| `globalRateLimiter` | Limite à 2 000 req / 15 min en production |
| `hppProtection` | Bloque la pollution des paramètres HTTP |
| `hostValidationMiddleware` | Valide le header `Host` (anti DNS Rebinding) |

### Middleware appliqués par route

| Middleware | Rôle |
|---|---|
| `authRateLimiter` | Max 100 tentatives de connexion échouées / 15 min |
| `uploadRateLimiter` | Max 200 uploads / heure |
| `validateMimeType` | Vérifie le type MIME réel des fichiers uploadés |
| `authenticate` | Vérifie et décode le JWT |
| `requireAdmin` | Vérifie que l'utilisateur est ADMIN |

### Anti-Price Tampering

Les prix des articles sont **toujours relus depuis la base de données** côté serveur.  
Toute valeur de prix envoyée par le client dans la requête est ignorée.  
Les quantités sont validées comme entiers estrictement positifs (`Number.isInteger() && qty >= 1`).  
Les frais de livraison sont validés comme nombres positifs ou nuls (`parsedCost >= 0`).

---

## Base de données

Le projet utilise **Drizzle ORM** avec PostgreSQL.  
Les migrations sont déclaratives via `drizzle.config.ts`.

```bash
# Pousser le schéma (crée/modifie les tables)
npm run db:push

# Insérer les données de test
npm run db:seed

# Insérer les produits exemple
npm run db:seed:products

# Créer un compte admin
npm run seed:admin

# Insérer les marques
npm run seed:brands
```

---

## Variables d'environnement

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your_long_random_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_FROM=Müe <noreply@mue.ch>

# Divers
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
SHIPPO_PRIVATE_KEY=your_shippo_key  # optionnel
```
