# Déploiement VPS – L'Arche des Jeux

Guide complet pour déployer l'application sur un VPS Linux via **Docker Hub**.

---

## Vue d'ensemble

```
[Ton PC / Windows]           [Docker Hub]              [VPS Linux]
        │                          │                        │
        ├─ docker build ──────────►│                        │
        ├─ docker push  ──────────►│                        │
        │                          │◄─── docker pull ───────┤
        │                          │                        ├─ docker compose up -d
        │                          │                        └─ ✅ Application en ligne
```

---

## Prérequis

### Sur ton PC (Windows)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé.
- Compte [Docker Hub](https://hub.docker.com).

### Sur le VPS (Linux)
- Docker + Docker Compose installés.
- Dossiers `/app/secrets` et `/app/uploads` créés.

---

## Étape 1 – Préparer les Secrets

Assurez-vous que les fichiers dans `secrets/` sont remplis avec les valeurs de **production**.

---

## Étape 2 – Build et Push vers Docker Hub

Depuis ton PC (PowerShell) :

```powershell
# Build de l'image (le tag v1.3.1 est le plus stable)
docker build `
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... `
  -t christfotso/arches-des-jeux:v1.3.1 `
  -t christfotso/arches-des-jeux:latest `
  .

# Pousser vers Docker Hub
docker push christfotso/arches-des-jeux:v1.3.1
docker push christfotso/arches-des-jeux:latest
```

---

## Étape 3 – Déployer sur le VPS

Sur le VPS :

```bash
cd /home/arole/arches-app

# 1. Télécharger la dernière image
docker compose pull

# 2. Mettre à jour la base de données (si nouveaux champs)
docker compose exec app npm run db:push

# 3. Démarrer/Redémarrer les conteneurs
docker compose up -d
```

---

## Étape 4 – SEO et Vérification

Vérifiez que les meta tags sont bien présents dans le code source de la page d'accueil pour le référencement des jeux chrétiens et bibliques.

---

## ✅ Checklist de Mise à Jour

- [ ] Image buildée avec la clé Stripe live.
- [ ] Secrets synchronisés sur le VPS.
- [ ] `npm run db:push` exécuté pour les nouveaux champs de codes promo.
- [ ] SEO vérifié dans `index.html`.

---

MIT – L'Arche des Jeux © 2026
