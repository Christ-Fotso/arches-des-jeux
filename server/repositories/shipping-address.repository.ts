import { db } from "../db";
import { shippingAddresses } from "@shared/schema";
import type { ShippingAddress, InsertShippingAddress } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class ShippingAddressRepository {
    async findById(id: string): Promise<ShippingAddress | undefined> {
        const [address] = await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.id, id))
            .limit(1);
        return address;
    }

    async findByUserId(userId: string): Promise<ShippingAddress[]> {
        return await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.userId, userId))
            .orderBy(desc(shippingAddresses.isDefault), desc(shippingAddresses.createdAt));
    }

    async findDefaultByUserId(userId: string): Promise<ShippingAddress | undefined> {
        const [address] = await db
            .select()
            .from(shippingAddresses)
            .where(
                and(
                    eq(shippingAddresses.userId, userId),
                    eq(shippingAddresses.isDefault, true)
                )
            )
            .limit(1);
        return address;
    }

    async create(data: InsertShippingAddress & { userId: string }): Promise<ShippingAddress> {
        // Si c'est l'adresse par défaut, désactiver les autres
        if (data.isDefault) {
            await db
                .update(shippingAddresses)
                .set({ isDefault: false })
                .where(eq(shippingAddresses.userId, data.userId));
        }

        const [address] = await db
            .insert(shippingAddresses)
            .values(data)
            .returning();
        return address;
    }

    async update(id: string, userId: string, data: Partial<InsertShippingAddress>): Promise<ShippingAddress | undefined> {
        // Si on définit comme adresse par défaut, désactiver les autres
        if (data.isDefault) {
            await db
                .update(shippingAddresses)
                .set({ isDefault: false })
                .where(eq(shippingAddresses.userId, userId));
        }

        const [updated] = await db
            .update(shippingAddresses)
            .set({ ...data, updatedAt: new Date() })
            .where(
                and(
                    eq(shippingAddresses.id, id),
                    eq(shippingAddresses.userId, userId)
                )
            )
            .returning();
        return updated;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await db
            .delete(shippingAddresses)
            .where(
                and(
                    eq(shippingAddresses.id, id),
                    eq(shippingAddresses.userId, userId)
                )
            );
        return result.rowCount !== null && result.rowCount > 0;
    }

    async setAsDefault(id: string, userId: string): Promise<ShippingAddress | undefined> {
        // Désactiver toutes les adresses par défaut de l'utilisateur
        await db
            .update(shippingAddresses)
            .set({ isDefault: false })
            .where(eq(shippingAddresses.userId, userId));

        // Activer celle-ci
        const [updated] = await db
            .update(shippingAddresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(
                and(
                    eq(shippingAddresses.id, id),
                    eq(shippingAddresses.userId, userId)
                )
            )
            .returning();
        return updated;
    }
}
