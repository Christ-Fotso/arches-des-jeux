import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL non définie');
    process.exit(1);
}

export async function initializeDatabase() {
    console.log('🚀 Initialisation de la base de données...\n');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined,
    });

    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');

        // 1. Créer toutes les tables
        console.log('📋 Création des tables...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        stripe_customer_id VARCHAR UNIQUE,
        first_name TEXT,
        last_name TEXT,
        address TEXT,
        address_line_2 TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'CH',
        reset_password_token TEXT,
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_addresses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        address TEXT NOT NULL,
        address_line_2 TEXT,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'CH',
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id VARCHAR REFERENCES brands(id),
        title_fr TEXT NOT NULL,
        title_de TEXT NOT NULL,
        title_en TEXT NOT NULL,
        description_fr TEXT NOT NULL,
        description_de TEXT NOT NULL,
        description_en TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        discount_percentage INTEGER DEFAULT 0,
        quantity_in_stock INTEGER NOT NULL DEFAULT 0,
        image_url_1 TEXT NOT NULL,
        image_url_2 TEXT NOT NULL,
        alt_text_fr TEXT NOT NULL,
        alt_text_de TEXT NOT NULL,
        alt_text_en TEXT NOT NULL,
        average_rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        order_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        is_single_use BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        used_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        shipping_address_id VARCHAR REFERENCES shipping_addresses(id),
        total_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        discount_code_id VARCHAR,
        payment_intent_id TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        tracking_number TEXT,
        first_name TEXT,
        last_name TEXT,
        address TEXT,
        address_line_2 TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT,
        shipping_cost DECIMAL(10,2),
        shipping_carrier TEXT,
        shipping_service TEXT,
        estimated_delivery_days INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR NOT NULL REFERENCES orders(id),
        product_id VARCHAR NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10,2) NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR NOT NULL REFERENCES products(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        order_id VARCHAR REFERENCES orders(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, product_id)
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        default_language TEXT NOT NULL DEFAULT 'fr',
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        console.log('✅ Toutes les tables créées\n');

        // 2. Vérifier si des données existent déjà
        const { rows } = await client.query('SELECT COUNT(*) as count FROM products');
        const productCount = parseInt(rows[0].count);

        if (productCount > 0) {
            console.log(`ℹ️  Base déjà peuplée (${productCount} produits)\n`);
            await client.end();
            return;
        }

        // 3. Peupler avec des données initiales
        console.log('🌱 Peuplement de la base de données...\n');

        // Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@muenappy.com', adminPassword, 'Admin Nappy & Müe', 'ADMIN']);
        console.log('👤 Admin créé');

        // Marque
        const brandResult = await client.query(`
      INSERT INTO brands (name, description)
      VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET description = $2
      RETURNING id
    `, ['Nappy & Müe', 'Produits naturels et bio pour bébés']);
        const brandId = brandResult.rows[0].id;
        console.log('🏷️  Marque créée');

        // Produits par défaut
        const defaultProducts = [
            ['Crème Hydratante Bébé', 'Baby Feuchtigkeitscreme', 'Baby Moisturizing Cream', 'Crème douce et naturelle', 'Sanfte Creme', 'Gentle cream', 29.90],
            ['Huile de Massage', 'Massageöl', 'Massage Oil', 'Huile naturelle', 'Natürliches Öl', 'Natural oil', 24.90],
            ['Savon Doux', 'Sanfte Seife', 'Gentle Soap', 'Savon surgras', 'Überfettete Seife', 'Superfatted soap', 12.90],
        ];

        for (let i = 0; i < defaultProducts.length; i++) {
            const [tfr, tde, ten, dfr, dde, den, price] = defaultProducts[i];
            await client.query(`
        INSERT INTO products (
          brand_id, title_fr, title_de, title_en,
          description_fr, description_de, description_en,
          price, quantity_in_stock,
          image_url_1, image_url_2,
          alt_text_fr, alt_text_de, alt_text_en
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
                brandId, tfr, tde, ten, dfr, dde, den, price, 50,
                `/images/${i + 1}a.jpg`, `/images/${i + 1}b.jpg`,
                tfr, tde, ten
            ]);
        }
        console.log(`📦 ${defaultProducts.length} produits créés`);

        // Settings
        await client.query(`
      INSERT INTO site_settings (default_language)
      VALUES ('fr')
      ON CONFLICT DO NOTHING
    `);

        console.log('\n✅ Base de données initialisée avec succès !');
        await client.end();

    } catch (error) {
        console.error('❌ Erreur initialisation:', error.message);
        await client.end();
        throw error;
    }
}

// Auto-run si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase()
        .then(() => {
            console.log('\n✨ Terminé !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Échec:', error);
            process.exit(1);
        });
}
