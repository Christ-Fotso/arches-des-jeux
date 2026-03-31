import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import AdminLayout from "@/layouts/AdminLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";

const createDiscountSchema = z.object({
  code: z.string().min(3, "Le code doit contenir au moins 3 caractères").toUpperCase(),
  description: z.string().max(200).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive("La valeur doit être positive"),
  isSingleUse: z.boolean().default(false),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
});

type CreateDiscountForm = z.infer<typeof createDiscountSchema>;

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: string;
  isSingleUse: boolean;
  isActive: boolean;
  showOnHome: boolean;
  usedBy: string | null;
  createdAt: string;
}

export default function DiscountManagement() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);

  const isAuthorized = !!(user && isAdmin);

  const { data: discounts = [], isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/discount"],
    enabled: isAuthorized,
  });

  const form = useForm<CreateDiscountForm>({
    resolver: zodResolver(createDiscountSchema),
    defaultValues: {
      code: "",
      description: "",
      type: "PERCENTAGE",
      value: 0,
      isSingleUse: false,
      isActive: true,
      showOnHome: false,
    },
  });

  const createDiscount = useMutation({
    mutationFn: async (data: CreateDiscountForm) => {
      const payload = {
        ...data,
        value: data.value.toString(),
      };
      await apiRequest("POST", "/api/discount", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount"] });
      toast({ title: "Code promo créé avec succès" });
      form.reset();
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le code promo",
        variant: "destructive",
      });
    },
  });

  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/discount/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount"] });
      toast({ title: "Code promo supprimé" });
    },
  });

  const updateDiscount = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateDiscountForm }) => {
      const payload = {
        ...data,
        value: data.value.toString(),
      };
      await apiRequest("PUT", `/api/discount/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount"] });
      toast({ title: "Code promo modifié avec succès" });
      setEditingDiscount(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le code promo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateDiscountForm) => {
    if (editingDiscount) {
      updateDiscount.mutate({ id: editingDiscount.id, data });
    } else {
      createDiscount.mutate(data);
    }
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    form.reset({
      code: discount.code,
      description: discount.description || "",
      type: discount.type as "PERCENTAGE" | "FIXED",
      value: parseFloat(discount.value),
      isSingleUse: discount.isSingleUse,
      isActive: discount.isActive,
      showOnHome: discount.showOnHome,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingDiscount(null);
    form.reset();
    setShowForm(false);
  };

  useEffect(() => {
    if (!isAuthorized) {
      setLocation("/");
    }
  }, [isAuthorized, setLocation]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Codes Promo</h1>
            <p className="text-muted-foreground mt-2">
              Créez et gérez les codes de réduction pour vos clients
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            data-testid="button-toggle-form"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Annuler" : "Nouveau Code"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingDiscount ? "Modifier le code promo" : "Créer un nouveau code promo"}</CardTitle>
              <CardDescription>
                Les codes peuvent être à usage unique ou réutilisables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (affichée dans la bannière)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: -10% sur toute la boutique pour fêter Noël 🎄"
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          Description visible par les clients dans la bannière de la page d'accueil
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Promo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="PROMO2024"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-code"
                          />
                        </FormControl>
                        <FormDescription>
                          Le code sera automatiquement converti en majuscules
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de Réduction</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                            <SelectItem value="FIXED">Montant Fixe (€)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10"
                            {...field}
                            data-testid="input-value"
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("type") === "PERCENTAGE"
                            ? "Pourcentage de réduction (ex: 10 pour 10%)"
                            : "Montant en € (ex: 5.00 pour 5 €)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isSingleUse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Usage Unique</FormLabel>
                          <FormDescription>
                            Le code ne pourra être utilisé qu'une seule fois
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-single-use"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showOnHome"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 bg-primary/5">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Afficher sur l'accueil 🏠</FormLabel>
                          <FormDescription>
                            Ce code apparaîtra dans la bande défilante en haut de la page d'accueil
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-on-home"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Actif</FormLabel>
                          <FormDescription>
                            Le code peut être utilisé immédiatement
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createDiscount.isPending || updateDiscount.isPending}
                    data-testid="button-create-discount"
                  >
                    {createDiscount.isPending || updateDiscount.isPending
                      ? "Enregistrement..."
                      : editingDiscount
                        ? "Modifier le Code"
                        : "Créer le Code"}
                  </Button>
                  {editingDiscount && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Annuler
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Codes Actifs</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : discounts.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Aucun code promo créé. Cliquez sur "Nouveau Code" pour commencer.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discounts.map((discount) => (
                <Card key={discount.id} data-testid={`card-discount-${discount.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl">{discount.code}</CardTitle>
                        <CardDescription className="mt-2">
                          {discount.type === "PERCENTAGE"
                            ? `${discount.value}% de réduction`
                            : `${parseFloat(discount.value).toFixed(2)} € de réduction`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(discount)}
                          data-testid={`button-edit-${discount.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteDiscount.mutate(discount.id)}
                          disabled={deleteDiscount.isPending}
                          data-testid={`button-delete-${discount.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {discount.isActive ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        {discount.isSingleUse && (
                          <Badge variant="outline">Usage unique</Badge>
                        )}
                        {discount.usedBy && (
                          <Badge variant="destructive">Utilisé</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Créé le {new Date(discount.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
