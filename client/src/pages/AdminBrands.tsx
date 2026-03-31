import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Brand {
    id: string;
    name: string;
    description: string | null;
}

export default function AdminBrands() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    useEffect(() => {
        if (!user || user.role?.toUpperCase() !== 'ADMIN') {
            setLocation("/");
            return;
        }
        loadBrands();
    }, [user, setLocation]);

    const loadBrands = async () => {
        try {
            const response = await fetch("/api/brands");
            const data = await response.json();
            setBrands(data);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de charger les marques",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: "Erreur",
                description: "Le nom de la marque est requis",
                variant: "destructive",
            });
            return;
        }

        try {
            if (editingBrand) {
                // Modifier
                await apiRequest("PUT", `/api/admin/brands/${editingBrand.id}`, formData);
                toast({ title: "Succès", description: "Marque modifiée avec succès" });
            } else {
                // Créer
                await apiRequest("POST", "/api/admin/brands", formData);
                toast({ title: "Succès", description: "Marque créée avec succès" });
            }

            setFormData({ name: "", description: "" });
            setEditingBrand(null);
            loadBrands();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Une erreur est survenue",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            description: brand.description || "",
        });
    };

    const handleCancelEdit = () => {
        setEditingBrand(null);
        setFormData({ name: "", description: "" });
    };

    const handleDelete = async () => {
        if (!deletingBrand) return;

        try {
            await apiRequest("DELETE", `/api/admin/brands/${deletingBrand.id}`);
            toast({ title: "Succès", description: "Marque supprimée" });
            setDeletingBrand(null);
            loadBrands();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer la marque",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">Chargement...</div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <h1 className="text-3xl font-bold mb-8">Gestion des Marques</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Formulaire */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editingBrand ? "Modifier la marque" : "Nouvelle marque"}</CardTitle>
                        <CardDescription>
                            {editingBrand ? "Modifiez les informations de la marque" : "Ajoutez une nouvelle marque"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nom de la marque *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: L'Oréal"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Description de la marque (optionnel)"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1">
                                    {editingBrand ? "Modifier" : "Créer"}
                                </Button>
                                {editingBrand && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                        Annuler
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Liste des marques */}
                <Card>
                    <CardHeader>
                        <CardTitle>Marques existantes ({brands.length})</CardTitle>
                        <CardDescription>Cliquez pour modifier ou supprimer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {brands.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Aucune marque pour le moment
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {brands.map((brand) => (
                                    <div
                                        key={brand.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{brand.name}</h3>
                                            {brand.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {brand.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(brand)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Modifier la marque</DialogTitle>
                                                        <DialogDescription>
                                                            Modifiez les informations de la marque
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleSubmit} className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="edit-name">Nom de la marque *</Label>
                                                            <Input
                                                                id="edit-name"
                                                                value={formData.name}
                                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                                placeholder="Ex: L'Oréal"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit-description">Description</Label>
                                                            <Textarea
                                                                id="edit-description"
                                                                value={formData.description}
                                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                                placeholder="Description de la marque (optionnel)"
                                                                rows={4}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button type="submit" className="flex-1">
                                                                Modifier
                                                            </Button>
                                                            <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                                                Annuler
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setDeletingBrand(brand)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={!!deletingBrand} onOpenChange={() => setDeletingBrand(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la marque "{deletingBrand?.name}" ?
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
