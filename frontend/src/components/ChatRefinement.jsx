import React, { useState } from 'react'
import styles from './ChatRefinement.module.css'

export default function ChatRefinement({ trip, onTripUpdate, startCity, region }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])

  const handleSend = async () => {
    if (!message.trim()) return

    const userMessage = message.trim()
    setMessage('')
    setLoading(true)

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          current_trip: trip,
          start_city: startCity,
          region: region
        })
      })

      if (!res.ok) throw new Error('Chat failed')

      const data = await res.json()
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.chat_response 
      }])

      // Update the trip
      onTripUpdate(data.modified_trip)

    } catch (err) {
      console.error('Chat error:', err)
      setChatHistory(prev => [...prev, { 
        role: 'error', 
        content: 'Sorry, something went wrong. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>💬 Refine Your Trip</span>
        <span className={styles.subtitle}>Ask me to change anything!</span>
      </div>

      {chatHistory.length > 0 && (
        <div className={styles.chatHistory}>
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`${styles.message} ${styles[msg.role]}`}
            >
              <div className={styles.messageContent}>
                {msg.role === 'user' && <span className={styles.label}>You:</span>}
                {msg.role === 'assistant' && <span className={styles.label}>AI:</span>}
                <span>{msg.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputArea}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 'Make day 2 more adventurous' or 'Add a brewery on day 1'"
          disabled={loading}
          className={styles.input}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !message.trim()}
          className={styles.sendBtn}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      {chatHistory.length === 0 && (
        <div className={styles.examples}>
          <p className={styles.examplesTitle}>Try asking:</p>
          <button 
            onClick={() => setMessage("Make day 2 more adventurous")}
            className={styles.exampleBtn}
          >
            Make day 2 more adventurous
          </button>
          <button 
            onClick={() => setMessage("Add a brewery stop on day 1")}
            className={styles.exampleBtn}
          >
            Add a brewery stop on day 1
          </button>
          <button 
            onClick={() => setMessage("Change the lodging to something cheaper")}
            className={styles.exampleBtn}
          >
            Make lodging cheaper
          </button>
        </div>
      )}
    </div>
  )
}