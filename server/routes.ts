import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import Stripe from "stripe";
import fs from "fs";
import { z } from "zod";
import { AuthService } from "./services/auth.service";
import { ProductService } from "./services/product.service";
import { DiscountService } from "./services/discount.service";
import { OrderService } from "./services/order.service";
import { SettingsService } from "./services/settings.service";
import { ReviewService } from "./services/review.service";
import { UserRepository } from "./repositories/user.repository";
import { ProductRepository } from "./repositories/product.repository";
import { DiscountRepository } from "./repositories/discount.repository";
import { OrderRepository } from "./repositories/order.repository";
import { SettingsRepository } from "./repositories/settings.repository";
import { ReviewRepository } from "./repositories/review.repository";
import { SupportRepository } from "./repositories/support.repository";
import { authenticate, optionalAuth, requireAdmin, type AuthRequest } from "./middleware/auth.middleware";
import { insertUserSchema, insertProductSchema, insertDiscountCodeSchema, insertSiteSettingsSchema, insertReviewSchema, insertShippingAddressSchema, insertSupportMessageSchema } from "@shared/schema";
import { AdminService } from "./services/admin.service";
import { UserService, updateProfileSchema, changePasswordSchema } from "./services/user.service";
import { authRateLimiter, uploadRateLimiter, validateMimeType } from "./middleware/security.middleware";
import { ShippingAddressRepository } from "./repositories/shipping-address.repository";
import { ShippingAddressService } from "./services/shipping-address.service";
import { shippingService } from "./services/shipping.service";
import { emailService } from "./services/email.service";
import crypto from "crypto";


// Lire la clé Stripe depuis Docker secret si disponible
let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeSecretPath = "/run/secrets/stripe_secret";
if (fs.existsSync(stripeSecretPath)) {
  stripeSecretKey = fs.readFileSync(stripeSecretPath, "utf8").trim();
}

const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: "2025-10-29.clover",
});

// Assurer que le dossier uploads existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const userRepo = new UserRepository();
const productRepo = new ProductRepository();
const discountRepo = new DiscountRepository();
const orderRepo = new OrderRepository();
const settingsRepo = new SettingsRepository();
const reviewRepo = new ReviewRepository();
const supportRepo = new SupportRepository();
const shippingAddressRepo = new ShippingAddressRepository();

const authService = new AuthService(userRepo);
const productService = new ProductService(productRepo);
const discountService = new DiscountService(discountRepo);
const orderService = new OrderService(orderRepo, productRepo, discountService);
const adminService = new AdminService();
const userService = new UserService(userRepo);
const settingsService = new SettingsService(settingsRepo);
const reviewService = new ReviewService(reviewRepo, productRepo);
const shippingAddressService = new ShippingAddressService(shippingAddressRepo);

