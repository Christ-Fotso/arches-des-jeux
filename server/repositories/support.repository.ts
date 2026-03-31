import { db } from "../db";
import { supportMessages, InsertSupportMessage, SupportMessage } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class SupportRepository {
  async createMessage(data: InsertSupportMessage): Promise<SupportMessage> {
    const [message] = await db.insert(supportMessages).values(data).returning();
    return message;
  }

  async getAllMessages(): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt));
  }

  async findById(id: string): Promise<SupportMessage | undefined> {
    const [message] = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.id, id))
      .limit(1);
    return message;
  }

  async markAsRead(id: string): Promise<SupportMessage> {
    const [updated] = await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(eq(supportMessages.id, id))
      .returning();
    return updated;
  }

  async markAsReplied(id: string): Promise<SupportMessage> {
    const [updated] = await db
      .update(supportMessages)
      .set({ isRead: true, repliedAt: new Date() })
      .where(eq(supportMessages.id, id))
      .returning();
    return updated;
  }
}
