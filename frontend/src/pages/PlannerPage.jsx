import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { planTrip } from '../utils/api'
import ChipSelector from '../components/ChipSelector'
import LoadingScreen from '../components/LoadingScreen'
import CitySearch from '../components/CitySearch'
import styles from './PlannerPage.module.css'

const VIBES = [
  { label: '🚗 Scenic drives', value: 'scenic drives' },
  { label: '🍽️ Great food', value: 'great food & restaurants' },
  { label: '🥾 Hiking', value: 'hiking' },
  { label: '🍻 Breweries', value: 'breweries & craft beer' },
  { label: '⛺ Camping', value: 'camping' },
  { label: '👨‍👩‍👧 Kids activities', value: 'kid-friendly activities' },
  { label: '🌸 Wildflowers', value: 'wildflowers' },
  { label: '💧 Waterfalls', value: 'waterfalls' },
  { label: '♨️ Hot springs', value: 'hot springs' },
  { label: '📷 Photography', value: 'photography' },
  { label: '🦌 Wildlife', value: 'wildlife' },
  { label: '🌌 Stargazing', value: 'stargazing' },
  { label: '⛷️ Snow / Skiing', value: 'skiing & snow activities' },
  { label: '🛷 Winter fun', value: 'winter activities' },
]

const SEASONS = [
  { label: '☀️ Summer', value: 'summer' },
  { label: '🍂 Fall', value: 'fall' },
  { label: '❄️ Winter', value: 'winter' },
  { label: '🌱 Spring', value: 'spring' },
]

export default function PlannerPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    start_city: 'Denver, CO',
    trip_length: 'weekend (2 days)',
    difficulty: 'moderate',
    region: 'Colorado',
    season: 'summer',
    vibes: ['scenic drives', 'great food & restaurants'],
    extra_notes: '',
  })

  const hikingSelected = form.vibes.includes('hiking')
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleVibe = (val) => {
    setForm(prev => ({
      ...prev,
      vibes: prev.vibes.includes(val)
        ? prev.vibes.filter(v => v !== val)
        : [...prev.vibes, val]
    }))
  }

  const handleSubmit = async () => {
    if (!form.start_city.trim()) {
      setError('Please enter your starting city.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await planTrip(form)
      navigate('/result', { state: { result, form } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen vibes={form.vibes} />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>←</button>
        <h1 className={styles.title}>Plan your trip</h1>
      </div>

      <div className={styles.form}>

        <div className={styles.field}>
          <label className={styles.label}>Starting city or zip code</label>
          <CitySearch
            value={form.start_city}
            onChange={(val) => update('start_city', val)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Season</label>
          <div className={styles.seasonRow}>
            {SEASONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`${styles.seasonBtn} ${form.season === value ? styles.seasonActive : ''}`}
                onClick={() => update('season', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Trip length</label>
            <select
              className={styles.select}
              value={form.trip_length}
              onChange={e => update('trip_length', e.target.value)}
            >
              <option value="day trip">Day trip</option>
              <option value="weekend (2 days)">Weekend</option>
              <option value="long weekend (3 days)">Long weekend</option>
              <option value="week-long">Full week</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Region</label>
            <select
              className={styles.select}
              value={form.region}
              onChange={e => update('region', e.target.value)}
            >
              <option value="anywhere in the Mountain West">Anywhere</option>
              <option value="Colorado">Colorado</option>
              <option value="Utah">Utah</option>
              <option value="Wyoming">Wyoming</option>
              <option value="New Mexico">New Mexico</option>
            </select>
          </div>
        </div>

        {hikingSelected && (
          <div className={styles.field}>
            <label className={styles.label}>Hiking difficulty</label>
            <select
              className={styles.select}
              value={form.difficulty}
              onChange={e => update('difficulty', e.target.value)}
            >
              <option value="easy / family-friendly">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
              <option value="strenuous / expert">Strenuous</option>
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>What are you into?</label>
          <ChipSelector options={VIBES} selected={form.vibes} onToggle={toggleVibe} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Anything else?</label>
          <textarea
            className={styles.textarea}
            value={form.extra_notes}
            onChange={e => update('extra_notes', e.target.value)}
            placeholder="Going with my wife, prefer a bed over camping, love craft beer after a hike..."
            rows={3}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={loading}
        >
          Plan my adventure →
        </button>
      </div>
    </div>
  )
}