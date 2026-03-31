import { ProductRepository, type ProductWithReviews } from "../repositories/product.repository";
import type { Product, InsertProduct } from "@shared/schema";

export class ProductService {
  private productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository;
  }

  async getAllProducts(): Promise<ProductWithReviews[]> {
    return await this.productRepository.findAll();
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async searchProducts(query: string): Promise<ProductWithReviews[]> {
    return await this.productRepository.search(query);
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    return await this.productRepository.create(data);
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product> {
    const product = await this.productRepository.update(id, data);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new Error("Product not found");
    }
  }

  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.getProductById(productId);
    return product.quantityInStock >= quantity;
  }
}
