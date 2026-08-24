import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error("Usage: npm run tsx scripts/update-password.ts <email> <new_password>");
    process.exit(1);
  }

  const [email, newPassword] = args;

  if (newPassword.length < 6) {
    console.error("Erreur: Le mot de passe doit contenir au moins 6 caractères.");
    process.exit(1);
  }

  try {
    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userList.length === 0) {
      console.error(`Erreur: Utilisateur avec l'email ${email} non trouvé.`);
      process.exit(1);
    }

    const user = userList[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    console.log(`✅ Mot de passe mis à jour avec succès pour l'utilisateur ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    process.exit(1);
  }
}

main();
