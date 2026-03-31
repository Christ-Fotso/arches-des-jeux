import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier images s'il n'existe pas
const imagesDir = path.join(__dirname, '..', 'client', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Liste des produits avec leurs dimensions (largeur x hauteur)
const products = [
  { num: 1, width: 800, height: 800, name: 'Serum Anti-Age' },
  { num: 2, width: 800, height: 800, name: 'Creme Hydratante' },
  { num: 3, width: 800, height: 800, name: 'Masque Argile' },
  { num: 4, width: 800, height: 800, name: 'Serum Vitamine C' },
  { num: 5, width: 800, height: 800, name: 'Demaquillant' },
  { num: 6, width: 800, height: 800, name: 'Palette Fards' },
  { num: 7, width: 800, height: 800, name: 'Rouge Levres' },
  { num: 8, width: 800, height: 800, name: 'Mascara' },
  { num: 9, width: 800, height: 800, name: 'Shampooing' },
  { num: 10, width: 800, height: 800, name: 'Huile Visage' },
];

console.log('📥 Téléchargement des images placeholder...\n');

for (const product of products) {
  // Image A
  const urlA = `https://picsum.photos/seed/${product.name}-a/${product.width}/${product.height}`;
  const fileA = path.join(imagesDir, `${product.num}a.jpg`);
  
  // Image B
  const urlB = `https://picsum.photos/seed/${product.name}-b/${product.width}/${product.height}`;
  const fileB = path.join(imagesDir, `${product.num}b.jpg`);

  try {
    console.log(`Téléchargement produit ${product.num}...`);
    
    // Télécharger image A
    const responseA = await fetch(urlA);
    const bufferA = await responseA.arrayBuffer();
    fs.writeFileSync(fileA, Buffer.from(bufferA));
    
    // Télécharger image B
    const responseB = await fetch(urlB);
    const bufferB = await responseB.arrayBuffer();
    fs.writeFileSync(fileB, Buffer.from(bufferB));
    
    console.log(`✅ Produit ${product.num}: ${product.num}a.jpg et ${product.num}b.jpg`);
  } catch (error) {
    console.error(`❌ Erreur pour le produit ${product.num}:`, error.message);
  }
}

console.log('\n✅ Toutes les images ont été téléchargées dans client/public/images/');

