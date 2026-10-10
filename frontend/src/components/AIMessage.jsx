import React from 'react';
import { Bot, User } from 'lucide-react';

export default function AIMessage({ speaker, text, timestamp = 'Just now' }) {
  const isAI = speaker && (speaker.toLowerCase().includes('priya') || speaker.toLowerCase().includes('ai'));

  return (
    <div style={{ display: 'flex', gap: '12px', flexDirection: isAI ? 'row' : 'row-reverse', alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: isAI ? 'var(--gold-gradient)' : 'var(--bg-dark)',
        color: isAI ? '#111' : '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isAI ? <Bot size={18} /> : <User size={18} />}
      </div>

      {/* Bubble */}
      <div className={`chat-bubble ${isAI ? 'ai' : 'user'}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px', marginBottom: '4px', opacity: 0.7 }}>
          <span style={{ fontWeight: '600' }}>{speaker || (isAI ? 'Priya (AI Counselor)' : 'Student')}</span>
          <span>{timestamp}</span>
        </div>
        <p style={{ margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}
