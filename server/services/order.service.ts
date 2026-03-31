import { db } from "../db";
import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { DiscountService } from "./discount.service";
import type { Order } from "@shared/schema";

// Enum pour les statuts de commande (sécurité et maintenabilité)
enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

interface OrderItem {
  productId: string;
  quantity: number;
}

interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  discountCode?: string;
}

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private discountService: DiscountService;

  constructor(
    orderRepository: OrderRepository,
    productRepository: ProductRepository,
    discountService: DiscountService
  ) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.discountService = discountService;
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    return await db.transaction(async (tx) => {
      let subtotal = 0;
      const validatedItems: Array<{ productId: string; quantity: number; price: number }> = [];

      for (const item of data.items) {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.quantityInStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.titleEn}`);
        }

        // Validation parseFloat avec fallback
        const price = parseFloat(product.price);
        if (isNaN(price) || price < 0) {
          throw new Error(`Invalid price for product ${product.titleEn}`);
        }

        subtotal += price * item.quantity;
        validatedItems.push({ productId: item.productId, quantity: item.quantity, price });
      }

      let discountAmount = 0;
      let discountCodeId: string | undefined;

      if (data.discountCode) {
        const discount = await this.discountService.validateCode(data.discountCode, data.userId);
        discountAmount = await this.discountService.calculateDiscount(subtotal, discount);
        discountCodeId = discount.id;
      }

      const totalAmount = subtotal - discountAmount;

      const order = await this.orderRepository.create({
        userId: data.userId,
        totalAmount: totalAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        discountCodeId,
        status: "PENDING",
      });

      for (const item of validatedItems) {
        await this.orderRepository.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price.toFixed(2),
        });

        await this.productRepository.updateStock(item.productId, item.quantity);
      }

      if (discountCodeId) {
        await this.discountService.markAsUsed(discountCodeId, data.userId);
      }

      return order;
    });
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.findByUserId(userId);
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    return await this.orderRepository.findById(orderId);
  }

  async getAllOrders(): Promise<(Order & { userName: string; userEmail: string; guestEmail: string | null })[]> {
    return await this.orderRepository.findAllWithUserInfo();
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Utiliser l'enum pour validation
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as OrderStatus)) {
      throw new Error("Invalid status");
    }

    const updated = await this.orderRepository.updateStatus(orderId, status, trackingNumber);
    if (!updated) {
      throw new Error("Failed to update order");
    }

    return updated;
  }
}
