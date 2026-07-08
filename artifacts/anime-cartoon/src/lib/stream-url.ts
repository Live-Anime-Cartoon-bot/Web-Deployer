import { apiUrl } from "./api-base";

export function proxiedStreamUrl(url: string): string {
  return `${apiUrl("/api/public/stream")}?u=${encodeURIComponent(url)}`;
}
