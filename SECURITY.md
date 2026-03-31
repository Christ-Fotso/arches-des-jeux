# SECURITY.md - Guide de Sécurité BEAUTYSHOP

## 🔒 Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans BEAUTYSHOP et les procédures à suivre pour maintenir un niveau de sécurité élevé.

## 🔑 Gestion des Secrets

### Génération des Secrets

**IMPORTANT:** Ne JAMAIS utiliser de secrets faibles ou par défaut en production.

#### 1. JWT Secret
```bash
openssl rand -hex 32 > secrets/jwt_secret.txt
```

#### 2. Database Password
```bash
openssl rand -base64 32 > secrets/db_password.txt
```

#### 3. Stripe Keys
Obtenir depuis [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
```bash
echo "sk_test_votre_cle" > secrets/stripe_secret.txt
echo "pk_test_votre_cle" > secrets/stripe_publishable.txt
```

### Rotation des Secrets

- **JWT_SECRET:** Rotation tous les 90 jours
- **Database Password:** Rotation tous les 180 jours
- **Stripe Keys:** Rotation en cas de suspicion de compromission

## 🛡️ Mesures de Sécurité Implémentées

### 1. Authentification et Autorisation

✅ **JWT avec expiration courte (1h)**
- Tokens expirés automatiquement après 1 heure
- Réduire la fenêtre d'exploitation en cas de vol de token

✅ **Bcrypt avec 12 rounds**
- Hachage sécurisé des mots de passe
- Protection contre les attaques par force brute

✅ **Validation de mot de passe stricte**
- Minimum 12 caractères
- Majuscule, minuscule, chiffre, symbole requis

✅ **Rate limiting sur authentification**
- 5 tentatives maximum par 15 minutes
- Protection contre le brute force

### 2. Protection des Endpoints

✅ **Helmet** - Headers de sécurité HTTP
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy configuré

✅ **Rate Limiting Global**
- 100 requêtes par 15 minutes par IP
- Protection contre les attaques DDoS

✅ **HPP Protection**
- Protection contre HTTP Parameter Pollution

✅ **CSRF Protection**
- Tokens CSRF sur endpoints sensibles (paiements)

### 3. Validation des Données

✅ **Validation Zod sur tous les endpoints**
- Schémas stricts pour toutes les entrées
- Validation côté serveur obligatoire

✅ **Validation MIME pour uploads**
- Vérification du type de fichier côté serveur
- Limite de taille: 5MB
- Types autorisés: JPEG, PNG, GIF, WebP

✅ **Sanitization des logs**
- Pas de données sensibles dans les logs
- Logs désactivés en production

### 4. Base de Données

✅ **Prepared Statements activés**
- Protection contre les injections SQL

✅ **Pool de connexions configuré**
- Maximum 10 connexions
- Timeouts configurés

✅ **Docker Secrets pour credentials**
- Mots de passe lus depuis /run/secrets/
- Jamais en clair dans les variables d'environnement

### 5. Docker et Déploiement

✅ **Port PostgreSQL non exposé**
- Connexions uniquement via réseau Docker interne

✅ **Secrets Docker utilisés**
- Tous les secrets dans des fichiers séparés
- Permissions restrictives (600)

✅ **Réseau Docker isolé**
- Backend network pour isolation

## ⚠️ Checklist de Sécurité Pré-Déploiement

### Avant chaque déploiement

- [ ] Tous les secrets ont été régénérés
- [ ] Le fichier .env n'est PAS commité dans Git
- [ ] Les dépendances sont à jour (`npm audit`)
- [ ] Les tests de sécurité passent
- [ ] Les logs de production ne contiennent pas de données sensibles
- [ ] Le port PostgreSQL n'est pas exposé
- [ ] HTTPS est activé (certificat SSL valide)
- [ ] Les headers de sécurité sont configurés
- [ ] Le rate limiting est actif
- [ ] Les backups automatiques sont configurés

### Vérification Post-Déploiement

```bash
# Tester les headers de sécurité
curl -I https://votre-domaine.com

# Vérifier rate limiting
for i in {1..10}; do curl https://votre-domaine.com/api/products; done

# Tester HTTPS
curl -I https://votre-domaine.com | grep "Strict-Transport-Security"
```

## 🚨 Procédure en Cas d'Incident

### 1. Détection d'une Faille

1. **Isoler immédiatement** le système compromis
2. **Notifier** l'équipe de sécurité
3. **Documenter** l'incident (logs, captures d'écran)
4. **Analyser** l'étendue de la compromission

### 2. Compromission de Secrets

1. **Révoquer immédiatement** tous les secrets compromis
2. **Régénérer** de nouveaux secrets
3. **Déployer** la nouvelle configuration
4. **Auditer** les accès récents
5. **Notifier** les utilisateurs si nécessaire (RGPD)

### 3. Attaque DDoS

1. **Activer** le mode maintenance
2. **Augmenter** les limites de rate limiting
3. **Bloquer** les IPs malveillantes
4. **Utiliser** un CDN/WAF (Cloudflare, AWS WAF)

## 📊 Monitoring et Alertes

### Métriques à Surveiller

- **Taux d'échec d'authentification** (> 10% = alerte)
- **Tentatives de rate limiting** (> 100/h = alerte)
- **Erreurs 500** (> 1% = alerte)
- **Temps de réponse** (> 2s = alerte)
- **Utilisation CPU/RAM** (> 80% = alerte)

### Outils Recommandés

- **Sentry** - Monitoring d'erreurs
- **Datadog** - Monitoring infrastructure
- **Cloudflare** - Protection DDoS
- **AWS GuardDuty** - Détection de menaces

## 🔍 Audit de Sécurité Régulier

### Mensuel

- [ ] Vérifier les dépendances (`npm audit`)
- [ ] Analyser les logs d'erreur
- [ ] Vérifier les tentatives d'authentification échouées
- [ ] Tester le rate limiting

### Trimestriel

- [ ] Rotation des secrets
- [ ] Audit complet du code
- [ ] Test de pénétration
- [ ] Revue des permissions utilisateurs

### Annuel

- [ ] Audit de sécurité externe
- [ ] Mise à jour des procédures
- [ ] Formation de l'équipe
- [ ] Revue de la politique de sécurité

## 📚 Ressources

### Standards

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Outils

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

### Conformité

- [RGPD](https://gdpr.eu/)
- [PCI DSS](https://www.pcisecuritystandards.org/)

## 📞 Contact

En cas de découverte de vulnérabilité, contacter:
- **Email:** security@beautyshop.com
- **PGP Key:** [Lien vers clé publique]

---

**Dernière mise à jour:** 16 décembre 2025  
**Version:** 1.0.0
