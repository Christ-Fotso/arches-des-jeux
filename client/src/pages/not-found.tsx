import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-primary/10">
            <Compass className="w-16 h-16 text-primary animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-serif font-bold tracking-tight text-primary">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("notfound.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("notfound.subtitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("notfound.description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
                {t("notfound.backHome")}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
