import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreateUsersButton() {
  const [isLoading, setIsLoading] = useState(false);

  const createUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-users", {
        body: {
          users: [
            {
              email: "lgordon@wwsires.com",
              password: "wws2025*",
              full_name: "Laura Gordon",
            },
            {
              email: "awaymire@wwsires.com",
              password: "wws2025*",
              full_name: "Ashley Waymire",
            },
          ],
        },
      });

      if (error) throw error;

      const results = data.results;
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} usuário(s) criado(s) com sucesso!`);
      }

      if (failCount > 0) {
        const failedEmails = results
          .filter((r: any) => !r.success)
          .map((r: any) => `${r.email}: ${r.error}`)
          .join(", ");
        toast.error(`${failCount} usuário(s) falharam: ${failedEmails}`);
      }

      console.log("Create users results:", results);
    } catch (error: any) {
      console.error("Error creating users:", error);
      toast.error(`Erro ao criar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={createUsers} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Criando usuários...
        </>
      ) : (
        "Criar Usuários WWS"
      )}
    </Button>
  );
}
