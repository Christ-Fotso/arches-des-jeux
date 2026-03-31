import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Package,
    Tag,
    Percent,
    Menu,
    X,
    ShoppingCart,
    Mail
} from "lucide-react";

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
    { icon: Package, label: "Produits", href: "/admin/products" },
    { icon: ShoppingCart, label: "Commandes", href: "/admin/orders" },
    { icon: Mail, label: "Messagerie", href: "/admin/messages" },
    { icon: Tag, label: "Marques", href: "/admin/brands" },
    { icon: Percent, label: "Promotions", href: "/admin/discounts" },
];

function Sidebar({ className }: { className?: string }) {
    const [location] = useLocation();

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="px-4 py-6">
                <h2 className="text-2xl font-bold">Admin</h2>
                <p className="text-sm text-muted-foreground">L'Arche des jeux</p>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;

                    return (
                        <Link key={item.href} href={item.href}>
                            <a
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </a>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 py-4 border-t">
                <Link href="/">
                    <a className="text-sm text-muted-foreground hover:text-foreground">
                        ← Accueil du site
                    </a>
                </Link>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-card">
                <Sidebar />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center gap-4 border-b bg-background px-4 py-3">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <Sidebar className="h-full" />
                    </SheetContent>
                </Sheet>

                <h1 className="text-lg font-semibold">Administration</h1>
            </div>

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="px-4 py-8 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
