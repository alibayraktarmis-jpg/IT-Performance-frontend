import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
);
const IconDegerlendirme = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/>
    <path d="m9 14 2 2 4-4"/>
  </svg>
);
const IconKullanicilar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconKriterler = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);
const IconHedefler = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconGecmis = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>
  </svg>
);
const IconRaporlar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

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
        <div style={styles.kullanici}>
          <div style={styles.avatar}>{ad?.[0]}{soyad?.[0]}</div>
          <div>
            <div style={styles.kullaniciAd}>{ad} {soyad}</div>
            <div style={styles.kullaniciRol}>{rol}</div>
          </div>
        </div>
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
    paddingLeft: '8px',
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
