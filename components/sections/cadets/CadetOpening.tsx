import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { cadetOpening } from "@/lib/content/fx-scenes";

/**
 * The scene under the Hall of Valour opening. The cadet photograph has been removed from this scene (the image stays in
 * use on other pages); the doctrine line now stands alone on the night canvas.
 */
export function CadetOpening() {
  return (
    <section aria-label={cadetOpening.label} className="tone-dark relative isolate flex min-h-[92svh] items-end overflow-hidden bg-night">
      <div className="gutter relative z-10 w-full pb-[clamp(3rem,9vh,6rem)] pt-[clamp(8rem,30vh,16rem)]">
        <Label>{cadetOpening.label}</Label>
        <Headline className="mt-4" inscription={cadetOpening.inscription} voice={cadetOpening.voice} animate="none" />
      </div>
    </section>
  );
}
