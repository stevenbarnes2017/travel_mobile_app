import React, { useState, useEffect } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import styles from './TripMap.module.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const PIN_TYPES = {
  destination: { emoji: '🏔️', color: '#c48e38' },
  food: { emoji: '🍺', color: '#e07b5a' },
  lodging: { emoji: '🏕️', color: '#5a9e6f' },
  activity: { emoji: '🥾', color: '#6a8fc4' },
}

export default function TripMap({ result, region }) {
  const [locations, setLocations] = useState([])
  const [selectedPin, setSelectedPin] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: -105.5,
    latitude: 39.0,
    zoom: 6
  })
  const [loading, setLoading] = useState(true)

  const REGION_CENTERS = {
    'Colorado': { longitude: -105.5, latitude: 39.0, zoom: 6.5 },
    'Utah': { longitude: -111.5, latitude: 39.5, zoom: 6.5 },
    'Wyoming': { longitude: -107.5, latitude: 43.0, zoom: 6.5 },
    'New Mexico': { longitude: -106.0, latitude: 34.5, zoom: 6.5 },
    'anywhere in the Mountain West': { longitude: -108.0, latitude: 39.5, zoom: 5.5 },
  }

  useEffect(() => {
    const center = REGION_CENTERS[region] || REGION_CENTERS['anywhere in the Mountain West']
    setViewState(center)
    geocodeLocations()
  }, [region])

  const extractPlaces = () => {
    const places = []

    // Extract from destination section
    if (result.destination) {
      const destMatches = result.destination.match(/\*\*([^*]+)\*\*/g) || []
      destMatches.slice(0, 2).forEach(m => {
        const name = m.replace(/\*\*/g, '').trim()
        if (name.length > 3 && !name.includes(':')) {
          places.push({ name, type: 'destination' })
        }
      })
    }

    // Extract from food section
    if (result.food) {
      const foodMatches = result.food.match(/\*\*([^*]+)\*\*/g) || []
      foodMatches.slice(0, 4).forEach(m => {
        const name = m.replace(/\*\*/g, '').replace(/\([^)]*\)/g, '').trim()
        if (name.length > 3) {
          places.push({ name, type: 'food' })
        }
      })
    }

    // Extract from lodging section
    if (result.lodging) {
      const lodgingMatches = result.lodging.match(/\*\*([^*]+)\*\*/g) || []
      lodgingMatches.slice(0, 2).forEach(m => {
        const name = m.replace(/\*\*/g, '').replace(/\([^)]*\)/g, '').trim()
        if (name.length > 3) {
          places.push({ name, type: 'lodging' })
        }
      })
    }

    return places
  }

  const geocodeLocations = async () => {
    setLoading(true)
    const places = extractPlaces()
    const geocoded = []

    for (const place of places.slice(0, 8)) {
      try {
        const query = encodeURIComponent(`${place.name}, ${region}`)
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=poi,place`
        )
        const data = await res.json()
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center
          geocoded.push({
            ...place,
            longitude: lng,
            latitude: lat,
            fullName: data.features[0].place_name,
          })
        }
      } catch (err) {
        console.error('Geocoding error:', err)
      }
    }

    setLocations(geocoded)
    if (geocoded.length > 0) {
      setViewState(prev => ({
        ...prev,
        longitude: geocoded[0].longitude,
        latitude: geocoded[0].latitude,
        zoom: 9
      }))
    }
    setLoading(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>🗺️ Trip Map</span>
        {loading && <span className={styles.loading}>Pinning locations...</span>}
        {!loading && <span className={styles.count}>{locations.length} spots found</span>}
      </div>

      <div className={styles.mapWrap}>
        <Map
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />

          {locations.map((loc, i) => (
            <Marker
              key={i}
              longitude={loc.longitude}
              latitude={loc.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation()
                setSelectedPin(loc)
              }}
            >
              <div className={styles.pin} style={{ borderColor: PIN_TYPES[loc.type]?.color }}>
                {PIN_TYPES[loc.type]?.emoji}
              </div>
            </Marker>
          ))}

          {selectedPin && (
            <Popup
              longitude={selectedPin.longitude}
              latitude={selectedPin.latitude}
              anchor="bottom"
              onClose={() => setSelectedPin(null)}
              closeButton={true}
              className={styles.popup}
            >
              <div className={styles.popupContent}>
                <span className={styles.popupIcon}>{PIN_TYPES[selectedPin.type]?.emoji}</span>
                <div>
                  <div className={styles.popupName}>{selectedPin.name}</div>
                  <div className={styles.popupType}>{selectedPin.type}</div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {!loading && locations.length > 0 && (
        <div className={styles.legend}>
          {Object.entries(PIN_TYPES).map(([type, { emoji, color }]) => (
            locations.some(l => l.type === type) && (
              <span key={type} className={styles.legendItem}>
                <span>{emoji}</span>
                <span style={{ color }} className={styles.legendLabel}>{type}</span>
              </span>
            )
          ))}
        </div>
      )}
    </div>
  )
}