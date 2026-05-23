export async function proxyFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, options)
}
