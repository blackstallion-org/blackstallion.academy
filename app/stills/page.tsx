import type { Metadata } from "next";
import { AutoPlayStill } from "@/components/film/AutoPlayStill";
import { asset } from "@/lib/content/asset";

/** A test page for three animations that play by themselves (made from the supplied GIFs), their text set as an editorial page. Not in the sitemap or navigation, not indexed. */
export const metadata: Metadata = {
  title: "Stills",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

const clip = (name: string) => ({ video: asset(`/video/stills/${name}.mp4`), poster: asset(`/images/stills/${name}-poster.webp`) });

export default function StillsPage() {
  return (
    <div className="flex flex-col gap-[10svh] bg-[color-mix(in_srgb,var(--color-leather)_45%,black)]">
      <AutoPlayStill
        {...clip("eye-to-rider")}
        alt="A mosaic eye opens, then the view pulls back to a rider in armour on a chestnut horse"
        folio="No. 01 · The eye"
        inscription="Every legend"
        voice="begins with a look."
        standfirst="A closed eye opens, and the view draws back to a rider."
        text="A closed eye, then a slow opening. The picture pulls back stone by stone until a whole face, and then a whole rider, comes into view. Nothing is hurried; the view simply learns where to look."
        credit="Mosaic · looping film"
        side="left"
        eager
        fade="bottom"
      />
      <AutoPlayStill
        {...clip("rider")}
        alt="A mosaic of a rider in armour on a chestnut horse, spears rising behind him"
        folio="No. 02 · The rider"
        inscription="Then it begins"
        voice="in the saddle."
        standfirst="One rider, one horse, and the calm of a face against everything that moves."
        text="A rider, mid-stride, with his horse beside him and the spears behind only suggested. What the eye holds on to is the calm of the face against everything that moves around it."
        credit="Mosaic · looping film"
        side="right"
        fade="both"
      />
      <AutoPlayStill
        {...clip("eye-to-battle")}
        alt="A mosaic eye opens, and the view pulls back through a charging rider to the whole battle"
        folio="No. 03 · The charge"
        inscription="And the whole"
        voice="field moves."
        standfirst="The same opening, carried further, until the whole field is in motion."
        text="The same opening, carried further. From the closed eye to the charge the view widens until the whole field is moving, and the stillness at the centre is all that is left of the first frame."
        credit="Mosaic · looping film"
        side="left"
        fade="both"
      />
    </div>
  );
}
