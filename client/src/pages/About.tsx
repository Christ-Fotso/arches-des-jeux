import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-serif font-bold mb-8 text-center text-primary">
            {t("nav.about")}
          </h1>

          <div className="space-y-8">
            <Card className="border-none shadow-md overflow-hidden relative">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">{t("about.story.title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t("about.story.p1")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t("about.story.p2")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-primary/5">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">{t("about.mission.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("about.mission.text")}
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
