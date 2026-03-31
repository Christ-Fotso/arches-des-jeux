import { db } from "../db";
import { discountCodes, type DiscountCode, type InsertDiscountCode } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class DiscountRepository {
  async create(data: InsertDiscountCode): Promise<DiscountCode> {
    const [code] = await db.insert(discountCodes).values(data).returning();
    return code;
  }

  async findAll(): Promise<DiscountCode[]> {
    return await db.query.discountCodes.findMany({
      orderBy: (codes, { desc }) => [desc(codes.createdAt)],
    });
  }

  async findByCode(code: string): Promise<DiscountCode | undefined> {
    return await db.query.discountCodes.findFirst({
      where: and(
        eq(discountCodes.code, code),
        eq(discountCodes.isActive, true)
      ),
    });
  }

  async findById(id: string): Promise<DiscountCode | undefined> {
    return await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, id),
    });
  }

  async markAsUsed(id: string, userId: string): Promise<DiscountCode | undefined> {
    const [updated] = await db
      .update(discountCodes)
      .set({ usedBy: userId })
      .where(eq(discountCodes.id, id))
      .returning();
    return updated;
  }

  async update(id: string, data: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined> {
    const [updated] = await db
      .update(discountCodes)
      .set(data)
      .where(eq(discountCodes.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(discountCodes).where(eq(discountCodes.id, id)).returning();
    return result.length > 0;
  }
}
