import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscountService } from "../../server/services/discount.service";
import type { DiscountCode } from "@shared/schema";

// Mock du repository
const mockRepo = {
  findByCode: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  markAsUsed: vi.fn(),
};

describe("DiscountService", () => {
  let service: DiscountService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DiscountService(mockRepo as any);
  });

  describe("calculateDiscount", () => {
    it("calcule correctement une remise en pourcentage", async () => {
      const code = { type: "PERCENTAGE", value: "10" } as DiscountCode;
      const result = await service.calculateDiscount(100, code);
      expect(result).toBe(10);
    });

    it("calcule correctement une remise en montant fixe", async () => {
      const code = { type: "FIXED", value: "15" } as DiscountCode;
      const result = await service.calculateDiscount(100, code);
      expect(result).toBe(15);
    });

    it("ne dépasse pas le montant total pour une remise fixe", async () => {
      const code = { type: "FIXED", value: "200" } as DiscountCode;
      const result = await service.calculateDiscount(100, code);
      expect(result).toBe(100); // plafonné au sous-total
    });

    it("calcule 0% de remise correctement", async () => {
      const code = { type: "PERCENTAGE", value: "0" } as DiscountCode;
      const result = await service.calculateDiscount(100, code);
      expect(result).toBe(0);
    });

    it("calcule 100% de remise correctement", async () => {
      const code = { type: "PERCENTAGE", value: "100" } as DiscountCode;
      const result = await service.calculateDiscount(50, code);
      expect(result).toBe(50);
    });
  });

  describe("validateCode", () => {
    it("retourne le code si valide", async () => {
      const fakeCode = { id: "1", code: "PROMO10", isSingleUse: false, usedBy: null } as any;
      mockRepo.findByCode.mockResolvedValue(fakeCode);

      const result = await service.validateCode("PROMO10", "user-1");
      expect(result).toEqual(fakeCode);
    });

    it("lève une erreur si le code n'existe pas", async () => {
      mockRepo.findByCode.mockResolvedValue(null);
      await expect(service.validateCode("INVALID", "user-1")).rejects.toThrow("Invalid discount code");
    });

    it("lève une erreur si le code à usage unique est déjà utilisé", async () => {
      const fakeCode = { id: "1", code: "UNIQUE", isSingleUse: true, usedBy: "other-user" } as any;
      mockRepo.findByCode.mockResolvedValue(fakeCode);
      await expect(service.validateCode("UNIQUE", "user-1")).rejects.toThrow("Discount code already used");
    });
  });
});
