import type { ImageMetadata } from 'astro';

const images = import.meta.glob<ImageMetadata>('/src/assets/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

/** Resolve an image by its path relative to src/assets (e.g. "photos/x.jpg"). */
export function img(path: string): ImageMetadata {
  const found = images[`/src/assets/${path}`];
  if (!found) throw new Error(`Missing image: src/assets/${path}`);
  return found;
}
