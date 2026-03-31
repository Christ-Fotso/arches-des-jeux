import "dotenv/config";
import postgres from "postgres";

const user = process.env.POSTGRES_USER || "beaute";
const password = process.env.POSTGRES_PASSWORD || "beaute_password";
const db = process.env.POSTGRES_DB || "beaute_suisse";
const host = "localhost";
const port = 5432;

const DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${db}`;

console.log("Testing connection with constructed URL:", DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const result = await sql`SELECT 1 as test, current_user, current_database()`;
  console.log("✅ Connection successful!", result);
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Connection failed:", error.message);
  console.error("User:", user);
  console.error("Password length:", password.length);
  console.error("Password (first 3 chars):", password.substring(0, 3));
  process.exit(1);
}

