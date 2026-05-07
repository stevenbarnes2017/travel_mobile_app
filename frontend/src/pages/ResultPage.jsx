import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import styles from './ResultPage.module.css'

const SECTIONS = [
  { key: 'overview',     icon: '🏔️', label: 'Trip Overview' },
  { key: 'destination',  icon: '📍', label: 'Destination & Getting There' },
  { key: 'itinerary',    icon: '🗺️', label: 'Day-by-Day Itinerary' },
  { key: 'lodging',      icon: '🏕️', label: 'Where to Stay' },
  { key: 'food',         icon: '🍺', label: 'Food & Drink Stops' },
  { key: 'gear',         icon: '🎒', label: 'Gear Checklist' },
  { key: 'pro_tips',     icon: '💡', label: 'Pro Tips' },
]

export default function ResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()

  if (!state?.result) {
    navigate('/')
    return null
  }

  const { result, form } = state

  const regionLabel = form.region === 'anywhere in the Mountain West'
    ? 'Mountain West'
    : form.region

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/plan')}>←</button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{regionLabel} Adventure</h1>
          <span className={styles.badge}>{form.trip_length} · {form.season}</span>
        </div>
      </div>

      <div className={styles.sections}>
        {SECTIONS.map(({ key, icon, label }) =>
          result[key] ? (
            <div key={key} className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{icon}</span>
                <h2 className={styles.sectionTitle}>{label}</h2>
              </div>
              <div className={styles.markdown}>
                <ReactMarkdown>{result[key]}</ReactMarkdown>
              </div>
            </div>
          ) : null
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.btnOutline} onClick={() => navigate('/plan')}>
          Plan another trip
        </button>
        <button className={styles.btnPrimary} onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </div>
  )
}
