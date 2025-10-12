"use client";
import { Button } from "@/components/ui/button";
import { useTutorial } from "./TutorialProvider";

export function TutorialButtons({ slug }: { slug: string }) {
  const t = useTutorial();
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => t.start(slug)}>Ver tutorial</Button>
      <Button size="sm" variant="outline" onClick={() => t.reset(slug)}>Reiniciar</Button>
    </div>
  );
}
