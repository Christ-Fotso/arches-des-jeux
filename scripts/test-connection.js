import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

console.log("Testing connection with URL:", DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

try {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const result = await sql`SELECT 1 as test`;
  console.log("✅ Connection successful!", result);
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Connection failed:", error.message);
  console.error("Full error:", error);
  process.exit(1);
}

