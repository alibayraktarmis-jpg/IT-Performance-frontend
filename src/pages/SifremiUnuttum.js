import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { IconActivity, IconMail } from '../components/icons';

function SifremiUnuttum() {
  const [email, setEmail] = useState('');
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleGonder = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await api.post('/Kullanicilar/sifremi-unuttum', { email });
      setGonderildi(true);
    } catch {
      setHata('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .login-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 1px #6366f1; }
        .login-buton:hover:not(:disabled) { background-color: #4f46e5; box-shadow: 0 10px 25px rgba(99,102,241,0.25); }
        .geri-link:hover { color: #a5b4fc !important; }
      `}</style>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.baslikAlani}>
          <div style={styles.logoIkon}><IconActivity size={24} /></div>
          <h2 style={styles.baslik}>Şifremi Unuttum</h2>
          <p style={styles.altBaslik}>
            {gonderildi
              ? 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.'
              : 'Hesabınıza kayıtlı email adresinizi girin, size bir sıfırlama bağlantısı gönderelim.'}
          </p>
        </div>

        {!gonderildi && (
          <form onSubmit={handleGonder}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-posta Adresi</label>
              <div style={{ position: 'relative' }}>
                <div style={styles.inputIkon}><IconMail size={16} /></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  style={styles.input}
                  placeholder="ornek@sirket.com"
                  required
                />
              </div>
            </div>

            {hata && <div style={styles.hataKutusu}>{hata}</div>}

            <button type="submit" className="login-buton" style={styles.buton} disabled={yukleniyor}>
              {yukleniyor ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
          </form>
        )}

        <div style={styles.geriSatiri}>
          <Link to="/login" className="geri-link" style={styles.geriLink}>← Girişe dön</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '700px',
    height: '700px',
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(24,24,27,0.8)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 0 40px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '448px',
    boxSizing: 'border-box',
  },
  baslikAlani: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIkon: {
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(99,102,241,0.2)',
    color: '#818cf8',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  baslik: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '0.5px',
  },
  altBaslik: {
    color: '#a0a0a0',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.6',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: '#b3b3b3',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  inputIkon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingLeft: '12px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    color: '#64748b',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 40px',
    backgroundColor: '#141414',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  hataKutusu: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    border: '1px solid rgba(211, 47, 47, 0.3)',
    color: '#ff4d4d',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  buton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  },
  geriSatiri: {
    textAlign: 'center',
    marginTop: '24px',
  },
  geriLink: {
    fontSize: '13px',
    color: '#818cf8',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
};

export default SifremiUnuttum;
