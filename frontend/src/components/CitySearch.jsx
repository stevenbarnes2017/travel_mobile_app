import React, { useState, useEffect, useRef } from 'react'
import styles from './CitySearch.module.css'

const GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY

export default function CitySearch({ value, onChange }) {
  const [input, setInput] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const sessionToken = useRef(Math.random().toString(36).substring(2))

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        input: query,
        key: GOOGLE_PLACES_KEY,
        sessiontoken: sessionToken.current,
        types: '(cities)',
        components: 'country:us',
      })

      const res = await fetch(
        `http://10.0.0.41:8000/api/places?input=${encodeURIComponent(query)}`
      )
      const data = await res.json()

      if (data.status === 'OK') {
        // Filter to Mountain West states only
        const mountainWest = ['CO', 'UT', 'WY', 'NM', 'MT', 'ID', 'NV', 'AZ']
        const filtered = data.predictions.filter(p => {
          const desc = p.description
          return mountainWest.some(state => desc.includes(`, ${state}`) || desc.includes(`, ${state},`))
        })
        setSuggestions(filtered.length > 0 ? filtered : data.predictions.slice(0, 5))
        setShowDropdown(true)
      } else {
        setSuggestions([])
      }
    } catch (err) {
      console.error('Places API error:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (val) => {
    setInput(val)
    onChange(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350)
  }

  const handleSelect = (suggestion) => {
    const city = suggestion.description
    setInput(city)
    onChange(city)
    setSuggestions([])
    setShowDropdown(false)
    sessionToken.current = Math.random().toString(36).substring(2)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputWrap}>
        <span className={styles.searchIcon}>📍</span>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="City, state or zip code..."
          autoComplete="off"
        />
        {loading && <span className={styles.spinner} />}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className={styles.dropdown}>
          {suggestions.map((s) => {
            const main = s.structured_formatting?.main_text || s.description
            const secondary = s.structured_formatting?.secondary_text || ''
            return (
              <button
                key={s.place_id}
                className={styles.item}
                onMouseDown={() => handleSelect(s)}
                type="button"
              >
                <span className={styles.itemMain}>{main}</span>
                {secondary && <span className={styles.itemSub}>{secondary}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}