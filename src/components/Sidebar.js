import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconDashboard, IconDegerlendirme, IconUsers as IconKullanicilar, IconKriterler,
  IconHedefler, IconGecmis, IconRaporlar, IconLogout, IconActivity,
} from './icons';

function Sidebar() {
  const rol = localStorage.getItem('rol');
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const aktifSayfa = useLocation().pathname;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItem = (href, label, Icon) => (
    <Link
      to={href}
      style={{
        ...styles.menuItem,
        ...(aktifSayfa === href ? styles.menuItemAktif : {}),
      }}
    >
      <Icon />
      {label}
    </Link>
  );

  return (
    <div style={styles.sidebar}>
      <style>{`
        .cikis-buton:hover { color: #ef4444 !important; background-color: rgba(239,68,68,0.1) !important; }
        .profil-link:hover { background-color: rgba(255,255,255,0.05); }
      `}</style>
      <div style={styles.logo}>
        <span style={styles.logoIkon}><IconActivity /></span>
        <span>
          <span style={styles.logoIT}>IT</span>
          <span style={styles.logoPerformans}> Performans</span>
        </span>
      </div>
      <nav style={styles.nav}>
        {menuItem('/dashboard', 'Dashboard', IconDashboard)}
        {(rol === 'Admin' || rol === 'Evaluator') && menuItem('/degerlendirme', 'Değerlendirme', IconDegerlendirme)}
        {rol === 'Admin' && menuItem('/kullanicilar', 'Kullanıcılar', IconKullanicilar)}
        {rol === 'Admin' && menuItem('/kriterler', 'Kriterler', IconKriterler)}
        {menuItem('/hedefler', 'Hedefler', IconHedefler)}
        {menuItem('/gecmis', 'Geçmiş', IconGecmis)}
        {menuItem('/raporlar', 'Raporlar', IconRaporlar)}
      </nav>
      <div style={styles.altKisim}>
        <Link
          to="/profil"
          className="profil-link"
          style={{
            ...styles.kullanici,
            ...(aktifSayfa === '/profil' ? styles.kullaniciAktif : {}),
          }}
        >
          <div style={styles.avatar}>{ad?.[0]}{soyad?.[0]}</div>
          <div>
            <div style={styles.kullaniciAd}>{ad} {soyad}</div>
            <div style={styles.kullaniciRol}>{rol}</div>
          </div>
        </Link>
        <button onClick={handleLogout} className="cikis-buton" style={styles.cikisButon}>
          <IconLogout />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '220px',
    height: '100vh',
    boxSizing: 'border-box',
    backgroundColor: '#141414',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  logoIkon: {
    color: '#818cf8',
    display: 'flex',
    flexShrink: 0,
  },
  logoIT: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#818cf8',
  },
  logoPerformans: {
    fontSize: '18px',
    fontWeight: '300',
    color: '#e5e7eb',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '6px',
    fontSize: '15px',
    color: '#a0a0a0',
    textAlign: 'left',
    textDecoration: 'none',
  },
  menuItemAktif: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontWeight: '600',
  },
  altKisim: {
    borderTop: '1px solid #2a2a2a',
    paddingTop: '20px',
  },
  kullanici: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
    padding: '6px 8px',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'background-color 0.15s',
  },
  kullaniciAktif: {
    backgroundColor: 'rgba(79,70,229,0.15)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  kullaniciAd: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '600',
  },
  kullaniciRol: {
    fontSize: '12px',
    color: '#a0a0a0',
  },
  cikisButon: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 8px',
    marginTop: '10px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },
};

export default Sidebar;
