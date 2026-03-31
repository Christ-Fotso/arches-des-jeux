import { db } from "../db";
import { orders, orderItems, users, products, type Order, type InsertOrder, type OrderItem, type InsertOrderItem } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export class OrderRepository {
  async create(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async findById(id: string): Promise<Order | undefined> {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Order | undefined> {
    return await db.query.orders.findFirst({
      where: eq(orders.paymentIntentId, paymentIntentId),
    });
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async updateStatus(id: string, status: string, trackingNumber?: string): Promise<Order | undefined> {
    const updateData: any = { 
      status,
      updatedAt: sql`NOW()`
    };
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id));
    
    // Fetch and return the updated order
    return this.findById(id);
  }

  async findAllWithUserInfo(): Promise<(Order & { userName: string; userEmail: string })[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        guestEmail: orders.guestEmail,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        discountCodeId: orders.discountCodeId,
        status: orders.status,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        paymentIntentId: orders.paymentIntentId,
        firstName: orders.firstName,
        lastName: orders.lastName,
        address: orders.address,
        addressLine2: orders.addressLine2,
        city: orders.city,
        postalCode: orders.postalCode,
        country: orders.country,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
    
    return result as (Order & { userName: string; userEmail: string; guestEmail: string | null })[];
  }

  async getUserOrdersWithDetails(userId: string) {
    console.log(`[OrderRepository] Getting orders for user: ${userId}`);
    const userOrders = await db
      .select({
        orderId: orders.id,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        status: orders.status,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        paymentIntentId: orders.paymentIntentId,
        firstName: orders.firstName,
        lastName: orders.lastName,
        address: orders.address,
        addressLine2: orders.addressLine2,
        city: orders.city,
        postalCode: orders.postalCode,
        country: orders.country,
        itemId: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        productTitleFr: products.titleFr,
        productTitleDe: products.titleDe,
        productTitleEn: products.titleEn,
        productImageUrl: products.imageUrl1,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    console.log(`[OrderRepository] Found ${userOrders.length} order rows`);

    const ordersMap = new Map();
    
    userOrders.forEach((row) => {
      if (!ordersMap.has(row.orderId)) {
        ordersMap.set(row.orderId, {
          id: row.orderId,
          totalAmount: row.totalAmount,
          discountAmount: row.discountAmount,
          status: row.status,
          trackingNumber: row.trackingNumber,
          createdAt: row.createdAt,
          paymentIntentId: row.paymentIntentId,
          firstName: row.firstName,
          lastName: row.lastName,
          address: row.address,
          addressLine2: row.addressLine2,
          city: row.city,
          postalCode: row.postalCode,
          country: row.country,
          items: [],
        });
      }
      
      const order = ordersMap.get(row.orderId);
      if (order) {
        order.items.push({
          id: row.itemId,
          productId: row.productId,
          quantity: row.quantity,
          priceAtPurchase: row.priceAtPurchase,
          productTitleFr: row.productTitleFr,
          productTitleDe: row.productTitleDe,
          productTitleEn: row.productTitleEn,
          productImageUrl: row.productImageUrl,
        });
      }
    });
    
    const result = Array.from(ordersMap.values());
    console.log(`[OrderRepository] Returning ${result.length} orders`);
    return result;
  }

  async linkGuestOrders(guestEmail: string, userId: string): Promise<void> {
    await db
      .update(orders)
      .set({ userId, guestEmail: null })
      .where(eq(orders.guestEmail, guestEmail));
  }
}
