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
  
  const currentLanguage = locale === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-10 gap-2 px-3 font-medium">
          <Globe className="h-5 w-5" />
          <span className="hidden sm:inline">{currentLanguage}</span>
          <span className="sm:hidden">{locale === 'pt-BR' ? '🇧🇷' : '🇺🇸'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setLocale('pt-BR')}
          className={`cursor-pointer ${locale === 'pt-BR' ? 'bg-accent font-semibold' : ''}`}
        >
          <span className="mr-2 text-lg">🇧🇷</span>
          <span>Português (BR)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('en-US')}
          className={`cursor-pointer ${locale === 'en-US' ? 'bg-accent font-semibold' : ''}`}
        >
          <span className="mr-2 text-lg">🇺🇸</span>
          <span>English (US)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}