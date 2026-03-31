#!/bin/bash

# ==============================================================================
# MÜE - SCRIPT DE MIGRATION RAPIDE (VPS A -> VPS B)
# ==============================================================================
# Ce script permet de migrer l'application et sa base de données locale
# d'un serveur à un autre en moins de 2 minutes.
#
# Usage: ./migrate.sh <IP_DESTINATION> <USER_DESTINATION>
# Exemple: ./migrate.sh 1.2.3.4 root
# ==============================================================================

if [ "$#" -ne 2 ]; then
    echo "❌ Erreur: Paramètres manquants."
    echo "Usage: $0 <IP_DESTINATION> <USER_DESTINATION>"
    exit 1
fi

IP_B=$1
USER_B=$2
APP_DIR="/app/mue-and-nappy" # Répertoire cible sur le nouveau VPS

echo "----------------------------------------------------------"
echo "🚀 Démarrage de la migration vers $USER_B@$IP_B"
echo "----------------------------------------------------------"

# 1. Export de la base de données
echo "📥 1/5. Exportation de la base de données locale..."
docker exec mue_and_nappy-postgres-1 pg_dumpall -c -U beaute > mue_dump_backup.sql
if [ $? -ne 0 ]; then
    echo "❌ Échec de l'exportation de la base de données."
    exit 1
fi

# 2. Création du répertoire sur le VPS cible
echo "📂 2/5. Préparation du répertoire cible sur le nouveau VPS..."
ssh $USER_B@$IP_B "mkdir -p $APP_DIR/secrets"

# 3. Transfert des fichiers critiques
echo "📦 3/5. Transfert des fichiers (Docker Compose, Secrets, Dump)..."
scp docker-compose.prod.yml $USER_B@$IP_B:$APP_DIR/
scp -r secrets/* $USER_B@$IP_B:$APP_DIR/secrets/
scp mue_dump_backup.sql $USER_B@$IP_B:$APP_DIR/

# 4. Lancement de l'application sur le nouveau VPS
echo "🐳 4/5. Démarrage des conteneurs sur le nouveau VPS..."
ssh $USER_B@$IP_B "cd $APP_DIR && docker-compose -f docker-compose.prod.yml up -d"
echo "⏳ Attente du démarrage de Postgres (15s)..."
sleep 15

# 5. Restauration des données
echo "🗄️ 5/5. Restauration des données sur le nouveau serveur..."
ssh $USER_B@$IP_B "cat $APP_DIR/mue_dump_backup.sql | docker exec -i mue_and_nappy-postgres-1 psql -U beaute"

echo "----------------------------------------------------------"
echo "✅ MIGRATION TERMINÉE AVEC SUCCÈS !"
echo "🌐 Vous pouvez maintenant mettre à jour vos DNS vers $IP_B"
echo "🗑️  N'oubliez pas de supprimer le fichier mue_dump_backup.sql par sécurité."
echo "----------------------------------------------------------"
