import { existsSync } from "node:fs";
import { join } from "node:path";
import ledger from "@/docs/history-scrolls/ASSET_LEDGER.json";
import type { AssetSpec } from "./types";

const ASSETS = new Map((ledger.assets as AssetSpec[]).map((a) => [a.id, a]));

export type ResolvedAsset = AssetSpec & {
  /** True only for an accepted, reviewed master whose file exists: everything else renders as a labelled placeholder. */
  ready: boolean;
};

/** Looks an asset up in docs/history-scrolls/ASSET_LEDGER.json. An unknown id is a bug in the page data. */
export function historyAsset(id: string): ResolvedAsset {
  const a = ASSETS.get(id);
  if (!a) throw new Error(`History asset ${id} is not in the ledger`);
  const ready = a.status === "accepted" && Boolean(a.review) && existsSync(join(process.cwd(), "public", a.path));
  return { ...a, ready };
}

/** Ids a page needs that are not yet accepted art: printed on the page footer in development and in PROGRESS.md. */
export function missingAssets(ids: string[]): string[] {
  return ids.filter((id) => !historyAsset(id).ready);
}
