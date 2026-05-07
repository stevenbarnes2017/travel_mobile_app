const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function planTrip(formData) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  try {
    const response = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      signal: controller.signal
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || `Server error: ${response.status}`)
    }

    return response.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}