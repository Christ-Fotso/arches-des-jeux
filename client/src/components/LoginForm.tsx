import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home } from "lucide-react";

// Fonction pour formater les messages d'erreur
function formatErrorMessage(error: string): string {
  if (error.includes("Invalid credentials") || error.includes("401")) {
    return "Email ou mot de passe incorrect. Veuillez réessayer.";
  }
  if (error.includes("Network") || error.includes("fetch")) {
    return "Erreur de connexion. Vérifiez votre connexion internet.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  error?: string;
  isLoading?: boolean;
}

export default function LoginForm({ onSubmit, error, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-2xl font-serif" data-testid="text-login-title">
              {t("auth.login")}
            </CardTitle>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </Link>
          </div>
          <CardDescription>
            {t("home.title")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="text-error">
                {formatErrorMessage(error)}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                  <span className="text-xs text-primary hover:text-primary/80 cursor-pointer">
                    Mot de passe oublié ?
                  </span>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit-login"
            >
              {isLoading ? t("common.loading") : t("auth.signIn")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("auth.noAccount")} </span>
            <Link href="/register">
              <span className="text-primary hover:underline cursor-pointer" data-testid="link-register">
                {t("auth.register")}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
