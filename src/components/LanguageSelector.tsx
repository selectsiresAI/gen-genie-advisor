import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/providers/I18nProvider";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale('pt-BR')}
          className={locale === 'pt-BR' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇧🇷</span>
          Português (BR)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('en-US')}
          className={locale === 'en-US' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span>
          English (US)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}