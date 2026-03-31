import { useState, useEffect } from 'react';

interface ConversionRates {
    EUR: number;
    CHF: number;
    USD: number;
    GBP: number;
}

export function useCurrencyConversion() {
    const [rates, setRates] = useState<ConversionRates>({
        EUR: 1.00,   // Base - les prix sont stockés en EUR
        CHF: 0.93,   // 1 EUR ≈ 0.93 CHF
        USD: 1.10,   // 1 EUR ≈ 1.10 USD
        GBP: 0.85,   // 1 EUR ≈ 0.85 GBP
    });

    useEffect(() => {
        // Récupérer les taux en temps réel depuis l'API
        const fetchRates = async () => {
            try {
                const response = await fetch('/api/exchange-rates');
                if (response.ok) {
                    const data = await response.json();
                    setRates(data.rates);
                }
            } catch (error) {
                console.error('Failed to fetch exchange rates:', error);
                // Garder les taux par défaut
            }
        };

        fetchRates();
        // Mettre à jour toutes les 30 minutes
        const interval = setInterval(fetchRates, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Les prix en DB sont en EUR - pas de conversion nécessaire pour EUR
    const convertPrice = (priceInEUR: number, targetCurrency: keyof ConversionRates) => {
        return priceInEUR * rates[targetCurrency];
    };

    const getCurrencySymbol = (currency: keyof ConversionRates) => {
        const symbols: Record<string, string> = {
            EUR: '€',
            CHF: 'CHF',
            USD: '$',
            GBP: '£',
        };
        return symbols[currency] || currency;
    };

    return { rates, convertPrice, getCurrencySymbol };
}
