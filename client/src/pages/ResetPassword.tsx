import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle } from "lucide-react";

export default function ResetPassword() {
    const [, params] = useRoute("/reset-password/:token");
    const [, setLocation] = useLocation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const resetPasswordMutation = useMutation({
        mutationFn: async (data: { token: string; password: string }) => {
            const res = await apiRequest("POST", `/api/auth/reset-password/${data.token}`, {
                password: data.password,
            });
            return await res.json();
        },
        onSuccess: () => {
            setSuccess(true);
            setTimeout(() => {
                setLocation("/login");
            }, 3000);
        },
        onError: (err: any) => {
            setError(err.message || "Le lien de réinitialisation est invalide ou expiré.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!params?.token) {
            setError("Token de réinitialisation manquant.");
            return;
        }

        resetPasswordMutation.mutate({ token: params.token, password });
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-serif text-center">
                            Mot de passe réinitialisé !
                        </CardTitle>
                        <CardDescription className="text-center">
                            Vous allez être redirigé vers la page de connexion...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">
                        Nouveau mot de passe
                    </CardTitle>
                    <CardDescription>
                        Définissez votre nouveau mot de passe
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={resetPasswordMutation.isPending}
                                minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum 6 caractères
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={resetPasswordMutation.isPending}
                                minLength={6}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={resetPasswordMutation.isPending}
                        >
                            {resetPasswordMutation.isPending ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
