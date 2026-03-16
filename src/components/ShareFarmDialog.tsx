import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Share2, Loader2, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface ShareFarmDialogProps {
  farmId: string;
  farmName: string;
  myRole: string;
}

interface FarmMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string;
}

interface PendingInvite {
  id: string;
  invited_email: string;
  role: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, { ptBR: string; enUS: string }> = {
  owner: { ptBR: "Proprietário", enUS: "Owner" },
  editor: { ptBR: "Editor", enUS: "Editor" },
  technician: { ptBR: "Técnico", enUS: "Technician" },
  viewer: { ptBR: "Visualizador", enUS: "Viewer" },
};

export function ShareFarmDialog({ farmId, farmName, myRole }: ShareFarmDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const canShare = myRole === "owner" || myRole === "editor";
  const canRemove = myRole === "owner";

  useEffect(() => {
    if (open) {
      loadMembers();
      loadPendingInvites();
    }
  }, [open, farmId]);

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("user_farms")
        .select("id, user_id, role, profiles:user_id(email, full_name)")
        .eq("farm_id", farmId);

      if (error) throw error;

      const mapped: FarmMember[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        email: row.profiles?.email || "",
        full_name: row.profiles?.full_name || "",
      }));

      setMembers(mapped);
    } catch (err: any) {
      console.error("Error loading members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadPendingInvites() {
    try {
      const { data, error } = await supabase
        .from("farm_invites")
        .select("id, invited_email, role, created_at")
        .eq("farm_id", farmId)
        .eq("status", "pending");

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (err: any) {
      console.error("Error loading invites:", err);
    }
  }

  async function handleInvite() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error(t("share.emailRequired"));
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already has access
      const existingMember = members.find((m) => m.email.toLowerCase() === trimmedEmail);
      if (existingMember) {
        toast.error(t("share.alreadyMember"));
        setIsLoading(false);
        return;
      }

      // Check if there's already a pending invite
      const existingInvite = pendingInvites.find(
        (inv) => inv.invited_email.toLowerCase() === trimmedEmail
      );
      if (existingInvite) {
        toast.error(t("share.alreadyInvited"));
        setIsLoading(false);
        return;
      }

      // Try to find user in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", trimmedEmail)
        .maybeSingle();

      if (profile) {
        // User exists — add directly to user_farms
        const { error: insertError } = await supabase
          .from("user_farms")
          .insert({ user_id: profile.id, farm_id: farmId, role } as any);

        if (insertError) throw insertError;

        toast.success(t("share.accessGranted"));
      } else {
        // User doesn't exist — create pending invite
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (!userId) throw new Error("Not authenticated");

        const { error: inviteError } = await supabase
          .from("farm_invites")
          .insert({
            farm_id: farmId,
            invited_by: userId,
            invited_email: trimmedEmail,
            role,
          } as any);

        if (inviteError) throw inviteError;

        toast.success(t("share.inviteSent"));
      }

      setEmail("");
      loadMembers();
      loadPendingInvites();
    } catch (err: any) {
      console.error("Error sharing farm:", err);
      toast.error(err.message || t("share.error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberEmail: string) {
    try {
      const { error } = await supabase
        .from("user_farms")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success(`${memberEmail} ${t("share.removed")}`);
      loadMembers();
    } catch (err: any) {
      console.error("Error removing member:", err);
      toast.error(err.message || t("share.error"));
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const { error } = await supabase
        .from("farm_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success(t("share.inviteRevoked"));
      loadPendingInvites();
    } catch (err: any) {
      console.error("Error revoking invite:", err);
      toast.error(err.message || t("share.error"));
    }
  }

  function getRoleLabel(r: string) {
    const labels = ROLE_LABELS[r];
    if (!labels) return r;
    return t("share.roleOwner") === "Owner" ? labels.enUS : labels.ptBR;
  }

  const roleBadgeColor = (r: string) => {
    switch (r) {
      case "owner": return "default";
      case "editor": return "secondary";
      case "technician": return "outline";
      default: return "outline";
    }
  };

  if (!canShare) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          {t("share.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>
            {t("share.description")} <strong>{farmName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Invite form */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("share.emailLabel")}</Label>
            <Input
              type="email"
              placeholder={t("share.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label>{t("share.roleLabel")}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{getRoleLabel("viewer")}</SelectItem>
                  <SelectItem value="editor">{getRoleLabel("editor")}</SelectItem>
                  <SelectItem value="technician">{getRoleLabel("technician")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={isLoading} className="gap-1.5">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {t("share.invite")}
            </Button>
          </div>
        </div>

        {/* Members list */}
        <div className="mt-4 space-y-2">
          <Label className="text-sm font-medium">{t("share.currentMembers")}</Label>
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.full_name || member.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={roleBadgeColor(member.role) as any}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    {canRemove && member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveMember(member.id, member.email)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="mt-2 space-y-2">
            <Label className="text-sm font-medium">{t("share.pendingInvites")}</Label>
            <div className="space-y-1">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-muted-foreground">{invite.invited_email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRevokeInvite(invite.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
