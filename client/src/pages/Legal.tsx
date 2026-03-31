import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Legal() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-serif font-bold mb-8 text-center">
            {t("legal.title")}
          </h1>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("legal.companyInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  <strong>{t("legal.companyName")}:</strong> L'Arche des jeux SAS
                </p>
                <p>
                  <strong>{t("legal.address")}:</strong> 123 Rue de Rivoli, 75001 Paris, France
                </p>
                <p>
                  <strong>{t("support.email")}:</strong> contact@larchedesjeux.com
                </p>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("legal.terms")}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>{t("legal.terms1Title")}</h3>
                <p>
                  {t("legal.terms1Text")}
                </p>

                <h3>{t("legal.terms2Title")}</h3>
                <p>
                  {t("legal.terms2Text")}
                </p>

                <h3>{t("legal.terms3Title")}</h3>
                <p>
                  {t("legal.terms3Text")}
                </p>

                <h3>{t("legal.terms4Title")}</h3>
                <p>
                  {t("legal.terms4Text")}
                </p>

                <h3>{t("legal.terms5Title")}</h3>
                <p>
                  {t("legal.terms5Text")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("legal.privacyTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h3>{t("legal.privacy1Title")}</h3>
                <p>
                  {t("legal.privacy1Text")}
                </p>

                <h3>{t("legal.privacy2Title")}</h3>
                <p>
                  {t("legal.privacy2Text")}
                </p>

                <h3>{t("legal.privacy3Title")}</h3>
                <p>
                  {t("legal.privacy3Text")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
