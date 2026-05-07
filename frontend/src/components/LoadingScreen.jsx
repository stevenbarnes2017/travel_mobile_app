import React, { useState, useEffect } from 'react'
import styles from './LoadingScreen.module.css'

const MESSAGES = [
  { icon: '🗺️', text: 'Scouting the best trails...' },
  { icon: '⛰️', text: 'Checking mountain conditions...' },
  { icon: '🍺', text: 'Finding the best breweries nearby...' },
  { icon: '🎒', text: 'Packing your gear bag...' },
  { icon: '🏕️', text: 'Finding where to set up camp...' },
  { icon: '🌤️', text: 'Checking the mountain weather...' },
  { icon: '📍', text: 'Pinning the best spots...' },
  { icon: '🦌', text: 'Watching for wildlife...' },
  { icon: '🍽️', text: 'Reserving the best table in town...' },
  { icon: '💡', text: 'Gathering insider tips...' },
]

export default function LoadingScreen({ vibes = [] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  const brewerySelected = vibes.includes('breweries & craft beer')
  const hikingSelected = vibes.includes('hiking')
  const campingSelected = vibes.includes('camping')

  const getMessages = () => {
    let msgs = [...MESSAGES]
    if (!brewerySelected) msgs = msgs.filter(m => !m.text.includes('breweries'))
    if (!hikingSelected) msgs = msgs.filter(m => !m.text.includes('trails'))
    if (!campingSelected) msgs = msgs.filter(m => !m.text.includes('camp'))
    return msgs
  }

  const messages = getMessages()

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  const msg = messages[index % messages.length]

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <span className={`${styles.icon} ${visible ? styles.visible : ''}`}>
            {msg.icon}
          </span>
        </div>
        <div className={styles.spinner}>
          <div className={styles.ring} />
        </div>
        <p className={`${styles.message} ${visible ? styles.visible : ''}`}>
          {msg.text}
        </p>
        <p className={styles.hint}>This usually takes 5-10 seconds</p>
      </div>
    </div>
  )
}
