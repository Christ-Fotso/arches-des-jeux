import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Package, User, Calendar, CreditCard } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";

interface Order {
    id: string;
    userId: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    trackingNumber?: string;
    userName: string;
    userEmail: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    items?: Array<{
        productId: string;
        quantity: number;
        priceAtPurchase: string;
    }>;
}

export default function AdminOrders() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!user || user.role?.toUpperCase() !== 'ADMIN') {
            setLocation("/");
        }
    }, [user, setLocation]);

    if (!user) {
        return null;
    }

    return (
        <AdminLayout>
            <OrdersTab />
        </AdminLayout>
    );
}

function OrdersTab() {
    const { toast } = useToast();

    const { data: orders, isLoading } = useQuery<(Order & { userName?: string; userEmail?: string; guestEmail?: string | null })[]>({
        queryKey: ["/api/orders"],
    });

    const updateOrder = useMutation({
        mutationFn: async ({ id, status, trackingNumber }: { id: string; status: string; trackingNumber?: string }) => {
            await apiRequest("PATCH", `/api/orders/${id}/status`, { status, trackingNumber });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({ title: "Commande mise à jour avec succès" });
        },
        onError: (error: any) => {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-500";
            case "PROCESSING":
                return "bg-blue-500";
            case "SHIPPED":
                return "bg-purple-500";
            case "DELIVERED":
                return "bg-green-500";
            case "CANCELLED":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING":
                return "En attente";
            case "PROCESSING":
                return "En traitement";
            case "SHIPPED":
                return "Expédiée";
            case "DELIVERED":
                return "Livrée";
            case "CANCELLED":
                return "Annulée";
            default:
                return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
            </div>

            {isLoading ? (
                <div className="text-center py-12">Chargement...</div>
            ) : orders && orders.length === 0 ? (
                <Card>
                    <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                            Aucune commande pour le moment
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {orders?.map((order) => (
                        <Card key={order.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">Commande #{order.id.slice(0, 8)}</CardTitle>
                                            <Badge className={getStatusColor(order.status)}>
                                                {getStatusLabel(order.status)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="w-4 h-4" />
                                                <div className="flex flex-col">
                                                  <span>{order.userName || "Invité"}</span>
                                                  <span className="text-xs">{order.userEmail || order.guestEmail || "Email non fourni"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CreditCard className="w-4 h-4" />
                                                <span className="font-semibold">€ {order.totalAmount}</span>
                                            </div>
                                            {order.trackingNumber && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Package className="w-4 h-4" />
                                                    <span>Suivi: {order.trackingNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-48">
                                        <Select
                                            value={order.status}
                                            onValueChange={(newStatus) =>
                                                updateOrder.mutate({ id: order.id, status: newStatus })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">En attente</SelectItem>
                                                <SelectItem value="PROCESSING">En traitement</SelectItem>
                                                <SelectItem value="SHIPPED">Expédiée</SelectItem>
                                                <SelectItem value="DELIVERED">Livrée</SelectItem>
                                                <SelectItem value="CANCELLED">Annulée</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>

                            {((order.items && order.items.length > 0) || order.address) && (
                                <CardContent className="pt-0 border-t mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        {order.items && order.items.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    <Package className="w-4 h-4" /> Articles
                                                </p>
                                                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                                                            <span>Produit {item.productId.slice(0, 8)}</span>
                                                            <span className="font-medium">
                                                                {item.quantity} × € {item.priceAtPurchase}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {order.address && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    <Package className="w-4 h-4" /> Adresse de livraison
                                                </p>
                                                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground leading-relaxed">
                                                    <p className="font-medium text-foreground">{order.firstName} {order.lastName}</p>
                                                    <p>{order.address}</p>
                                                    {order.addressLine2 && <p>{order.addressLine2}</p>}
                                                    <p>{order.postalCode} {order.city}</p>
                                                    <p>{order.country}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
