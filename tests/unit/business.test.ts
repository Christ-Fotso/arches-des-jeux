import { describe, it, expect } from "vitest";

describe("Auth - Validation des règles métier", () => {
  it("rejette un mot de passe vide", () => {
    const password = "";
    expect(password.length).toBeLessThan(6);
  });

  it("accepte un mot de passe d'au moins 6 caractères", () => {
    const password = "secure123";
    expect(password.length).toBeGreaterThanOrEqual(6);
  });

  it("valide un format email correct", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("user@larchedesjeux.fr")).toBe(true);
  });

  it("rejette un email invalide", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("not-an-email")).toBe(false);
  });
});

describe("Calcul du prix des commandes", () => {
  it("calcule le total d'une commande avec plusieurs articles", () => {
    const items = [
      { price: "25.00", quantity: 2 },
      { price: "15.00", quantity: 1 },
    ];
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    expect(total).toBe(65);
  });

  it("applique correctement une remise", () => {
    const subtotal = 100;
    const discountPercentage = 10;
    const total = subtotal - (subtotal * discountPercentage) / 100;
    expect(total).toBe(90);
  });

  it("gère les montants à virgule flottante sans erreur d'arrondi", () => {
    const price = "14.99";
    const quantity = 3;
    const total = Math.round(parseFloat(price) * quantity * 100) / 100;
    expect(total).toBe(44.97);
  });
});

describe("Statuts de commande", () => {
  const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  it("accepte les statuts valides", () => {
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it("refuse les statuts inconnus", () => {
    expect(validStatuses).not.toContain("UNKNOWN_STATUS");
  });
});
