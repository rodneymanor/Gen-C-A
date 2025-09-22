export async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    const message = data?.error || response.statusText;
    const error = new Error(`${url} responded with ${response.status}: ${message}`);
    error.response = data;
    error.status = response.status;
    throw error;
  }

  return data;
}
