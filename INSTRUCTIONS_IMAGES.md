# Instructions pour les Images des Produits

## 📁 Emplacement des Images

Place toutes les images des produits dans le dossier suivant :

```
client/public/images/
```

## 📸 Nommage des Images

Pour chaque produit, tu dois avoir **2 images** :

- **Produit 1** : `1a.jpg` (ou `.png`) et `1b.jpg` (ou `.png`)
- **Produit 2** : `2a.jpg` (ou `.png`) et `2b.jpg` (ou `.png`)
- **Produit 3** : `3a.jpg` (ou `.png`) et `3b.jpg` (ou `.png`)
- **Produit 4** : `4a.jpg` (ou `.png`) et `4b.jpg` (ou `.png`)
- **Produit 5** : `5a.jpg` (ou `.png`) et `5b.jpg` (ou `.png`)
- **Produit 6** : `6a.jpg` (ou `.png`) et `6b.jpg` (ou `.png`)
- **Produit 7** : `7a.jpg` (ou `.png`) et `7b.jpg` (ou `.png`)
- **Produit 8** : `8a.jpg` (ou `.png`) et `8b.jpg` (ou `.png`)
- **Produit 9** : `9a.jpg` (ou `.png`) et `9b.jpg` (ou `.png`)
- **Produit 10** : `10a.jpg` (ou `.png`) et `10b.jpg` (ou `.png`)

### Structure finale :

```
client/
  └── public/
      └── images/
          ├── 1a.jpg
          ├── 1b.jpg
          ├── 2a.jpg
          ├── 2b.jpg
          ├── 3a.jpg
          ├── 3b.jpg
          ├── 4a.jpg
          ├── 4b.jpg
          ├── 5a.jpg
          ├── 5b.jpg
          ├── 6a.jpg
          ├── 6b.jpg
          ├── 7a.jpg
          ├── 7b.jpg
          ├── 8a.jpg
          ├── 8b.jpg
          ├── 9a.jpg
          ├── 9b.jpg
          ├── 10a.jpg
          └── 10b.jpg
```

## 🚀 Commandes pour Charger les Produits dans la Base de Données

### 1. Créer le dossier images (si nécessaire)

```powershell
mkdir client\public\images
```

### 2. Placer tes images dans ce dossier

Copie tes 20 images (10 produits × 2 images) dans `client\public\images\`

### 3. Initialiser la base de données (si pas déjà fait)

```powershell
npm run db:push
```

### 4. Charger les 10 produits dans la base de données

```powershell
npm run db:seed:products
```

## ✅ Vérification

Après avoir exécuté la commande, tu devrais voir :
```
✅ 10 products seeded successfully!
```

## 📝 Notes

- Les formats acceptés sont `.jpg`, `.jpeg`, ou `.png`
- Les images seront accessibles via `/images/1a.jpg`, `/images/1b.jpg`, etc.
- En développement, les images sont servies depuis `client/public/images/`
- En production, elles sont copiées dans `dist/public/images/` lors du build

