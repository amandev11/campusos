/**
 * Client-side file handling.
 *
 * Uploads are validated by type and size, and images are downscaled before they
 * are persisted so the local store never carries an unbounded blob. Once real
 * storage is configured, `integrationById('supabase')` reports that uploads
 * move server-side.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf'];

export interface FileProblem {
  ok: false;
  error: string;
}

export interface FileOk<T> {
  ok: true;
  value: T;
}

export function validateImage(file: File): { ok: true } | FileProblem {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Use a JPEG, PNG or WebP image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Images must be under ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.` };
  }
  return { ok: true };
}

export function validateDocument(file: File): { ok: true } | FileProblem {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'Only PDF documents can be uploaded here.' };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: `Documents must be under ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB.` };
  }
  return { ok: true };
}

/**
 * Reads an image, fits it inside `maxEdge` and returns a compact data URL.
 * Keeps the demonstration store comfortably inside its quota.
 */
export async function toThumbnail(file: File, maxEdge = 900, quality = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('That image could not be decoded.'));
    element.src = dataUrl;
  });

  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/* ------------------------------------------------------------------ session files */

const sessionFiles = new Map<string, string>();

/** Object URLs created from real uploads. They live for this browser session only. */
export function keepSessionFile(id: string, file: File): string {
  const url = URL.createObjectURL(file);
  const previous = sessionFiles.get(id);
  if (previous) URL.revokeObjectURL(previous);
  sessionFiles.set(id, url);
  return url;
}

export function readSessionFile(id: string): string | null {
  return sessionFiles.get(id) ?? null;
}

export function countSessionFiles(): number {
  return sessionFiles.size;
}
