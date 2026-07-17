import React, { useState } from 'react';
import { IconAlertTriangle, IconRotateCcw } from './icons';

export function Spinner({ boyut = 32 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
      <style>{`@keyframes spin-donus { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: boyut, height: boyut, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#6366f1',
        animation: 'spin-donus 0.7s linear infinite',
      }} />
    </div>
  );
}

export function HataKutusu({ mesaj = 'Veriler yüklenemedi.', onTekrarDene }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      padding: '48px 24px', backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a',
    }}>
      <div style={{ color: '#fb7185' }}><IconAlertTriangle size={28} /></div>
      <div style={{ fontSize: '14px', color: '#e0e0e0' }}>{mesaj}</div>
      {onTekrarDene && (
        <button type="button"
          onClick={onTekrarDene}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '6px', border: '1px solid #40404a',
            backgroundColor: hover ? '#3f3f4c' : '#303038', color: '#e0e0e0', fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.15s',
          }}
        >
          <IconRotateCcw size={14} /> Tekrar Dene
        </button>
      )}
    </div>
  );
}
