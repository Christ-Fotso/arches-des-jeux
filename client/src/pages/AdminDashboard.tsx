import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Tag,
  Percent,
  ShoppingCart,
  TrendingUp,
  Loader2
} from "lucide-react";

interface Order {
    id: string;
    userId: string;
    status: string;
    totalAmount: string;
    createdAt: string;
}

const dashboardCards = [
  {
    title: "Produits",
    description: "Gérer les produits",
    icon: Package,
    href: "/admin/products",
    color: "text-blue-600"
  },
  {
    title: "Marques",
    description: "Gérer les marques",
    icon: Tag,
    href: "/admin/brands",
    color: "text-purple-600"
  },
  {
    title: "Promotions",
    description: "Codes promo et réductions",
    icon: Percent,
    href: "/admin/discounts",
    color: "text-green-600"
  },
  {
    title: "Commandes",
    description: "Voir les commandes",
    icon: ShoppingCart,
    href: "/admin/orders",
    color: "text-orange-600"
  },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [monthsFilter, setMonthsFilter] = useState<number>(6);

  const { data: orders, isLoading } = useQuery<Order[]>({
      queryKey: ["/api/orders"],
      queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    // Ne rediriger que si user est défini mais n'est pas admin
    // user === null = non chargé encore, on attend
    if (user === null) return;
    if (user.role?.toUpperCase() !== 'ADMIN') {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const stats = useMemo(() => {
      if (!orders) return [];
      
      const now = new Date();
      const result = [];
      
      for (let i = monthsFilter - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          // e.g. "mars 26"
          const monthLabel = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
          
          let monthTotal = 0;
          let count = 0;
          
          orders.forEach(o => {
              const orderDate = new Date(o.createdAt);
              if (orderDate.getFullYear() === d.getFullYear() && orderDate.getMonth() === d.getMonth()) {
                  // Only count if order is not cancelled
                  if (o.status !== 'CANCELLED') {
                      monthTotal += parseFloat(o.totalAmount || "0");
                      count++;
                  }
              }
          });
          
          result.push({ label: monthLabel, total: monthTotal, count });
      }
      return result;
  }, [orders, monthsFilter]);

  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    return null;
  }

  const maxTotal = stats.length > 0 ? Math.max(...stats.map(s => s.total), 1) : 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user.name}
          </p>
        </div>

        {/* Cartes cliquables - Responsive */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <a>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <Icon className={`w-8 h-8 ${card.color}`} />
                      </div>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Statistiques des commandes */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Récapitulatif des commandes (Chiffre d'affaires)
                    </CardTitle>
                    <CardDescription>
                        Évolution du chiffre d'affaires sur les derniers mois
                    </CardDescription>
                </div>
                <div className="w-40">
                    <Select
                        value={monthsFilter.toString()}
                        onValueChange={(val) => setMonthsFilter(parseInt(val))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">6 derniers mois</SelectItem>
                            <SelectItem value="12">12 derniers mois</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="mt-4">
                        <div className="flex items-end gap-2 h-64 mt-4 overflow-x-auto pb-2">
                            {stats.map((s, idx) => {
                                const heightPercentage = (s.total / maxTotal) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end min-w-[50px] group">
                                        {/* Info bulle au survol (simulée avec opacity) */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs text-center bg-black/80 text-white p-1 rounded whitespace-nowrap z-10">
                                            {s.count} cmdes<br/>
                                            € {s.total.toFixed(2)}
                                        </div>
                                        {/* Barre */}
                                        <div 
                                            className="w-full bg-primary/80 hover:bg-primary transition-colors rounded-t-sm"
                                            style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                                        ></div>
                                        {/* Label mois */}
                                        <div className="text-xs text-muted-foreground mt-2 rotate-45 origin-left md:rotate-0 translate-y-2 md:translate-y-0 text-center uppercase">
                                            {s.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
