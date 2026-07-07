export function proxiedStreamUrl(url: string): string {
  return `/api/public/stream?u=${encodeURIComponent(url)}`;
}
