# Docker Secrets - Guide de Configuration

## ⚠️ IMPORTANT - SÉCURITÉ

Ce dossier contient les secrets sensibles pour Docker. **NE JAMAIS** commiter ces fichiers dans Git.

## Génération des Secrets

### 1. JWT Secret
```bash
openssl rand -hex 32 > secrets/jwt_secret.txt
```

### 2. Database Password
```bash
openssl rand -base64 32 > secrets/db_password.txt
```

### 3. Stripe Secret Key
Créer manuellement le fichier avec votre clé Stripe:
```bash
echo "sk_test_votre_cle_stripe" > secrets/stripe_secret.txt
```

### 4. Stripe Publishable Key
```bash
echo "pk_test_votre_cle_publique_stripe" > secrets/stripe_publishable.txt
```

## Structure Requise

Après génération, vous devez avoir:
```
secrets/
├── README.md (ce fichier)
├── jwt_secret.txt
├── db_password.txt
├── stripe_secret.txt
└── stripe_publishable.txt
```

## Permissions

Assurez-vous que seul l'utilisateur peut lire ces fichiers:
```bash
chmod 600 secrets/*.txt
```

## Vérification

Avant de lancer Docker Compose, vérifiez que tous les fichiers existent:
```bash
ls -la secrets/
```

## En Production

Pour la production, utilisez un gestionnaire de secrets comme:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Google Secret Manager
