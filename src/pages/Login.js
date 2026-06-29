import React, { useState } from 'react';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/Kullanicilar/login', { email, sifre });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('rol', response.data.rol);
      localStorage.setItem('ad', response.data.ad);
      localStorage.setItem('soyad', response.data.soyad);
      localStorage.setItem('id', response.data.id);
      window.location.href = '/dashboard';
    } catch (err) {
      setHata('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.baslikAlani}>
          <h2 style={styles.baslik}>IT Performans</h2>
          <p style={styles.altBaslik}>Hoş geldiniz! Devam etmek için lütfen giriş yapın.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="ornek@sirket.com"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          
          {hata && <div style={styles.hataKutusu}>{hata}</div>}
          
          <button type="submit" style={styles.buton}>Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101014', 
  },
  card: {
    backgroundColor: '#1c1c1c', 
    padding: '48px 40px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', 
    border: '1px solid #2a2a2a',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  baslikAlani: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  baslik: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '0.5px',
  },
  altBaslik: {
    color: '#a0a0a0',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
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
  input: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#141414', 
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none', 
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
  },
};

export default Login;