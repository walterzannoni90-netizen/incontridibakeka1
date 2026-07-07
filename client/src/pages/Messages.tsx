import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/hooks/useRouter";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, MessageCircle, Send, Loader2, User, Trash2, Clock } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Conversation {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  ad_title: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  buyer_name?: string;
  seller_name?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { navigate, currentPath } = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, { name: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const convId = currentPath.includes("/messages/")
    ? currentPath.split("/messages/")[1]?.split("/")[0]
    : null;

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = (await supabase!.auth.getSession()).data.session?.access_token || "";
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/conversations?or=(buyer_id.eq.${user.id},seller_id.eq.${user.id})&order=last_message_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
      );
      const data: Conversation[] = await res.json();
      setConversations(data || []);
      const ids = new Set<string>();
      data.forEach(c => { ids.add(c.buyer_id); ids.add(c.seller_id); });
      if (ids.size > 0) {
        const pid = Array.from(ids).map(id => `id.eq.${id}`).join(",");
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=id,name&or=(${pid})`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
        );
        const pData = await pRes.json();
        if (Array.isArray(pData)) {
          const map: Record<string, { name: string }> = {};
          pData.forEach((p: any) => { map[p.id] = { name: p.name }; });
          setProfiles(map);
        }
      }
    } catch { setConversations([]); }
    finally { setLoading(false); }
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const token = (await supabase!.auth.getSession()).data.session?.access_token || "";
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/messages?select=*&conversation_id=eq.${convId}&order=created_at.asc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMessages(data || []);
      setSelectedConv(convId);
    } catch { toast.error("Errore caricamento messaggi"); }
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    if (convId && convId !== selectedConv) {
      loadConversations();
      loadMessages(convId);
    }
  }, [convId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase!.channel(`messages:${selectedConv}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConv}` },
        (payload: any) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== user?.id) {
            setMessages(prev => [...prev, msg]);
            loadConversations();
          }
        }
      )
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [selectedConv, user, loadConversations]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return;
    try {
      setSending(true);
      const token = (await supabase!.auth.getSession()).data.session?.access_token || "";
      const msg = { conversation_id: selectedConv, sender_id: user.id, content: newMessage.trim() };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(msg),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setMessages(prev => [...prev, created]);
      await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${selectedConv}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ last_message: newMessage.trim(), last_message_at: new Date().toISOString() }),
      });
      setNewMessage("");
      loadConversations();
    } catch { toast.error("Errore invio messaggio"); }
    finally { setSending(false); }
  };

  const otherPartyName = (conv: Conversation): string => {
    const otherId = conv.buyer_id === user?.id ? conv.seller_id : conv.buyer_id;
    return profiles[otherId]?.name || "Utente";
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Accedi per vedere i messaggi</p>
        <Button onClick={() => navigate("/")}>Torna alla Home</Button>
      </Card>
    </div>
  );

  const activeConv = conversations.find(c => c.id === (selectedConv || convId));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => selectedConv || convId ? navigate("/messages") : navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {selectedConv || convId ? "Torna ai messaggi" : "Home"}
          </Button>
          <h1 className="text-xl font-bold font-poppins">Messaggi</h1>
          <div className="w-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversations list */}
          <div className={`${selectedConv || convId ? "hidden md:block" : ""} md:col-span-1`}>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : conversations.length === 0 ? (
              <Card className="p-6 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nessuna conversazione</p>
                <p className="text-xs text-muted-foreground mt-1">Contatta qualcuno da un annuncio</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedConv(conv.id); navigate(`/messages/${conv.id}`); }}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      (selectedConv || convId) === conv.id
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {otherPartyName(conv).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{otherPartyName(conv)}</p>
                      </div>
                    </div>
                    {conv.ad_title && <p className="text-[10px] text-muted-foreground truncate mb-1">{conv.ad_title}</p>}
                    {conv.last_message && <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {new Date(conv.last_message_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages view */}
          <div className={`${!selectedConv && !convId ? "hidden" : ""} md:col-span-2`}>
            {!activeConv ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Seleziona una conversazione</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                    {otherPartyName(activeConv).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{otherPartyName(activeConv)}</p>
                    {activeConv.ad_title && <p className="text-[10px] text-muted-foreground truncate">{activeConv.ad_title}</p>}
                  </div>
                </div>

                <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Nessun messaggio. Inizia la conversazione!</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="gap-1.5">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">Invia</span>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}