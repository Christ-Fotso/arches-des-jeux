import type { Product } from "@shared/schema";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "An error occurred" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<{ user: any; token: string }>(response);
    },

    register: async (name: string, email: string, password: string) => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "USER" }),
      });
      return handleResponse<{ user: any; token: string }>(response);
    },
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const response = await fetch(`${API_BASE}/products`);
      return handleResponse<Product[]>(response);
    },

    search: async (query: string): Promise<Product[]> => {
      const response = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}`);
      return handleResponse<Product[]>(response);
    },

    getById: async (id: string): Promise<Product> => {
      const response = await fetch(`${API_BASE}/products/${id}`);
      return handleResponse<Product>(response);
    },
  },

  orders: {
    create: async (items: Array<{ productId: string; quantity: number }>, discountCode?: string) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ items, discountCode }),
      });
      return handleResponse<any>(response);
    },

    getUserOrders: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/orders`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return handleResponse<any[]>(response);
    },
  },

  discount: {
    validate: async (code: string) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/discount/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ code }),
      });
      return handleResponse<any>(response);
    },
  },
};
