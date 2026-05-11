const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  // Create a new Headers object to avoid type issues
  const headers = new Headers(options.headers);
  
  // Set default Content-Type only if not already set
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers, // Headers object is compatible with RequestInit
  });

  if (!res.ok) {
    const text = await res.text();
    let message = "API request failed";
    let error = "API request failed";

    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
      error = parsed.error || message;
    } catch {
      message = text || message;
      error = message;
    }

    throw {
      status: res.status,
      message,
      error,
    };
  }

  return res.json();
}
