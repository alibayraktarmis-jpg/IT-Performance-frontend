import React, { useEffect, useState } from 'react';
import { toastAbone, toastListesiGetir, toastKapat } from '../services/toast';
import { IconCheck, IconAlertTriangle } from './icons';

function ToastContainer() {
  const [toastlar, setToastlar] = useState(toastListesiGetir());

  useEffect(() => toastAbone(setToastlar), []);

  if (toastlar.length === 0) return null;

  return (
    <div style={styles.kapsayici}>
      <style>{`@keyframes toast-giris { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {toastlar.map(t => (
        <div key={t.id} style={{ ...styles.toast, ...(t.tip === 'hata' ? styles.hataToast : styles.basariToast) }}>
          <span style={{ display: 'flex', flexShrink: 0 }}>
            {t.tip === 'hata' ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
          </span>
          <span style={{ flex: 1 }}>{t.mesaj}</span>
          <button type="button" onClick={() => toastKapat(t.id)} style={styles.kapatButon} aria-label="Bildirimi kapat">×</button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  kapsayici: {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
    display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px',
  },
  toast: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 14px', borderRadius: '8px', fontSize: '13px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)', border: '1px solid',
    animation: 'toast-giris 0.2s ease',
  },
  basariToast: { backgroundColor: '#1a2e22', borderColor: '#166534', color: '#4ade80' },
  hataToast: { backgroundColor: '#2e1a1a', borderColor: '#991b1b', color: '#f87171' },
  kapatButon: {
    background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
    fontSize: '16px', lineHeight: 1, padding: '0 2px', opacity: 0.7, flexShrink: 0,
  },
};

export default ToastContainer;
