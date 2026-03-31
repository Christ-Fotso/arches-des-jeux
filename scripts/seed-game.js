import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER || "arches_user"}:${process.env.POSTGRES_PASSWORD || "arches_pass"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "arches_des_jeux"}`;

const sql = postgres(DATABASE_URL);

async function seed() {
  console.log("Seeding game via JS...");
  try {
    await sql`
      INSERT INTO products (
        title_fr, title_de, title_en, 
        description_fr, description_de, description_en, 
        price, quantity_in_stock, 
        image_url_1, image_url_2, 
        alt_text_fr, alt_text_de, alt_text_en
      ) VALUES (
        ${'C’est quoi le verset ?'}, ${'Was ist der Vers?'}, ${"What's the verse?"},
        ${"« C’est quoi le verset ? » est un jeu de 100 cartes éducatif et interactif conçu pour explorer la Bible de manière ludique. Chaque carte propose une question sur un thème biblique (histoire, personnage, enseignement), suivie de sa réponse claire et du verset associé. Parfait pour les familles, les groupes de jeunes ou les écoles du dimanche."}, 
        ${"« Was ist der Vers? » ist ein lehrreiches und interaktives Kartenspiel mit 100 Karten, um die Bibel spielerisch zu entdecken. Jede Karte bietet eine Frage zu einem biblischen Thema, gefolgt von einer klaren Antwort und dem zugehörigen Vers."}, 
        ${"« What’s the verse? » is an educational and interactive 100-card game designed to explore the Bible in a fun way. Each card features a question on a biblical theme, followed by a clear answer and the associated verse."},
        ${'29.90'}, ${100}, 
        ${'/uploads/game_box.png'}, ${'/uploads/game_cards.png'},
        ${"Boîte du jeu C'est quoi le verset ?"}, ${'Spielschachtel Was ist der Vers?'}, ${"Game box What's the verse?"}
      )
    `;
    console.log("✅ Game seeded successfully via JS!");
  } catch (e) {
    console.error("❌ Error seeding game:", e);
  } finally {
    await sql.end();
    process.exit(0);
  }
}
seed();
