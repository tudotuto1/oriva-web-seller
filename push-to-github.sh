#!/bin/bash
# ============================================
# ORIVA — Push automatique vers GitHub
# ============================================
# 1. Dézippe oriva-web-seller.zip dans le même dossier que ce script
# 2. Lance : bash push-to-github.sh
# ============================================

set -e

REPO_URL="https://github.com/tudotuto1/oriva-web-seller.git"
FOLDER="oriva-web-seller"

echo "🔍 Vérification du dossier..."

if [ ! -d "$FOLDER" ]; then
  echo "❌ Erreur : Le dossier '$FOLDER' est introuvable."
  echo "   → Dézippe oriva-web-seller.zip dans le même dossier que ce script."
  exit 1
fi

cd "$FOLDER"

echo "🗑️  Nettoyage du repo existant..."
rm -rf .git

echo "🔧 Initialisation Git..."
git init
git remote add origin "$REPO_URL"

echo "📦 Ajout des fichiers..."
git add .

echo "💾 Commit..."
git commit -m "feat: portail vendeur Oriva - Phase 2 complete"

echo "🚀 Push vers GitHub (branche main)..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ SUCCÈS ! Le code est sur GitHub."
echo "   → Vercel redéploie automatiquement dans 1-2 minutes."
echo "   → Vérifie : https://oriva-web-seller.vercel.app"
echo ""
echo "⚠️  N'oublie pas les variables d'environnement sur Vercel :"
echo "   NEXT_PUBLIC_SUPABASE_URL = https://xfsighmbgtmbmbmznluq.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc2lnaG1iZ3RtYm1ibXpubHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTM1MTcsImV4cCI6MjA5MjA4OTUxN30.xHDiMwRf8VvQwK3m1UYB_ZwH9JqvO-X4OwJy0pP6lCU"
