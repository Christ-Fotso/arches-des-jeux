import fs from "fs";
interface ShippingAddress {
    name: string;
    street1: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
}

interface ParcelDimensions {
    length: number;
    width: number;
    height: number;
    weight: number; // in grams
}

interface ShippingRate {
    carrier: string;
    service: string;
    amount: string;
    currency: string;
    estimatedDays: number;
    rateId: string;
}

export class ShippingService {
    private apiKey: string = '';
    private warehouseAddress: any;

    constructor() {
        let apiKey = process.env.SHIPPO_PRIVATE_KEY;
        const secretPath = "/run/secrets/shippo_private_key";
        if (fs.existsSync(secretPath)) {
            apiKey = fs.readFileSync(secretPath, "utf8").trim();
        }

        if (!apiKey) {
            console.warn('⚠️  SHIPPO_PRIVATE_KEY is not defined. Shipping rates will not be available.');
        } else {
            this.apiKey = apiKey;
        }

        // Adresse d'expédition par défaut
        this.warehouseAddress = {
            name: 'BeautyShop',
            street1: '4 rue Nelson Mandela',
            city: 'Deuil-la-Barre',
            zip: '95170',
            country: 'FR',
        };
    }

    /**
     * Calcule les dimensions et le poids du colis selon le nombre de produits
     */
    private calculateParcelDimensions(itemCount: number): ParcelDimensions {
        let length, width, height;

        if (itemCount === 1) {
            length = 10;
            width = 10;
            height = 10;
        } else if (itemCount === 2) {
            length = 10;
            width = 10;
            height = 15;
        } else {
            length = 10;
            width = 15;
            height = 15;
        }

        // Poids: 250g de base + 250g par produit
        const weight = 250 + (itemCount * 250);

        return { length, width, height, weight };
    }

    /**
     * Obtient les tarifs de livraison depuis Shippo via API REST
     */
    async getShippingRates(
        toAddress: ShippingAddress,
        itemCount: number
    ): Promise<ShippingRate[]> {
        if (toAddress.country === 'FR') {
            return [{
                carrier: 'Standard',
                service: 'Livraison Standard',
                amount: '5.00',
                currency: 'EUR',
                estimatedDays: 3,
                rateId: 'fixed-fr-rate'
            }];
        }

        if (!this.apiKey) {
            return [{
                carrier: 'Standard',
                service: 'Livraison Internationale',
                amount: '10.00',
                currency: 'EUR',
                estimatedDays: 4,
                rateId: 'fallback-rate'
            }];
        }

        try {
            const parcel = this.calculateParcelDimensions(itemCount);
            const response = await fetch('https://api.goshippo.com/shipments', {
                method: 'POST',
                headers: {
                    'Authorization': `ShippoToken ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address_from: this.warehouseAddress,
                    address_to: toAddress,
                    parcels: [{
                        length: parcel.length.toString(),
                        width: parcel.width.toString(),
                        height: parcel.height.toString(),
                        distance_unit: 'cm',
                        weight: parcel.weight.toString(),
                        mass_unit: 'g',
                    }],
                    async: false,
                }),
            });

            if (!response.ok) throw new Error('Shippo API failed');

            const shipment = await response.json();
            const forbidden = ['relais', 'relay', 'pickup', 'point', 'locker'];
            
            const rates: ShippingRate[] = shipment.rates
                .filter((r: any) => {
                    const name = (r.servicelevel?.name || '').toLowerCase();
                    return !forbidden.some(f => name.includes(f));
                })
                .map((r: any) => ({
                    carrier: r.provider || 'Unknown',
                    service: r.servicelevel?.name || 'Standard',
                    amount: r.amount,
                    currency: r.currency,
                    estimatedDays: 4,
                    rateId: r.object_id,
                }));

            return rates.length > 0 ? rates : [{
                carrier: 'Standard',
                service: 'Livraison Internationale',
                amount: '10.00',
                currency: 'EUR',
                estimatedDays: 4,
                rateId: 'fallback-rate'
            }];
        } catch (error) {
            return [{
                carrier: 'Standard',
                service: 'Livraison Internationale',
                amount: '10.00',
                currency: 'EUR',
                estimatedDays: 4,
                rateId: 'fallback-rate'
            }];
        }
    }

    /**
     * Convertit le montant en CHF (si nécessaire)
     */
    convertToCHF(amount: string, currency: string): number {
        const numAmount = parseFloat(amount);

        if (currency === 'CHF') {
            return numAmount;
        } else if (currency === 'EUR') {
            return numAmount * 1.05;
        } else if (currency === 'USD') {
            return numAmount * 0.88;
        }

        return numAmount;
    }
}

export const shippingService = new ShippingService();
