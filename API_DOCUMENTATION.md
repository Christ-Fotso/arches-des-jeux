# Beauté Suisse - Documentation API

> API REST complète pour la plateforme e-commerce Beauté Suisse avec support multilingue (FR/DE/EN)

---

## 🔐 Authentification

Toutes les routes protégées nécessitent un header d'autorisation :
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 Table des Matières

- [Authentification](#authentification-1)
- [Produits](#produits)
- [Codes de Réduction](#codes-de-réduction)
- [Commandes](#commandes)
- [Profil Utilisateur](#profil-utilisateur)
- [Administration](#administration)

---

## Authentification

### Inscription
**POST** `/api/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "USER"
}
```

**Réponse (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2025-11-07T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Connexion
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Produits

### Lister tous les produits
**GET** `/api/products`

**Paramètres de requête:**
- `search` (optionnel) : Recherche dans titres et descriptions (toutes langues)

**Réponse (200):**
```json
[
  {
    "id": "uuid",
    "titleFr": "Sérum de Luxe pour le Visage",
    "titleDe": "Luxus-Gesichtsserum",
    "titleEn": "Luxury Face Serum",
    "descriptionFr": "Un sérum visage luxueux...",
    "descriptionDe": "Ein luxuriöses Gesichtsserum...",
    "descriptionEn": "A luxurious face serum...",
    "price": "89.90",
    "quantityInStock": 50,
    "imageUrl1": "/images/serum-1.png",
    "imageUrl2": "/images/serum-2.png",
    "altTextFr": "Sérum de luxe dans un flacon élégant",
    "altTextDe": "Luxusserum in eleganter Flasche",
    "altTextEn": "Luxury serum in elegant bottle",
    "createdAt": "2025-11-07T12:00:00.000Z"
  }
]
```

**Exemple de recherche:**
```bash
GET /api/products?search=serum
```

---

### Obtenir un produit
**GET** `/api/products/:id`

**Réponse (200):**
```json
{
  "id": "uuid",
  "titleFr": "Sérum de Luxe pour le Visage",
  "titleDe": "Luxus-Gesichtsserum",
  "titleEn": "Luxury Face Serum",
  "price": "89.90",
  "quantityInStock": 50,
  ...
}
```

---

### Créer un produit
**POST** `/api/products` 🔒 *Admin uniquement*

**Body:**
```json
{
  "titleFr": "Nouveau Produit",
  "titleDe": "Neues Produkt",
  "titleEn": "New Product",
  "descriptionFr": "Description en français",
  "descriptionDe": "Beschreibung auf Deutsch",
  "descriptionEn": "Description in English",
  "price": "99.90",
  "quantityInStock": 100,
  "imageUrl1": "/images/product-1.png",
  "imageUrl2": "/images/product-2.png",
  "altTextFr": "Texte alternatif FR",
  "altTextDe": "Alternativer Text DE",
  "altTextEn": "Alternative text EN"
}
```

**Réponse (201):**
```json
{
  "id": "new-uuid",
  "titleFr": "Nouveau Produit",
  ...
}
```

---

### Modifier un produit
**PUT** `/api/products/:id` 🔒 *Admin uniquement*

**Body:** (tous les champs sont optionnels)
```json
{
  "titleFr": "Titre modifié",
  "price": "79.90",
  "quantityInStock": 75
}
```

**Réponse (200):**
```json
{
  "id": "uuid",
  "titleFr": "Titre modifié",
  "price": "79.90",
  ...
}
```

---

### Supprimer un produit
**DELETE** `/api/products/:id` 🔒 *Admin uniquement*

**Réponse (204):** Pas de contenu

---

## Codes de Réduction

### Lister tous les codes
**GET** `/api/discount` 🔒 *Admin uniquement*

**Réponse (200):**
```json
[
  {
    "id": "uuid",
    "code": "WELCOME10",
    "type": "PERCENTAGE",
    "value": "10",
    "isSingleUse": false,
    "isActive": true,
    "usedBy": null,
    "createdAt": "2025-11-07T12:00:00.000Z"
  }
]
```

---

### Créer un code de réduction
**POST** `/api/discount` 🔒 *Admin uniquement*

**Body:**
```json
{
  "code": "SUMMER20",
  "type": "PERCENTAGE",
  "value": "20",
  "isSingleUse": false,
  "isActive": true
}
```

**Types disponibles:**
- `PERCENTAGE` : Réduction en pourcentage (ex: 20%)
- `FIXED` : Réduction en montant fixe (ex: 15 CHF)

**Réponse (201):**
```json
{
  "id": "new-uuid",
  "code": "SUMMER20",
  "type": "PERCENTAGE",
  "value": "20",
  "isSingleUse": false,
  "isActive": true
}
```

---

### Modifier un code de réduction
**PUT** `/api/discount/:id` 🔒 *Admin uniquement*

**Body:**
```json
{
  "isActive": false,
  "value": "25"
}
```

**Réponse (200):**
```json
{
  "id": "uuid",
  "code": "SUMMER20",
  "value": "25",
  "isActive": false
}
```

---

### Supprimer un code de réduction
**DELETE** `/api/discount/:id` 🔒 *Admin uniquement*

**Réponse (204):** Pas de contenu

---

### Valider un code de réduction
**POST** `/api/discount/validate` 🔒 *Utilisateur authentifié*

**Body:**
```json
{
  "code": "WELCOME10"
}
```

**Réponse (200):**
```json
{
  "id": "uuid",
  "code": "WELCOME10",
  "type": "PERCENTAGE",
  "value": "10",
  "isSingleUse": false,
  "isActive": true
}
```

**Erreurs possibles:**
- `400` : Code invalide ou déjà utilisé (si usage unique)

---

## Commandes

### Créer une commande
**POST** `/api/orders` 🔒 *Utilisateur authentifié*

**Body:**
```json
{
  "items": [
    {
      "productId": "product-uuid-1",
      "quantity": 2
    },
    {
      "productId": "product-uuid-2",
      "quantity": 1
    }
  ],
  "discountCode": "WELCOME10"
}
```

**Réponse (201):**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "totalAmount": "161.82",
  "discountAmount": "17.98",
  "discountCodeId": "discount-uuid",
  "status": "PENDING",
  "createdAt": "2025-11-07T12:00:00.000Z"
}
```

**Notes:**
- Validation automatique du stock
- Calcul automatique des réductions
- Transaction atomique (tout ou rien)
- Déduction automatique du stock après commande

---

### Lister mes commandes
**GET** `/api/orders` 🔒 *Utilisateur authentifié*

**Réponse (200):**
```json
[
  {
    "id": "order-uuid",
    "userId": "user-uuid",
    "totalAmount": "161.82",
    "discountAmount": "17.98",
    "status": "PENDING",
    "createdAt": "2025-11-07T12:00:00.000Z",
    "items": [
      {
        "id": "item-uuid",
        "orderId": "order-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "priceAtPurchase": "89.90"
      }
    ]
  }
]
```

---

### Obtenir une commande
**GET** `/api/orders/:id` 🔒 *Utilisateur authentifié*

**Réponse (200):**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "totalAmount": "161.82",
  "discountAmount": "17.98",
  "status": "PENDING",
  "items": [...]
}
```

**Permissions:**
- L'utilisateur ne peut voir que ses propres commandes
- Les administrateurs peuvent voir toutes les commandes

---

## Profil Utilisateur

### Voir mon profil
**GET** `/api/user/profile` 🔒 *Utilisateur authentifié*

**Réponse (200):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2025-11-07T12:00:00.000Z"
}
```

---

### Modifier mon profil
**PUT** `/api/user/profile` 🔒 *Utilisateur authentifié*

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Réponse (200):**
```json
{
  "id": "user-uuid",
  "email": "jane@example.com",
  "name": "Jane Doe",
  "role": "USER"
}
```

---

### Changer mon mot de passe
**PUT** `/api/user/password` 🔒 *Utilisateur authentifié*

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Réponse (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Administration

### Statistiques du dashboard
**GET** `/api/admin/stats` 🔒 *Admin uniquement*

**Réponse (200):**
```json
{
  "totalRevenue": "15420.50",
  "totalOrders": 145,
  "totalUsers": 78,
  "totalProducts": 6,
  "recentOrders": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "totalAmount": "179.80",
      "status": "PENDING",
      "createdAt": "2025-11-07T12:00:00.000Z"
    }
  ],
  "topProducts": [
    {
      "productId": "product-uuid",
      "titleEn": "Luxury Face Serum",
      "totalSold": 45,
      "revenue": "4045.50"
    }
  ]
}
```

**Données fournies:**
- `totalRevenue` : Revenu total de toutes les commandes
- `totalOrders` : Nombre total de commandes
- `totalUsers` : Nombre total d'utilisateurs
- `totalProducts` : Nombre total de produits
- `recentOrders` : Les 10 commandes les plus récentes
- `topProducts` : Les 5 produits les plus vendus

---

## 📝 Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Ressource créée |
| 204 | Succès sans contenu |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé (permissions insuffisantes) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## 🔒 Rôles et Permissions

### USER
- Créer un compte et se connecter
- Voir et rechercher des produits
- Créer des commandes
- Valider des codes de réduction
- Voir son historique de commandes
- Modifier son profil

### ADMIN
- Toutes les permissions USER
- CRUD complet sur les produits
- CRUD complet sur les codes de réduction
- Voir toutes les commandes
- Accéder aux statistiques du dashboard

---

## 🌍 Support Multilingue

Tous les produits contiennent des champs dans 3 langues :
- **Français (FR)** : `titleFr`, `descriptionFr`, `altTextFr`
- **Allemand (DE)** : `titleDe`, `descriptionDe`, `altTextDe`
- **Anglais (EN)** : `titleEn`, `descriptionEn`, `altTextEn`

La recherche fonctionne simultanément sur les 3 langues.

---

## 📦 Exemples de Requêtes (curl)

### Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "role": "USER"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Lister les produits (avec recherche)
```bash
curl http://localhost:5000/api/products?search=serum
```

### Créer une commande
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {"productId": "product-uuid", "quantity": 2}
    ],
    "discountCode": "WELCOME10"
  }'
```

---

## 🔐 Comptes de Test

**Administrateur:**
- Email: `admin@beautesuisse.ch`
- Password: `admin123`

**Utilisateur:**
- Email: `user@beautesuisse.ch`
- Password: `user123`

**Codes de réduction actifs:**
- `WELCOME10` : 10% de réduction
- `SUMMER20` : 20% de réduction
- `FIRSTORDER` : 15 CHF de réduction (usage unique)

---

## 🛠️ Technologies

- **Backend:** Express.js avec TypeScript
- **Base de données:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentification:** JWT (JSON Web Tokens)
- **Sécurité:** bcryptjs pour le hashage des mots de passe
- **Architecture:** Repository Pattern + Service Layer (SOLID)

---

*Documentation mise à jour le 7 novembre 2025*
