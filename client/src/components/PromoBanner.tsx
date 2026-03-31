import { useQuery } from "@tanstack/react-query";

interface PublicPromo {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: string;
}

export default function PromoBanner() {
  const { data: promos = [] } = useQuery<PublicPromo[]>({
    queryKey: ["/api/discount/public-promos"],
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  if (promos.length === 0) return null;

  // On triplique les items pour avoir un défilement parfaitement continu
  const items = [...promos, ...promos, ...promos];

  return (
    <>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 20s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="w-full overflow-hidden bg-primary text-primary-foreground py-2 text-sm font-medium select-none"
        aria-label="Promotions en cours"
      >
        <div className="marquee-track">
          {items.map((promo, i) => (
            <span key={`${promo.id}-${i}`} className="flex items-center gap-3 px-8 whitespace-nowrap">
              <span className="font-bold tracking-wide bg-white/20 px-2 py-0.5 rounded">
                {promo.code}
              </span>
              <span>
                {promo.description ||
                  (promo.type === "PERCENTAGE"
                    ? `${promo.value}% de réduction`
                    : `${promo.value} € de réduction`)}
              </span>
              <span className="opacity-40 mx-1">✦</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
