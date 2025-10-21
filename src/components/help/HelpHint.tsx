import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpHintProps {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function HelpHint({ content, className, side = "top" }: HelpHintProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "text-primary hover:text-primary/80 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="h-5 w-5" strokeWidth={2.5} />
            <span className="sr-only">Ajuda</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs bg-destructive text-destructive-foreground border-destructive"
        >
          <p className="text-sm font-medium">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
