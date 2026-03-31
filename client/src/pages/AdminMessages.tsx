import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { SupportMessage } from "@shared/schema";
import { Loader2, Mail, MailOpen, Reply, CheckCircle2 } from "lucide-react";

export default function AdminMessages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.role !== "ADMIN") {
    setLocation("/");
    return null;
  }

  return (
    <AdminLayout>
      <MessagesTab />
    </AdminLayout>
  );
}

function MessagesTab() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread" | "replied">("all");
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: messages, isLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/messages"],
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest("POST", "/api/support/reply", { id, replyContent: content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages"] });
      toast({ title: "Réponse envoyée avec succès via email" });
      setReplyingTo(null);
      setReplyContent("");
    },
    onError: (err: any) => toast({ title: "Erreur lors de l'envoi", description: err.message, variant: "destructive" }),
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/support/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages"] });
    },
  });

  const handleReplySubmit = (id: string) => {
    if (!replyContent.trim()) {
      toast({ title: "Le message ne peut être vide", variant: "destructive" });
      return;
    }
    replyMutation.mutate({ id, content: replyContent });
  };

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    return messages.filter((msg) => {
      const matchesSearch = msg.name.toLowerCase().includes(search.toLowerCase()) || msg.email.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === "unread") return !msg.isRead;
      if (filter === "replied") return !!msg.repliedAt;
      return true;
    });
  }, [messages, filter, search]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8" /> Messages du Support
        </h1>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/50">
          <Input
            placeholder="Rechercher par nom ou email..."
            className="max-w-xs bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les messages</SelectItem>
              <SelectItem value="unread">Non lus</SelectItem>
              <SelectItem value="replied">Répondus</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredMessages.length === 0 ? (
          <p className="text-center text-muted-foreground p-8">Aucun message trouvé.</p>
        ) : (
          filteredMessages.map((msg) => (
            <Card key={msg.id} className={!msg.isRead ? "border-l-4 border-l-primary" : ""}>
              <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/10">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {msg.name} 
                    {!msg.isRead && <Badge variant="default" className="text-xs">Nouveau</Badge>}
                    {msg.repliedAt && <Badge variant="secondary" className="text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Répondu</Badge>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <a href={`mailto:${msg.email}`} className="text-blue-500 hover:underline">{msg.email}</a>
                    <span>• {formatDate(msg.createdAt)}</span>
                  </CardDescription>
                </div>
                {!msg.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => readMutation.mutate(msg.id)}>
                    <MailOpen className="w-4 h-4 mr-2" /> Marquer lu
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed border-l-4 border-muted pl-4">
                  {msg.message}
                </p>
              </CardContent>
              <CardFooter className="flex-col items-stretch pt-0 border-t bg-muted/5">
                {replyingTo === msg.id ? (
                  <div className="pt-4 space-y-4">
                    <Textarea 
                      placeholder="Tapez votre réponse ici. Elle sera envoyée par email au client..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[150px] bg-background"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleReplySubmit(msg.id)} disabled={replyMutation.isPending}>
                        {replyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Mail className="w-4 h-4 mr-2" /> Envoyer la réponse
                      </Button>
                      <Button variant="ghost" onClick={() => { setReplyingTo(null); setReplyContent(""); }}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground w-full">
                    <span>{msg.repliedAt ? `Dernière réponse envoyée le ${formatDate(msg.repliedAt)}` : ''}</span>
                    <Button variant="outline" size="sm" onClick={() => setReplyingTo(msg.id)}>
                      <Reply className="w-4 h-4 mr-2" /> Répondre par Email
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
