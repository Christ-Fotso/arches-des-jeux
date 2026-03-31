import { db } from "../db";
import { reviews, users, orderItems, orders, type Review, type InsertReview } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface ReviewWithUser extends Review {
  userName: string;
}

export class ReviewRepository {
  async create(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  async findByProductId(productId: string): Promise<ReviewWithUser[]> {
    const result = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        userId: reviews.userId,
        orderId: reviews.orderId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    return result as ReviewWithUser[];
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Review | undefined> {
    return await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, userId),
        eq(reviews.productId, productId)
      ),
    });
  }

  async findById(id: string): Promise<Review | undefined> {
    return await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });
  }

  /**
   * Vérifie si l'utilisateur a reçu le produit (commande avec status DELIVERED)
   */
  async userHasReceivedProduct(userId: string, productId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.productId, productId),
          eq(orders.status, 'DELIVERED')
        )
      );

    return result[0]?.count > 0;
  }

  /**
   * Vérifie si l'utilisateur a acheté le produit (commande confirmée)
   */
  async userHasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.productId, productId),
          eq(orders.status, 'CONFIRMED')
        )
      );

    return result[0]?.count > 0;
  }

  async getProductRatingStats(productId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await db
      .select({
        averageRating: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 2), 0)`,
        totalReviews: sql<number>`COALESCE(COUNT(${reviews.id}), 0)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    return {
      averageRating: Number(result[0]?.averageRating || 0),
      totalReviews: Number(result[0]?.totalReviews || 0),
    };
  }

  async delete(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }
}
