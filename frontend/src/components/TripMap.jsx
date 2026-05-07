import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import styles from './TripMap.module.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const PIN_TYPES = {
  destination: { emoji: '🏔️', color: '#c48e38' },
  food:        { emoji: '🍺', color: '#e07b5a' },
  lodging:     { emoji: '🏕️', color: '#5a9e6f' },
}

const REGION_CENTERS = {
  'Colorado':                      [-105.5, 39.0],
  'Utah':                          [-111.5, 39.5],
  'Wyoming':                       [-107.5, 43.0],
  'New Mexico':                    [-106.0, 34.5],
  'anywhere in the Mountain West': [-108.0, 39.5],
}

export default function TripMap({ locations = [], region }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const initialized = useRef(false)
  const [loading, setLoading] = useState(true)
  const [pinCount, setPinCount] = useState(0)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const center = REGION_CENTERS[region] || REGION_CENTERS['anywhere in the Mountain West']

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: center,
      zoom: 6.5,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const geocodeAndPin = async () => {
      console.log('Locations to pin:', locations)
      let count = 0

      // Get destination for context
      const destLocation = locations.find(l => l.type === 'destination')
      const context = destLocation ? destLocation.name : region

      for (const loc of locations.slice(0, 8)) {
        try {
          // For non-destination pins, add destination city as context
          const searchQuery = loc.type === 'destination'
            ? `${loc.name}, USA`
            : `${loc.name}, ${context}`
          
          const query = encodeURIComponent(searchQuery)
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&limit=1&types=poi,place`
          )
          const data = await res.json()
          console.log(`Geocoding "${loc.name}":`, data.features?.[0]?.place_name || 'NOT FOUND')

          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center
            const pinType = PIN_TYPES[loc.type] || PIN_TYPES.destination

            const el = document.createElement('div')
            el.className = styles.pin
            el.style.borderColor = pinType.color
            el.innerHTML = pinType.emoji

            const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
              .setHTML(`
                <div style="padding:4px 2px;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:1.2rem">${pinType.emoji}</span>
                  <div>
                    <div style="font-weight:500;font-size:0.88rem">${loc.name}</div>
                    <div style="font-size:0.75rem;opacity:0.6;text-transform:capitalize">${loc.type}</div>
                  </div>
                </div>
              `)

            new mapboxgl.Marker(el)
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(map.current)

            count++
            if (count === 1) {
              map.current.flyTo({ center: [lng, lat], zoom: 9, duration: 1500 })
            }
          }
        } catch (err) {
          console.error('Geocoding error:', err)
        }
      }

      setPinCount(count)
      setLoading(false)
    }

    map.current.on('load', geocodeAndPin)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        initialized.current = false
      }
    }
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>🗺️ Trip Map</span>
        {loading
          ? <span className={styles.loading}>Pinning locations...</span>
          : <span className={styles.count}>{pinCount} spots mapped</span>
        }
      </div>
      <div ref={mapContainer} className={styles.mapWrap} />
      <div className={styles.legend}>
        {Object.entries(PIN_TYPES).map(([type, { emoji, color }]) => (
          <span key={type} className={styles.legendItem}>
            <span>{emoji}</span>
            <span style={{ color }} className={styles.legendLabel}>{type}</span>
          </span>
        ))}
      </div>
    </div>
  )
}