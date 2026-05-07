import React from 'react'
import styles from './ChipSelector.module.css'

export default function ChipSelector({ options, selected, onToggle }) {
  return (
    <div className={styles.chips}>
      {options.map(({ label, value }) => (
        <button
          key={value}
          className={`${styles.chip} ${selected.includes(value) ? styles.active : ''}`}
          onClick={() => onToggle(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
