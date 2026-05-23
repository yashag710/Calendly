const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export function publicBookingUrl(slug: string) {
  if (typeof window === "undefined") return `/book/${slug}`;
  return `${window.location.origin}/book/${slug}`;
}

export function publicBookingBaseUrl() {
  return publicBookingUrl("");
}
