import { ReviewRepository } from "../repositories/review.repository";
import { ProductRepository } from "../repositories/product.repository";
import { type InsertReview } from "@shared/schema";

export class ReviewService {
  constructor(
    private reviewRepo: ReviewRepository,
    private productRepo: ProductRepository
  ) { }

  async createReview(userId: string, data: InsertReview) {
    // Vérifier si l'utilisateur a déjà noté ce produit
    const existingReview = await this.reviewRepo.findByUserAndProduct(userId, data.productId);
    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Vérifier si l'utilisateur a reçu ce produit (status DELIVERED)
    const hasReceivedProduct = await this.reviewRepo.userHasReceivedProduct(userId, data.productId);
    if (!hasReceivedProduct) {
      throw new Error("You can only review products you have received");
    }

    // Créer le review
    const review = await this.reviewRepo.create({
      ...data,
      userId,
    });

    // Mettre à jour les statistiques du produit
    await this.updateProductStats(data.productId);

    return review;
  }

  async getProductReviews(productId: string) {
    const reviews = await this.reviewRepo.findByProductId(productId);
    const stats = await this.reviewRepo.getProductRatingStats(productId);

    return {
      reviews,
      stats,
    };
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized");
    }

    const productId = review.productId;
    await this.reviewRepo.delete(reviewId);

    // Mettre à jour les statistiques du produit
    await this.updateProductStats(productId);

    return true;
  }

  /**
   * Met à jour les statistiques du produit (note moyenne et nombre de reviews)
   */
  private async updateProductStats(productId: string) {
    const stats = await this.reviewRepo.getProductRatingStats(productId);

    await this.productRepo.update(productId, {
      averageRating: stats.averageRating.toString(),
      reviewCount: stats.totalReviews,
    });
  }

  /**
   * Vérifie si un utilisateur peut noter un produit
   */
  async canUserReviewProduct(userId: string, productId: string): Promise<boolean> {
    // Vérifier si déjà noté
    const existingReview = await this.reviewRepo.findByUserAndProduct(userId, productId);
    if (existingReview) {
      return false;
    }

    // Vérifier si le produit a été reçu
    return await this.reviewRepo.userHasReceivedProduct(userId, productId);
  }
}
