import { useState, useEffect } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, MailOpen, Reply, RefreshCw, Inbox, ArrowLeft, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface InboundEmail {
  id: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  repliedAt: string | null;
  replyBody: string | null;
  receivedAt: string;
}

export default function AdminInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showDetail, setShowDetail] = useState(false); // mobile: show detail panel

  // Composer modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingCompose, setSendingCompose] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/inbox");
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les emails." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleSelectEmail = async (email: InboundEmail) => {
    setShowDetail(true);
    setReplyText("");

    // If already loaded and read, just show it
    if (email.isRead && selectedEmail?.id === email.id) return;

    setLoadingDetail(true);
    setSelectedEmail({ ...email, isRead: true });

    // Mark as read in local state immediately
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));

    try {
      const res = await apiRequest("GET", `/api/admin/inbox/${email.id}`);
      const detail = await res.json();
      setSelectedEmail(detail);
    } catch {
      // Keep the cached version
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await apiRequest("POST", `/api/admin/inbox/${selectedEmail.id}/reply`, {
        replyBody: replyText.trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      toast({ title: "✅ Réponse envoyée !", description: `Email envoyé à ${selectedEmail.fromEmail}` });
      setReplyText("");
      setSelectedEmail(prev => prev ? { ...prev, repliedAt: new Date().toISOString(), replyBody: replyText } : prev);
      setEmails(prev => prev.map(e =>
        e.id === selectedEmail.id ? { ...e, repliedAt: new Date().toISOString() } : e
      ));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      return toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
    }
    
    setSendingCompose(true);
    try {
      const res = await apiRequest("POST", `/api/admin/inbox/send`, {
        toEmail: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");

      toast({ title: "✅ Message envoyé !", description: `Email envoyé à ${composeTo}` });
      setIsComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setSendingCompose(false);
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (email: InboundEmail) => {
    const name = email.fromName || email.fromEmail;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Inbox className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Boîte de réception</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
                  : "Tous les messages sont lus"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsComposeOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau message
            </Button>
            <Button variant="outline" size="sm" onClick={loadEmails} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Main layout: 2 panels */}
        <div className="flex-1 flex border rounded-2xl overflow-hidden shadow-sm bg-card min-h-0">

          {/* LEFT PANEL — Email list */}
          <div className={`
            flex flex-col border-r
            w-full md:w-80 lg:w-96 flex-shrink-0
            ${showDetail ? 'hidden md:flex' : 'flex'}
          `}>
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {emails.length} message{emails.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6 text-center">
                <div className="p-4 bg-muted/20 rounded-full">
                  <MailOpen className="w-10 h-10 opacity-40" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Votre boîte est vide</p>
                  <p className="text-sm mt-1">Les messages reçus apparaîtront ici.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsComposeOpen(true)} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Écrire un message
                </Button>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y">
                {emails.map(email => (
                  <li key={email.id}>
                    <button
                      onClick={() => handleSelectEmail(email)}
                      className={`
                        w-full text-left px-4 py-4 transition-colors hover:bg-accent/50
                        ${selectedEmail?.id === email.id ? 'bg-accent' : ''}
                        ${!email.isRead ? 'bg-primary/5' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`
                          w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                          ${!email.isRead ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          {getInitials(email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                              {email.fromName || email.fromEmail}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(email.receivedAt)}
                            </span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${!email.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {email.bodyText?.substring(0, 60) || '(Pas de contenu)'}
                          </p>
                          {email.repliedAt && (
                            <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5">
                              <Reply className="w-2.5 h-2.5 mr-1" /> Répondu
                            </Badge>
                          )}
                        </div>
                        {!email.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT PANEL — Email detail + reply */}
          <div className={`
            flex-1 flex flex-col min-w-0
            ${showDetail ? 'flex' : 'hidden md:flex'}
          `}>
            {!selectedEmail ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground text-center p-6">
                <div className="p-6 bg-muted/20 rounded-2xl">
                  <Mail className="w-16 h-16 opacity-20" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-lg">Sélectionnez un email</p>
                  <p className="text-sm mt-1">Cliquez sur un message dans la liste pour le lire</p>
                </div>
                <Button onClick={() => setIsComposeOpen(true)} variant="secondary" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Écrire un nouveau message
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email header */}
                <div className="px-6 py-5 border-b bg-muted/20 flex-shrink-0">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setShowDetail(false)}
                    className="md:hidden flex items-center gap-1 text-sm text-primary mb-3"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>

                  <h2 className="text-lg font-bold leading-snug mb-2">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {getInitials(selectedEmail)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedEmail.fromName || selectedEmail.fromEmail}</p>
                      <p className="text-xs text-muted-foreground">{selectedEmail.fromEmail}</p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {formatDate(selectedEmail.receivedAt)}
                    </div>
                  </div>
                  {selectedEmail.repliedAt && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <Reply className="w-3 h-3 mr-1" />
                      Répondu {formatDate(selectedEmail.repliedAt)}
                    </Badge>
                  )}
                </div>

                {/* Email body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : selectedEmail.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {selectedEmail.bodyText || "(Contenu vide)"}
                    </pre>
                  )}
                </div>

                {/* Reply area */}
                <div className="border-t px-6 py-4 bg-muted/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Reply className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Répondre à <span className="text-primary">{selectedEmail.fromEmail}</span>
                    </p>
                  </div>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    className="min-h-[100px] mb-3 resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="gap-2"
                    >
                      {sendingReply ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                      ) : (
                        <><Reply className="w-4 h-4" /> Envoyer la réponse</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOUVEAU MESSAGE */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
            <DialogDescription>
              Envoyez un email depuis contact@larchedesjeux.fr
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="toEmail">Destinataire</Label>
              <Input
                id="toEmail"
                type="email"
                placeholder="client@exemple.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                placeholder="Sujet de votre email"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Écrivez votre message ici..."
                className="min-h-[200px]"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)} disabled={sendingCompose}>
              Annuler
            </Button>
            <Button onClick={handleSendCompose} disabled={sendingCompose || !composeTo || !composeSubject || !composeBody}>
              {sendingCompose ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" /> Envoyer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
