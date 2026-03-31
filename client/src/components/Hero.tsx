import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export default function Hero({
  title = "L'Arche des jeux",
  subtitle = "Explorez la Bible en famille avec nos jeux éducatifs et interactifs",
  ctaText = "Voir le jeu",
  ctaLink = "/products",
  backgroundImage,
}: HeroProps) {
  const isHashLink = ctaLink.startsWith("#");

  const handleClick = () => {
    if (isHashLink) {
      const targetId = ctaLink.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative h-96 md:h-screen w-full overflow-hidden">
      {backgroundImage && (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>
      )}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl">
          <h1
            className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white"
            data-testid="text-hero-title"
          >
            {title}
          </h1>
          <p
            className="text-xl md:text-2xl mb-8 text-white/90"
            data-testid="text-hero-subtitle"
          >
            {subtitle}
          </p>
          {isHashLink ? (
            <Button
              size="lg"
              variant="default"
              className="backdrop-blur-md bg-primary hover:bg-primary/90 text-xl px-8 py-6 border-none"
              data-testid="button-hero-cta"
              onClick={handleClick}
            >
              {ctaText}
            </Button>
          ) : (
            <Link href={ctaLink}>
              <Button
                size="lg"
                variant="default"
                className="backdrop-blur-md bg-primary hover:bg-primary/90 text-xl px-8 py-6 border-none"
                data-testid="button-hero-cta"
              >
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
