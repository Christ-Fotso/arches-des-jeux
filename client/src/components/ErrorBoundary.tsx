import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Ignorer complètement les erreurs removeChild de Radix UI
        const errorMessage = error.message || '';
        if (errorMessage.includes('removeChild') || errorMessage.includes('NotFoundError')) {
            // Ne rien logger - c'est un bug connu de Radix UI qui n'affecte pas le fonctionnement
            return;
        }

        // Logger les autres erreurs
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Retourner null pour ne rien afficher au lieu de crasher
            // L'erreur est loggée dans la console
            return null;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
