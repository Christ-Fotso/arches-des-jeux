import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);

    // Pré-remplir l'email si passé en paramètre depuis la page de login
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, []);

    const forgotPasswordMutation = useMutation({
        mutationFn: async (email: string) => {
            const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
            return await res.json();
        },
        onSuccess: () => {
            setSuccess(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        forgotPasswordMutation.mutate(email);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-serif text-center">
                            Email envoyé !
                        </CardTitle>
                        <CardDescription className="text-center">
                            Vérifiez votre boîte de réception
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Si un compte avec l'adresse <strong>{email}</strong> est enregistré chez nous,
                            vous recevrez un email avec un lien de réinitialisation.
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                            Le lien expire dans 1 heure. Pensez à vérifier vos spams.
                        </p>
                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour à la connexion
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">
                        Mot de passe oublié
                    </CardTitle>
                    <CardDescription>
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {forgotPasswordMutation.error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                Une erreur est survenue. Veuillez réessayer.
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={forgotPasswordMutation.isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                Si un compte avec cet email existe, vous recevrez un lien de réinitialisation.
                            </p>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={forgotPasswordMutation.isPending}
                        >
                            {forgotPasswordMutation.isPending ? "Envoi..." : "Envoyer le lien"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link href="/login">
                            <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                                <ArrowLeft className="w-3 h-3 inline mr-1" />
                                Retour à la connexion
                            </span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
