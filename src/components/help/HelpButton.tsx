import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpCenter } from "./HelpCenter";
import { useTranslation } from "@/hooks/useTranslation";

interface HelpButtonProps {
  context?: string; // Contexto da página para ajuda contextual
}
export function HelpButton({
  context = 'dashboard'
}: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  
  return <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} title={t("help.center")} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform bg-red-600 hover:bg-red-500 text-neutral-50 font-extrabold text-6xl">
        <HelpCircle className="h-6 w-6" />
      </Button>
      <HelpCenter open={open} onOpenChange={setOpen} context={context} />
    </>;
}