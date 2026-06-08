export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || String(res.status))
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as T
}

