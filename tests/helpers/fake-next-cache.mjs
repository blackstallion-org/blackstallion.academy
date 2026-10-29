// Test stand-in for next/cache: the real revalidatePath needs a Next.js request store. Records calls instead.
const calls = () => ((globalThis.__bsahTest ??= {}).revalidated ??= []);

export function revalidatePath(path, type) {
  calls().push([path, type]);
}
export function revalidateTag() {}
export function updateTag(tag) {
  ((globalThis.__bsahTest ??= {}).tags ??= []).push(tag);
}
export function cacheTag() {}
export function cacheLife() {}
export function refresh() {}