export async function registerRoutes(app: Express): Promise<Server> {

  // Schéma de validation pour les items de commande
  const createOrderItemsSchema = z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(100)
    })).min(1),
    discountCode: z.string().optional()
  });

  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const result = await authService.register(data);
      // Rattachement automatique des commandes passées en mode invité
      await orderRepo.linkGuestOrders(data.email, result.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // Mot de passe oublié - Envoie un email avec un lien de réinitialisation
  app.post("/api/auth/forgot-password", authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email requis" });
      }

      // Vérifier si l'utilisateur existe
      const user = await userRepo.findByEmail(email);

      // Pour des raisons de sécurité, on retourne toujours succès même si l'email n'existe pas
      if (!user) {
        return res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" });
      }

      // Générer un token sécurisé
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 heure

      // Sauvegarder le token dans la base de données
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await db.update(users)
        .set({
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        })
        .where(eq(users.id, user.id));

      // Envoyer l'email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" });
    } catch (error: any) {
      console.error("Error in forgot-password:", error);
      res.status(500).json({ error: "Une erreur est survenue" });
    }
  });

  // Réinitialiser le mot de passe avec le token
  app.post("/api/auth/reset-password/:token", authRateLimiter, async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      // Chercher l'utilisateur avec ce token
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq, and, gt } = await import("drizzle-orm");

      const [user] = await db.select()
        .from(users)
        .where(
          and(
            eq(users.resetPasswordToken, token),
            gt(users.resetPasswordExpires, new Date())
          )
        )
        .limit(1);

      if (!user) {
        return res.status(400).json({ error: "Le lien de réinitialisation est invalide ou expiré" });
      }

      // Hasher le nouveau mot de passe
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe et supprimer le token
      await db.update(users)
        .set({
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error: any) {
      console.error("Error in reset-password:", error);
      res.status(500).json({ error: "Une erreur est survenue" });
    }
  });

  // Route pour les taux de change (multi-devises)
  app.get("/api/exchange-rates", async (_req, res) => {
    try {
      // Taux statiques - base EUR (les prix sont stockés en EUR)
      const staticRates = {
        EUR: 1.00,   // Base
        CHF: 0.93,   // 1 EUR ≈ 0.93 CHF
        USD: 1.10,   // 1 EUR ≈ 1.10 USD
        GBP: 0.85,   // 1 EUR ≈ 0.85 GBP
      };

      res.json({
        rates: staticRates,
        baseCurrency: 'EUR',
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  app.post("/api/upload", authenticate, requireAdmin, uploadRateLimiter, upload.single("image"), validateMimeType, (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/brands", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { brands } = await import("@shared/schema");
      const allBrands = await db.select().from(brands);
      res.json(allBrands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Routes admin pour gérer les marques
  app.post("/api/admin/brands", authenticate, requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Le nom de la marque est requis" });
      }

      const { db } = await import("./db");
      const { brands } = await import("@shared/schema");

      const [newBrand] = await db.insert(brands).values({
        name,
        description: description || null,
      }).returning();

      res.json(newBrand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/brands/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Le nom de la marque est requis" });
      }

      const { db } = await import("./db");
      const { brands } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [updatedBrand] = await db.update(brands)
        .set({
          name,
          description: description || null,
        })
        .where(eq(brands.id, id))
        .returning();

      if (!updatedBrand) {
        return res.status(404).json({ error: "Marque non trouvée" });
      }

      res.json(updatedBrand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/brands/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const { db } = await import("./db");
      const { brands } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [deletedBrand] = await db.delete(brands)
        .where(eq(brands.id, id))
        .returning();

      if (!deletedBrand) {
        return res.status(404).json({ error: "Marque non trouvée" });
      }

      res.json({ success: true, message: "Marque supprimée" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { search } = req.query;
      const products = search
        ? await productService.searchProducts(search as string)
        : await productService.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(product);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.post("/api/products", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await productService.createProduct(data);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/products/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.post("/api/discount/validate", async (req, res) => {
    try {
      const { code, amount } = req.body;
      if (!code) return res.status(400).json({ valid: false, message: "Code manquant" });

      const discount = await discountService.validateCode(code, "");
      const subtotal = parseFloat(amount) || 0;
      const discountAmount = await discountService.calculateDiscount(subtotal, discount);

      res.json({
        valid: true,
        type: discount.type,
        value: parseFloat(discount.value),
        discountAmount,
      });
    } catch (error: any) {
      res.json({ valid: false, message: "Code promo invalide ou expiré" });
    }
  });

  // Route publique pour la bannière (codes promo visibles sur l'accueil)
  app.get("/api/discount/public-promos", async (req, res) => {
    try {
      const codes = await discountService.getAllCodes();
      const publicPromos = codes
        .filter((c: any) => c.isActive && c.showOnHome)
        .map((c: any) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          type: c.type,
          value: c.value,
        }));
      res.json(publicPromos);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.get("/api/discount", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const codes = await discountService.getAllCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discount", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertDiscountCodeSchema.parse(req.body);
      const code = await discountService.createCode(data);
      res.status(201).json(code);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/discount/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updated = await discountService.updateCode(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      if (error.message === "Discount code not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/discount/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await discountService.deleteCode(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Discount code not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", authenticate, async (req: AuthRequest, res) => {
    try {
      const { items, discountCode } = req.body;
      const order = await orderService.createOrder({
        userId: req.user!.userId,
        items,
        discountCode,
      });
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role === "ADMIN") {
        const orders = await orderService.getAllOrders();
        res.json(orders);
      } else {
        const orders = await orderService.getUserOrders(req.user!.userId);
        res.json(orders);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/my-orders", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const orders = await orderRepo.getUserOrdersWithDetails(req.user.userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id/status", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { status, trackingNumber } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status, trackingNumber);
      res.json(order);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/profile", authenticate, async (req: AuthRequest, res) => {
    try {
      const profile = await userService.getProfile(req.user!.userId);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.put("/api/user/profile", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updated = await userService.updateProfile(req.user!.userId, data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/user/password", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      await userService.changePassword(req.user!.userId, data);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertSiteSettingsSchema.parse(req.body);
      const updated = await settingsService.updateSettings(data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Routes pour les adresses de livraison
  app.get("/api/shipping-addresses", authenticate, async (req: AuthRequest, res) => {
    try {
      const addresses = await shippingAddressService.getUserAddresses(req.user!.userId);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shipping-addresses/default", authenticate, async (req: AuthRequest, res) => {
    try {
      const address = await shippingAddressService.getDefaultAddress(req.user!.userId);
      if (!address) {
        return res.status(404).json({ error: "No default address found" });
      }
      res.json(address);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shipping-addresses", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertShippingAddressSchema.parse(req.body);
      const address = await shippingAddressService.createAddress(req.user!.userId, data);
      res.status(201).json(address);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/shipping-addresses/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertShippingAddressSchema.partial().parse(req.body);
      const address = await shippingAddressService.updateAddress(req.params.id, req.user!.userId, data);
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/shipping-addresses/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await shippingAddressService.deleteAddress(req.params.id, req.user!.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.post("/api/shipping-addresses/:id/set-default", authenticate, async (req: AuthRequest, res) => {
    try {
      const address = await shippingAddressService.setDefaultAddress(req.params.id, req.user!.userId);
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/create-payment-intent", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { items, shippingAddress, shippingAddressId, currency = 'EUR', guestEmail } = req.body;

      console.log('📦 Payment Intent Request:', {
        itemsCount: items?.length,
        hasShippingAddress: !!shippingAddress,
        hasShippingAddressId: !!shippingAddressId,
        shippingAddressId,
      });

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart items are required" });
      }

      // Vérifier qu'on a soit une adresse complète, soit un ID d'adresse
      if (!shippingAddressId && (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName ||
        !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode)) {
        console.log('❌ Validation failed - Missing address data');
        return res.status(400).json({ error: "Shipping address is required" });
      }

      console.log('✅ Address validation passed');

      let stripeCustomerId: string | undefined = undefined;

      if (req.user) {
        const user = await userRepo.findById(req.user.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        stripeCustomerId = user.stripeCustomerId || undefined;

        // Vérifier si le customer ID stocké est toujours valide
        if (stripeCustomerId) {
          try {
            await stripe.customers.retrieve(stripeCustomerId);
          } catch (err: any) {
            console.warn(`⚠️  Stale Stripe customer ID ${stripeCustomerId}, creating new one...`);
            stripeCustomerId = undefined;
            await userRepo.update(user.id, { stripeCustomerId: null });
          }
        }

        if (!stripeCustomerId) {
          const existingCustomers = await stripe.customers.list({
            email: user.email,
            limit: 1,
          });

          if (existingCustomers.data.length > 0) {
            stripeCustomerId = existingCustomers.data[0].id;
          } else {
            const customer = await stripe.customers.create({
              email: user.email,
              name: user.name,
              metadata: {
                userId: user.id,
              },
            });
            stripeCustomerId = customer.id;
          }
          await userRepo.update(user.id, { stripeCustomerId });
        }
      }

      let totalAmount = 0;
      const productDetails = await Promise.all(
        items.map(async (item: { id: string; quantity: number }) => {
          const product = await productRepo.findById(item.id);
          if (!product) {
            throw new Error(`Product not found: ${item.id}`);
          }
          if (item.quantity < 1) {
            throw new Error(`Invalid quantity for product: ${item.id}`);
          }

          const itemTotal = parseFloat(product.price) * item.quantity;
          totalAmount += itemTotal;

          return {
            productId: product.id,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          };
        })
      );

      // Les prix en DB sont en EUR. Frais de livraison déjà en EUR (Shippo FR).
      const shippingCost = parseFloat(req.body.shippingCost || "0");
      const totalInEUR = totalAmount + shippingCost;

      // Conversion selon la devise demandée
      let finalAmount = totalInEUR;
      let finalCurrency = (currency as string).toLowerCase();

      if (currency !== 'EUR') {
        try {
          const ratesResponse = await fetch('http://localhost:5000/api/exchange-rates');
          const { rates } = await ratesResponse.json();
          finalAmount = totalInEUR * (rates[currency] || 1.0);
        } catch (error) {
          console.error('Failed to fetch exchange rates:', error);
          // Fallback sur EUR en cas d'erreur
          finalCurrency = 'eur';
        }
      }

      const paymentIntentOptions: Record<string, any> = {
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never", // Désactive Amazon Pay
        },
      };

      if (stripeCustomerId) {
        paymentIntentOptions.customer = stripeCustomerId;
        paymentIntentOptions.setup_future_usage = "off_session";
      } else if (guestEmail || shippingAddress?.email) {
        paymentIntentOptions.receipt_email = guestEmail || shippingAddress.email;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100),
        currency: finalCurrency,
        ...paymentIntentOptions,
        metadata: {
          userId: req.user?.userId || 'guest',
          guestEmail: guestEmail || '',
          items: JSON.stringify(productDetails),
          ...(shippingAddressId
            ? { shippingAddressId }
            : { shippingAddress: JSON.stringify(shippingAddress) }
          ),
          shippingCost: req.body.shippingCost || "0",
          shippingCarrier: req.body.shippingCarrier || "",
          shippingService: req.body.shippingService || "",
          estimatedDeliveryDays: req.body.estimatedDeliveryDays?.toString() || "0",
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        totalAmount: totalAmount.toFixed(2),
      });
    } catch (error: any) {
      console.error("Stripe payment intent error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/confirm-order", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const existingOrder = await orderRepo.findByPaymentIntentId(paymentIntentId);
      if (existingOrder) {
        return res.json({
          success: true,
          orderId: existingOrder.id,
          message: "Order already exists",
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not completed" });
      }

      const isGuest = paymentIntent.metadata.userId === 'guest';

      if (!isGuest && paymentIntent.metadata.userId !== req.user?.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const guestEmail = paymentIntent.metadata.guestEmail;

      // Sécuriser JSON.parse avec try/catch
      let items, shippingAddress;
      try {
        items = JSON.parse(paymentIntent.metadata.items);

        console.log('📦 Payment metadata:', {
          hasShippingAddressId: !!paymentIntent.metadata.shippingAddressId,
          hasShippingAddress: !!paymentIntent.metadata.shippingAddress,
          shippingAddressId: paymentIntent.metadata.shippingAddressId,
        });

        // Vérifier si on a un shippingAddressId
        const shippingAddressId = paymentIntent.metadata.shippingAddressId;
        if (shippingAddressId) {
          console.log('🔍 Fetching address from DB:', shippingAddressId);
          // Récupérer l'adresse depuis la base de données
          const savedAddress = await shippingAddressService.getAddressById(shippingAddressId, req.user!.userId);
          console.log('✅ Address fetched:', savedAddress);
          if (!savedAddress) {
            return res.status(400).json({ error: "Shipping address not found" });
          }
          shippingAddress = {
            firstName: savedAddress.firstName,
            lastName: savedAddress.lastName,
            address: savedAddress.address,
            addressLine2: savedAddress.addressLine2,
            city: savedAddress.city,
            postalCode: savedAddress.postalCode,
            country: savedAddress.country,
          };
          console.log('📍 Using saved address:', shippingAddress);
        } else {
          // Utiliser l'adresse depuis les metadata
          shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress || "{}");
          console.log('📍 Using metadata address:', shippingAddress);
        }
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid payment metadata" });
      }

      const totalAmount = (paymentIntent.amount / 100).toFixed(2);

      const order = await orderRepo.create({
        userId: isGuest ? null : req.user!.userId,
        guestEmail: isGuest ? guestEmail : null,
        totalAmount,
        discountAmount: "0",
        paymentIntentId,
        status: "CONFIRMED",
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        addressLine2: shippingAddress.addressLine2 || null,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "CH",
        // Informations de livraison Shippo
        shippingCost: paymentIntent.metadata.shippingCost || null,
        shippingCarrier: paymentIntent.metadata.shippingCarrier || null,
        shippingService: paymentIntent.metadata.shippingService || null,
        estimatedDeliveryDays: paymentIntent.metadata.estimatedDeliveryDays
          ? parseInt(paymentIntent.metadata.estimatedDeliveryDays)
          : null,
      });

      for (const item of items) {
        await orderRepo.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        });
      }

      // Sauvegarder l'adresse pour la prochaine fois si c'était une nouvelle adresse
      const shippingAddressId = paymentIntent.metadata.shippingAddressId;
      if (!isGuest && !shippingAddressId && shippingAddress) {
        try {
          // Vérifier si cette adresse n'existe pas déjà
          const existingAddresses = await shippingAddressService.getAddresses(req.user!.userId);
          const addressExists = existingAddresses.some((addr: any) =>
            addr.address === shippingAddress.address &&
            addr.city === shippingAddress.city &&
            addr.postalCode === shippingAddress.postalCode
          );

          if (!addressExists) {
              await shippingAddressService.createAddress(req.user!.userId, {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                address: shippingAddress.address,
                addressLine2: shippingAddress.addressLine2 || null,
                city: shippingAddress.city,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country || "FR",
                isDefault: existingAddresses.length === 0,
              });
              console.log('✅ Adresse sauvegardée pour la prochaine commande');
          }
        } catch (saveError) {
          console.error('⚠️ Erreur sauvegarde adresse:', saveError);
          // Ne pas bloquer la commande si la sauvegarde échoue
        }
      }

      // Envoi de l'email de confirmation
      let emailAddress = guestEmail;
      let userName = guestEmail;
      
      if (!isGuest && req.user) {
        const user = await userRepo.findById(req.user.userId);
        if (user) {
          emailAddress = user.email;
          userName = user.firstName || user.name;
        }
      }
      
      if (emailAddress) {
         await emailService.sendOrderConfirmationEmail(order, emailAddress, userName);
      }

      res.json({
        success: true,
        orderId: order.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shipping routes
  app.post("/api/shipping/rates", optionalAuth, async (req: AuthRequest, res) => {
    try {
      console.log('📦 Shipping rates request received');
      console.log('  Body:', JSON.stringify(req.body, null, 2));

      const { address, itemCount } = req.body;

      if (!address || !address.name || !address.street1 || !address.city || !address.zip || !address.country) {
        console.log('  ❌ Invalid address');
        return res.status(400).json({ error: "Complete shipping address is required" });
      }

      if (!itemCount || itemCount < 1) {
        console.log('  ❌ Invalid item count');
        return res.status(400).json({ error: "Item count is required" });
      }

      console.log('  ✅ Calling shippingService.getShippingRates...');
      const rates = await shippingService.getShippingRates(address, itemCount);
      console.log('  ✅ Rates received:', rates.length);
      res.json(rates);
    } catch (error: any) {
      console.error("❌ Shipping rates error:", error);
      res.status(500).json({ error: error.message || "Failed to get shipping rates" });
    }
  });

  // Reviews routes
  app.get("/api/reviews/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const result = await reviewService.getProductReviews(productId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reviews", authenticate, async (req: AuthRequest, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const review = await reviewService.createReview(req.user!.userId, data);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
  app.get("/api/reviews/:productId/user-review", authenticate, async (req: AuthRequest, res) => {
    try {
      const review = await reviewRepo.findByUserAndProduct(req.user!.userId, req.params.productId);
      res.json({ hasReview: !!review, review });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Support Routes
  app.post("/api/support/message", async (req, res) => {
    try {
      const data = insertSupportMessageSchema.parse(req.body);
      const message = await supportRepo.createMessage(data);

      // Notification email à l'admin
      await emailService.sendSupportNotificationToAdmin(data.name, data.email, data.message);

      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/support/messages", authenticate, requireAdmin, async (req, res) => {
    try {
      const messages = await supportRepo.getAllMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/support/messages/:id/read", authenticate, requireAdmin, async (req, res) => {
    try {
      const message = await supportRepo.markAsRead(req.params.id);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/support/reply", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id, replyContent } = req.body;
      if (!id || !replyContent) return res.status(400).json({ error: "id and replyContent required" });

      const originalMessage = await supportRepo.findById(id);
      if (!originalMessage) return res.status(404).json({ error: "Message not found" });

      // Envoi de la réponse au client via Resend
      const success = await emailService.sendSupportReplyToCustomer(
        originalMessage.name,
        originalMessage.email,
        replyContent,
        originalMessage.message
      );

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
      }

      const updatedMessage = await supportRepo.markAsReplied(id);
      res.json(updatedMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
