import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpCenter } from "./HelpCenter";

interface HelpButtonProps {
  context?: string; // Contexto da página para ajuda contextual
}

export function HelpButton({ context = 'dashboard' }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        onClick={() => setOpen(true)}
        title="Central de Ajuda"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
      <HelpCenter open={open} onOpenChange={setOpen} context={context} />
    </>
  );
}
