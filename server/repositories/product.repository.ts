import { db } from "../db";
import { products, reviews, brands, type Product, type InsertProduct } from "@shared/schema";
import { eq, or, ilike, sql, avg, count } from "drizzle-orm";

export interface ProductWithReviews extends Product {
  ratingAverage: number;
  ratingCount: number;
  brandName: string | null;
}

export class ProductRepository {
  async create(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async findAll(): Promise<ProductWithReviews[]> {
    const result = await db
      .select({
        id: products.id,
        brandId: products.brandId,
        brandName: brands.name,
        titleFr: products.titleFr,
        titleDe: products.titleDe,
        titleEn: products.titleEn,
        descriptionFr: products.descriptionFr,
        descriptionDe: products.descriptionDe,
        descriptionEn: products.descriptionEn,
        price: products.price,
        discountPercentage: products.discountPercentage,
        quantityInStock: products.quantityInStock,
        imageUrl1: products.imageUrl1,
        imageUrl2: products.imageUrl2,
        altTextFr: products.altTextFr,
        altTextDe: products.altTextDe,
        altTextEn: products.altTextEn,
        createdAt: products.createdAt,
        ratingAverage: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
        ratingCount: sql<number>`COALESCE(COUNT(${reviews.id}), 0)`,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(reviews, eq(reviews.productId, products.id))
      .groupBy(products.id, brands.id, brands.name)
      .orderBy(sql`${products.createdAt} DESC`);

    return result.map((row) => ({
      ...row,
      ratingAverage: Number(row.ratingAverage),
      ratingCount: Number(row.ratingCount),
    }));
  }

  async findById(id: string): Promise<Product | undefined> {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  }

  async search(query: string): Promise<ProductWithReviews[]> {
    const searchTerm = `%${query}%`;
    const result = await db
      .select({
        id: products.id,
        brandId: products.brandId,
        brandName: brands.name,
        titleFr: products.titleFr,
        titleDe: products.titleDe,
        titleEn: products.titleEn,
        descriptionFr: products.descriptionFr,
        descriptionDe: products.descriptionDe,
        descriptionEn: products.descriptionEn,
        price: products.price,
        discountPercentage: products.discountPercentage,
        quantityInStock: products.quantityInStock,
        imageUrl1: products.imageUrl1,
        imageUrl2: products.imageUrl2,
        altTextFr: products.altTextFr,
        altTextDe: products.altTextDe,
        altTextEn: products.altTextEn,
        createdAt: products.createdAt,
        ratingAverage: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
        ratingCount: sql<number>`COALESCE(COUNT(${reviews.id}), 0)`,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(reviews, eq(reviews.productId, products.id))
      .where(
        or(
          ilike(products.titleFr, searchTerm),
          ilike(products.titleDe, searchTerm),
          ilike(products.titleEn, searchTerm),
          ilike(products.descriptionFr, searchTerm),
          ilike(products.descriptionDe, searchTerm),
          ilike(products.descriptionEn, searchTerm)
        )
      )
      .groupBy(products.id, brands.id, brands.name);

    return result.map((row) => ({
      ...row,
      ratingAverage: Number(row.ratingAverage),
      ratingCount: Number(row.ratingCount),
    }));
  }

  async update(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateStock(id: string, quantity: number): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ quantityInStock: sql`${products.quantityInStock} - ${quantity}` })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }
}
