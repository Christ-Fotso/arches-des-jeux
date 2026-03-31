import { ShippingAddressRepository } from "../repositories/shipping-address.repository";
import type { ShippingAddress, InsertShippingAddress } from "@shared/schema";

export class ShippingAddressService {
    private repository: ShippingAddressRepository;

    constructor(repository: ShippingAddressRepository) {
        this.repository = repository;
    }

    async getUserAddresses(userId: string): Promise<ShippingAddress[]> {
        return await this.repository.findByUserId(userId);
    }

    async getDefaultAddress(userId: string): Promise<ShippingAddress | undefined> {
        return await this.repository.findDefaultByUserId(userId);
    }

    async getAddressById(id: string, userId: string): Promise<ShippingAddress> {
        const address = await this.repository.findById(id);
        if (!address) {
            throw new Error("Address not found");
        }
        if (address.userId !== userId) {
            throw new Error("Unauthorized");
        }
        return address;
    }

    async createAddress(userId: string, data: InsertShippingAddress): Promise<ShippingAddress> {
        // Si c'est la première adresse, la définir comme par défaut
        const existingAddresses = await this.repository.findByUserId(userId);
        const isFirstAddress = existingAddresses.length === 0;

        return await this.repository.create({
            ...data,
            userId,
            isDefault: data.isDefault ?? isFirstAddress,
        });
    }

    async updateAddress(id: string, userId: string, data: Partial<InsertShippingAddress>): Promise<ShippingAddress> {
        const updated = await this.repository.update(id, userId, data);
        if (!updated) {
            throw new Error("Address not found or unauthorized");
        }
        return updated;
    }

    async deleteAddress(id: string, userId: string): Promise<void> {
        const success = await this.repository.delete(id, userId);
        if (!success) {
            throw new Error("Address not found or unauthorized");
        }
    }

    async setDefaultAddress(id: string, userId: string): Promise<ShippingAddress> {
        const updated = await this.repository.setAsDefault(id, userId);
        if (!updated) {
            throw new Error("Address not found or unauthorized");
        }
        return updated;
    }

    /**
     * Sauvegarde ou met à jour une adresse depuis les données de checkout
     * Retourne l'ID de l'adresse sauvegardée
     */
    async saveFromCheckout(userId: string, addressData: {
        firstName: string;
        lastName: string;
        address: string;
        addressLine2?: string;
        city: string;
        postalCode: string;
        country: string;
    }): Promise<string> {
        // Vérifier si une adresse identique existe déjà
        const existingAddresses = await this.repository.findByUserId(userId);
        const matchingAddress = existingAddresses.find(addr =>
            addr.address === addressData.address &&
            addr.city === addressData.city &&
            addr.postalCode === addressData.postalCode &&
            addr.country === addressData.country
        );

        if (matchingAddress) {
            // Mettre à jour l'adresse existante
            await this.repository.update(matchingAddress.id, userId, {
                firstName: addressData.firstName,
                lastName: addressData.lastName,
                addressLine2: addressData.addressLine2,
            });
            return matchingAddress.id;
        }

        // Créer une nouvelle adresse
        const newAddress = await this.repository.create({
            userId,
            label: "Adresse de livraison",
            ...addressData,
            isDefault: existingAddresses.length === 0, // Première adresse = par défaut
        });

        return newAddress.id;
    }
}
