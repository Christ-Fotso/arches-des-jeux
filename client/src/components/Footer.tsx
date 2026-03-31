import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/favicon.png" alt="L'Arche des jeux" className="w-10 h-10 rounded-full" />
              <h3 className="font-serif text-2xl font-bold tracking-tight">L'Arche des jeux</h3>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/products" data-testid="link-footer-products">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  {t("footer.products")}
                </span>
              </Link>
              <Link href="/about" data-testid="link-footer-about">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  {t("nav.about")}
                </span>
              </Link>
              <Link href="/support" data-testid="link-footer-support">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  {t("footer.support")}
                </span>
              </Link>
              <Link href="/legal" data-testid="link-footer-legal">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  {t("footer.legal")}
                </span>
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-primary">{t("footer.contact")}</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("footer.email")}: <a href="mailto:contact@larchedesjeux.com" className="hover:text-primary transition-colors">contact@larchedesjeux.com</a>
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://www.instagram.com/larche_des_jeux?igsh=MWt5dTM1ajNkd3NwaQ%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform inline-block"
                aria-label="Instagram"
                title="Instagram"
              >
                <img src="/uploads/insta.png" alt="Instagram" className="w-8 h-8 object-contain" />
              </a>
              <a
                href="https://www.tiktok.com/@larche_des_jeux?_r=1&_t=ZN-9595SZkInag"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform inline-block"
                aria-label="TikTok"
                title="TikTok"
              >
                <img src="/uploads/tiktok.png" alt="TikTok" className="w-8 h-8 object-contain" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">
            © {currentYear} L'Arche des jeux. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
