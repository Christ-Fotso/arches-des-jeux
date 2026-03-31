import { db } from "../db";
import { users, products, orders, orderItems } from "@shared/schema";
import { sql, count, sum, desc } from "drizzle-orm";

export interface DashboardStats {
  totalRevenue: string;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string;
    userId: string;
    totalAmount: string;
    status: string;
    createdAt: Date;
  }>;
  topProducts: Array<{
    productId: string;
    titleEn: string;
    totalSold: number;
    revenue: string;
  }>;
}

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [revenueData] = await db
      .select({
        total: sum(orders.totalAmount),
      })
      .from(orders);

    const [ordersCount] = await db
      .select({ count: count() })
      .from(orders);

    const [usersCount] = await db
      .select({ count: count() })
      .from(users);

    const [productsCount] = await db
      .select({ count: count() })
      .from(products);

    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    const topProducts = await db
      .select({
        productId: orderItems.productId,
        titleEn: products.titleEn,
        totalSold: sum(orderItems.quantity).as("total_sold"),
        revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceAtPurchase}`).as("revenue"),
      })
      .from(orderItems)
      .innerJoin(products, sql`${orderItems.productId} = ${products.id}`)
      .groupBy(orderItems.productId, products.titleEn)
      .orderBy(desc(sql`total_sold`))
      .limit(5);

    return {
      totalRevenue: revenueData?.total ?? "0",
      totalOrders: ordersCount?.count ?? 0,
      totalUsers: usersCount?.count ?? 0,
      totalProducts: productsCount?.count ?? 0,
      recentOrders: recentOrders.map(order => ({
        ...order,
        createdAt: order.createdAt,
      })),
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        titleEn: p.titleEn,
        totalSold: Number(p.totalSold ?? 0),
        revenue: String(p.revenue ?? "0"),
      })),
    };
  }
}
