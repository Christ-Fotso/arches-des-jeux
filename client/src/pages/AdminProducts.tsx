import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Product } from "@shared/schema";
import AdminLayout from "@/layouts/AdminLayout";

export default function AdminProducts() {
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
            <ProductsTab />
        </AdminLayout>
    );
}

function ProductsTab() {
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["/api/products"],
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Produit supprimé avec succès" });
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestion des Produits</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button data-testid="button-add-product">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un produit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <ProductForm onSuccess={() => setIsAddOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-12">Chargement...</div>
            ) : (
                <div className="grid gap-4">
                    {products?.map((product) => (
                        <Card key={product.id} data-testid={`card-admin-product-${product.id}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-4 flex-1">
                                        <img
                                            src={product.imageUrl1}
                                            alt={product.altTextFr}
                                            className="w-24 h-24 object-cover rounded-md"
                                        />
                                        <div>
                                            <CardTitle>{product.titleFr}</CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {product.descriptionFr}
                                            </CardDescription>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-sm font-semibold">€ {product.price}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Stock: {product.quantityInStock}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setEditingProduct(product)}
                                                    data-testid={`button-edit-${product.id}`}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                <ProductForm
                                                    product={editingProduct}
                                                    onSuccess={() => setEditingProduct(null)}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => deleteProduct.mutate(product.id)}
                                            data-testid={`button-delete-${product.id}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function ProductForm({ product, onSuccess }: { product?: Product | null; onSuccess: () => void }) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        titleFr: product?.titleFr || "",
        titleDe: product?.titleDe || "",
        titleEn: product?.titleEn || "",
        descriptionFr: product?.descriptionFr || "",
        descriptionDe: product?.descriptionDe || "",
        descriptionEn: product?.descriptionEn || "",
        price: product?.price || "",
        quantityInStock: product?.quantityInStock || 0,
        imageUrl1: product?.imageUrl1 || "",
        imageUrl2: product?.imageUrl2 || "",
        altTextFr: product?.altTextFr || "",
        altTextDe: product?.altTextDe || "",
        altTextEn: product?.altTextEn || "",
    });

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = product ? `/api/products/${product.id}` : "/api/products";
            const method = product ? "PUT" : "POST";
            await apiRequest(method, url, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: product ? "Produit mis à jour" : "Produit créé avec succès" });
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'imageUrl1' | 'imageUrl2') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({ ...prev, [fieldName]: data.url }));
            toast({ title: "Image uploadee avec succès" });
        } catch (error: any) {
            toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle data-testid="text-product-form-title">
                    {product ? "Modifier le produit" : "Ajouter un produit"}
                </DialogTitle>
                <DialogDescription>
                    Remplissez tous les champs en français, allemand et anglais
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="titleFr">Titre (FR)</Label>
                            <Input
                                id="titleFr"
                                value={formData.titleFr}
                                onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                                required
                                data-testid="input-title-fr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="titleDe">Titel (DE)</Label>
                            <Input
                                id="titleDe"
                                value={formData.titleDe}
                                onChange={(e) => setFormData({ ...formData, titleDe: e.target.value })}
                                required
                                data-testid="input-title-de"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="titleEn">Title (EN)</Label>
                            <Input
                                id="titleEn"
                                value={formData.titleEn}
                                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                required
                                data-testid="input-title-en"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="descFr">Description (FR)</Label>
                            <Textarea
                                id="descFr"
                                value={formData.descriptionFr}
                                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                                required
                                data-testid="input-desc-fr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descDe">Beschreibung (DE)</Label>
                            <Textarea
                                id="descDe"
                                value={formData.descriptionDe}
                                onChange={(e) => setFormData({ ...formData, descriptionDe: e.target.value })}
                                required
                                data-testid="input-desc-de"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descEn">Description (EN)</Label>
                            <Textarea
                                id="descEn"
                                value={formData.descriptionEn}
                                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                required
                                data-testid="input-desc-en"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix (€)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                data-testid="input-price"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.quantityInStock}
                                onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) })}
                                required
                                data-testid="input-stock"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="image1">Image principale</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="image1"
                                    type="text"
                                    placeholder="URL de l'image (ex: /uploads/img.png)"
                                    value={formData.imageUrl1}
                                    onChange={(e) => setFormData({ ...formData, imageUrl1: e.target.value })}
                                    required
                                    className="flex-1"
                                    data-testid="input-image1"
                                />
                                <div className="relative">
                                    <Input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        onChange={(e) => handleFileUpload(e, 'imageUrl1')}
                                        accept="image/*"
                                        title="Parcourir"
                                    />
                                    <Button type="button" variant="secondary">Parcourir</Button>
                                </div>
                            </div>
                            {formData.imageUrl1 && (
                                <img src={formData.imageUrl1} alt="Preview 1" className="h-16 w-16 object-cover rounded-md border" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image2">Image au survol</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="image2"
                                    type="text"
                                    placeholder="URL de l'image (ex: /uploads/img.png)"
                                    value={formData.imageUrl2}
                                    onChange={(e) => setFormData({ ...formData, imageUrl2: e.target.value })}
                                    required
                                    className="flex-1"
                                    data-testid="input-image2"
                                />
                                <div className="relative">
                                    <Input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        onChange={(e) => handleFileUpload(e, 'imageUrl2')}
                                        accept="image/*"
                                        title="Parcourir"
                                    />
                                    <Button type="button" variant="secondary">Parcourir</Button>
                                </div>
                            </div>
                            {formData.imageUrl2 && (
                                <img src={formData.imageUrl2} alt="Preview 2" className="h-16 w-16 object-cover rounded-md border" />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="altFr">Texte alternatif (FR)</Label>
                            <Input
                                id="altFr"
                                value={formData.altTextFr}
                                onChange={(e) => setFormData({ ...formData, altTextFr: e.target.value })}
                                required
                                data-testid="input-alt-fr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="altDe">Alternativtext (DE)</Label>
                            <Input
                                id="altDe"
                                value={formData.altTextDe}
                                onChange={(e) => setFormData({ ...formData, altTextDe: e.target.value })}
                                required
                                data-testid="input-alt-de"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="altEn">Alt text (EN)</Label>
                            <Input
                                id="altEn"
                                value={formData.altTextEn}
                                onChange={(e) => setFormData({ ...formData, altTextEn: e.target.value })}
                                required
                                data-testid="input-alt-en"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" disabled={mutation.isPending} data-testid="button-save-product">
                        {mutation.isPending ? "Chargement..." : "Enregistrer"}
                    </Button>
                </div>
            </form>
        </>
    );
}
