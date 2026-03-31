import { db } from "../db";
import { users, type User, type InsertUser } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class UserRepository {
  async create(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async update(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, stripeCustomerId),
    });
  }
}
