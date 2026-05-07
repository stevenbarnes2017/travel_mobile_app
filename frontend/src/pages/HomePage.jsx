import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <div className={styles.hero}>
        <div className={styles.badge}>Mountain West</div>
        <h1 className={styles.title}>
          Find your next<br />
          <em>great escape</em>
        </h1>
        <p className={styles.sub}>
          AI-powered trip planning for Colorado, Utah, Wyoming & New Mexico.
          Day hikes to weekend adventures.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🗺️</span>
          <div>
            <div className={styles.featureTitle}>Full itineraries</div>
            <div className={styles.featureDesc}>Day-by-day plans with real trail names</div>
          </div>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🏕️</span>
          <div>
            <div className={styles.featureTitle}>Where to stay</div>
            <div className={styles.featureDesc}>Campgrounds, cabins, and hotels</div>
          </div>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🍺</span>
          <div>
            <div className={styles.featureTitle}>Food & drinks</div>
            <div className={styles.featureDesc}>Best spots near your adventure</div>
          </div>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🎒</span>
          <div>
            <div className={styles.featureTitle}>Gear checklist</div>
            <div className={styles.featureDesc}>What to pack for your specific trip</div>
          </div>
        </div>
      </div>

      <div className={styles.cta}>
        <button className={styles.btn} onClick={() => navigate('/plan')}>
          Plan my adventure
        </button>
        <p className={styles.hint}>Free · No account required</p>
      </div>
    </div>
  )
}
