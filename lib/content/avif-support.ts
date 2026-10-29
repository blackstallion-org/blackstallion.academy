/**
 * Whether this browser can decode AVIF, asked once with a 1 x 1 AVIF image (a canvas texture is loaded by script, so the browser's own
 * <picture> choice is not available to it). Resolves false on the server and wherever the decode fails; the caller then keeps the WebP.
 */
let probe: Promise<boolean> | null = null;

export function supportsAvif(): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(false);
  probe ??= new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.width === 1 && image.height === 1);
    image.onerror = () => resolve(false);
    image.src = "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAB0AAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAlbWRhdBIACgc4AAaQENBpMhAZQmMEwAA0AACQQM6Xt10S";
  });
  return probe;
}
