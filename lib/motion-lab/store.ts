import type { Sample, SessionMeta } from "./types";

/**
 * Sessions are kept in the browser (IndexedDB): the summary, the timestamped measurements, and the recording. Nothing is sent
 * anywhere unless the person signs in and presses "Save to account".
 */
const DB = "bsah-motion-lab";
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("This browser cannot store sessions (IndexedDB is unavailable)."));
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("meta", { keyPath: "id" });
      db.createObjectStore("samples");
      db.createObjectStore("video");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the session store."));
  });
}

function tx<T>(stores: string[], mode: IDBTransactionMode, run: (t: IDBTransaction) => IDBRequest | void): Promise<T | undefined> {
  return open().then((db) => new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const r = run(t);
    t.oncomplete = () => { db.close(); resolve(r ? (r.result as T) : undefined); };
    t.onerror = () => { db.close(); reject(t.error ?? new Error("Storing the session failed.")); };
    t.onabort = () => { db.close(); reject(t.error ?? new Error("Storing the session was refused (the device may be out of space).")); };
  }));
}

export async function saveSession(meta: SessionMeta, samples: Sample[], video: Blob | null): Promise<void> {
  await tx(["meta", "samples", "video"], "readwrite", (t) => {
    t.objectStore("meta").put(meta);
    t.objectStore("samples").put(samples, meta.id);
    if (video) t.objectStore("video").put(video, meta.id);
  });
}

export async function listSessions(): Promise<SessionMeta[]> {
  const all = ((await tx<SessionMeta[]>(["meta"], "readonly", (t) => t.objectStore("meta").getAll())) ?? []) as SessionMeta[];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadSession(id: string): Promise<{ meta: SessionMeta; samples: Sample[]; video: Blob | null } | null> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(["meta", "samples", "video"], "readonly");
      const m = t.objectStore("meta").get(id), s = t.objectStore("samples").get(id), v = t.objectStore("video").get(id);
      t.oncomplete = () => resolve(m.result ? { meta: m.result as SessionMeta, samples: (s.result as Sample[]) ?? [], video: (v.result as Blob) ?? null } : null);
      t.onerror = () => reject(t.error);
    });
  } finally { db.close(); }
}

export async function renameSession(id: string, name: string): Promise<void> {
  const cur = await loadSession(id);
  if (!cur) return;
  await tx(["meta"], "readwrite", (t) => { t.objectStore("meta").put({ ...cur.meta, name }); });
}

export async function deleteSession(id: string): Promise<void> {
  await tx(["meta", "samples", "video"], "readwrite", (t) => { t.objectStore("meta").delete(id); t.objectStore("samples").delete(id); t.objectStore("video").delete(id); });
}
