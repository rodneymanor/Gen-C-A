export const parseJsonResponse = async <T,>(
  response: Response,
  context: string
): Promise<{ data: T | null; raw: string }> => {
  const raw = await response.text()

  if (!raw) {
    return { data: null, raw }
  }

  try {
    return { data: JSON.parse(raw) as T, raw }
  } catch (error) {
    console.warn(`${context}: Failed to parse JSON (status ${response.status}). Raw response:`, raw)
    throw new Error(`${context}: Received invalid JSON (status ${response.status}).`)
  }
}
