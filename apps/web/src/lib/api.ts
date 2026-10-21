const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('markethub_token') : null;
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('markethub_session_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || json.error || 'An error occurred during request',
      };
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed. Ensure backend API is running.',
    };
  }
}
