import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface NewUser {
  email: string;
  password: string;
  full_name: string;
}

export function CreateUsersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<NewUser[]>([
    { email: "", password: "", full_name: "" },
  ]);

  const updateUser = (index: number, field: keyof NewUser, value: string) => {
    setUsers((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  };

  const addUser = () => {
    setUsers((prev) => [...prev, { email: "", password: "", full_name: "" }]);
  };

  const removeUser = (index: number) => {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const createUsers = async () => {
    const validUsers = users.filter(
      (u) => u.email.trim() && u.password.trim() && u.full_name.trim()
    );

    if (validUsers.length === 0) {
      toast.error("Preencha pelo menos um usuário completo.");
      return;
    }

    if (validUsers.some((u) => u.password.length < 10)) {
      toast.error("Todas as senhas devem ter pelo menos 10 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-users", {
        body: { users: validUsers },
      });

      if (error) throw error;

      const results = data.results;
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} usuário(s) criado(s) com sucesso!`);
        setUsers([{ email: "", password: "", full_name: "" }]);
      }

      if (failCount > 0) {
        const failedEmails = results
          .filter((r: any) => !r.success)
          .map((r: any) => `${r.email}: ${r.error}`)
          .join(", ");
        toast.error(`${failCount} usuário(s) falharam: ${failedEmails}`);
      }
    } catch (error: any) {
      toast.error(`Erro ao criar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>Nome completo</Label>
            <Input
              placeholder="Nome completo"
              value={user.full_name}
              onChange={(e) => updateUser(index, "full_name", e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={user.email}
              onChange={(e) => updateUser(index, "email", e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Senha (min. 10 caracteres)</Label>
            <Input
              type="password"
              placeholder="Senha segura"
              value={user.password}
              onChange={(e) => updateUser(index, "password", e.target.value)}
            />
          </div>
          {users.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeUser(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addUser}>
          <Plus className="mr-1 h-4 w-4" />
          Adicionar usuário
        </Button>

        <Button onClick={createUsers} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando usuários...
            </>
          ) : (
            "Criar Usuários"
          )}
        </Button>
      </div>
    </div>
  );
}
