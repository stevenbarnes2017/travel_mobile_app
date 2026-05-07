const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function fetchWithRetry(url, options = {}, timeoutMs = 60000) {
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000)
      })
      if (res.ok || res.status === 422) return res
      throw new Error(`Status ${res.status}`)
    } catch (err) {
      const elapsed = Date.now() - start
      if (elapsed + 10000 >= timeoutMs) throw err
      console.log(`Render waking up... retrying (${Math.round(elapsed/1000)}s)`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  throw new Error('Server took too long to respond. Please try again.')
}

export async function planTrip(formData) {
  const response = await fetchWithRetry(`${API_URL}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Server error: ${response.status}`)
  }

  return response.json()
}