import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_URL || "http://localhost:5000";

describe("Tests fonctionnels API", () => {
  describe("GET /api/products", () => {
    it("retourne une liste de produits (200)", async () => {
      const res = await fetch(`${BASE_URL}/api/products`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/settings", () => {
    it("retourne les paramètres du site (200 ou 404)", async () => {
      const res = await fetch(`${BASE_URL}/api/settings`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("POST /api/auth/login - champs manquants", () => {
    it("retourne 401 avec des identifiants invalides", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid@test.com", password: "wrongpassword" }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orders - sans auth", () => {
    it("retourne 401 sans token d'authentification", async () => {
      const res = await fetch(`${BASE_URL}/api/orders`);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/discount/validate", () => {
    it("retourne invalid pour un code inexistant", async () => {
      const res = await fetch(`${BASE_URL}/api/discount/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "CODEINEXISTANT", amount: 100 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(false);
    });
  });
});
