import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export interface ReviewWithUser {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
}

interface ReviewCarouselProps {
  reviews: ReviewWithUser[];
  className?: string;
}

export default function ReviewCarousel({ reviews, className }: ReviewCarouselProps) {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!reviews || reviews.length === 0) {
    return null; // On ne montre rien s'il n'y a pas d'avis
  }

  // Format de la date localisé
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className={cn("w-full py-10", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Avis de nos clients</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 fill-current" />
            ))}
          </div>
          <span className="font-medium text-lg">4.9/5</span>
          <span className="text-muted-foreground ml-1">({reviews.length} avis Google)</span>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent className="-ml-4 md:-ml-6">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="h-full border-2 border-primary/5 hover:border-primary/20 transition-colors shadow-sm">
                    <CardContent className="flex flex-col h-full p-6">
                      
                      {/* En-tête de l'avis */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg">{review.userName}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                        </div>
                        {/* Petit logo "G" de Google Maps pour faire pro */}
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                      </div>

                      {/* Étoiles */}
                      <div className="flex text-yellow-400 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < review.rating ? "fill-current" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>

                      {/* Commentaire */}
                      <p className="text-gray-700 italic flex-grow text-sm leading-relaxed">
                        "{review.comment}"
                      </p>
                      
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-12 bg-white hover:bg-gray-100" />
            <CarouselNext className="-right-12 bg-white hover:bg-gray-100" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
