import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  IconDashboard, IconDegerlendirme, IconUsers as IconKullanicilar, IconKriterler,
  IconHedefler, IconGecmis, IconRaporlar, IconLogout, IconActivity, IconMenu,
} from './icons';

function Sidebar() {
  const rol = localStorage.getItem('rol');
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const id = localStorage.getItem('id');
  const aktifSayfa = useLocation().pathname;
  const [mobilAcik, setMobilAcik] = useState(false);
  const [yeniDegerlendirmeVar, setYeniDegerlendirmeVar] = useState(false);

  useEffect(() => {
    const oncekiGiris = localStorage.getItem('sonGirisTarihi');
    if (rol !== 'Employee' || !id || !oncekiGiris) return;
    api.get(`/Degerlendirmeler/calisan/${id}`).then(res => {
      const oncekiGirisMs = new Date(oncekiGiris).getTime();
      const yeniVarMi = (res.data || []).some(d => d.tarih && new Date(d.tarih).getTime() > oncekiGirisMs);
      setYeniDegerlendirmeVar(yeniVarMi);
    }).catch(() => {});
  }, [rol, id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItem = (href, label, Icon, rozet) => (
    <Link
      to={href}
      onClick={() => setMobilAcik(false)}
      style={{
        ...styles.menuItem,
        ...(aktifSayfa === href ? styles.menuItemAktif : {}),
      }}
    >
      <Icon />
      {label}
      {rozet && <span title="Yeni değerlendirme eklendi" style={styles.yeniNoktasi} />}
    </Link>
  );

  return (
    <>
      <style>{`
        .cikis-buton:hover { color: #ef4444 !important; background-color: rgba(239,68,68,0.1) !important; }
        .profil-link:hover { background-color: rgba(255,255,255,0.05); }
        .mobil-topbar { display: none; }
        .mobil-backdrop { display: none; }
        @media (max-width: 768px) {
          .mobil-topbar {
            display: flex; align-items: center; gap: 10px;
            position: fixed; top: 0; left: 0; right: 0; height: 56px;
            background-color: #141414; border-bottom: 1px solid #2a2a2a;
            padding: 0 16px; z-index: 150; color: #e5e7eb; font-weight: 600; font-size: 15px;
          }
          .mobil-hamburger-btn {
            display: flex; align-items: center; justify-content: center;
            width: 36px; height: 36px; border-radius: 6px; border: none;
            background-color: transparent; color: #e5e7eb; cursor: pointer; flex-shrink: 0;
          }
          .mobil-hamburger-btn:hover { background-color: rgba(255,255,255,0.08); }
          .app-sidebar { transform: translateX(-100%); transition: transform 0.25s ease; z-index: 300; }
          .app-sidebar.mobil-acik { transform: translateX(0); }
          .mobil-backdrop.mobil-acik { display: block; }
        }
      `}</style>

      <div className="mobil-topbar">
        <button type="button" className="mobil-hamburger-btn" aria-label="Menüyü aç" onClick={() => setMobilAcik(true)}>
          <IconMenu />
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#818cf8', display: 'flex' }}><IconActivity size={18} /></span>
          <span><span style={styles.logoIT}>IT</span><span style={styles.logoPerformans}> Performans</span></span>
        </span>
      </div>

      <div
        className={`mobil-backdrop${mobilAcik ? ' mobil-acik' : ''}`}
        onClick={() => setMobilAcik(false)}
        style={styles.backdrop}
      />

      <div className={`app-sidebar${mobilAcik ? ' mobil-acik' : ''}`} style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIkon}><IconActivity /></span>
        <span>
          <span style={styles.logoIT}>IT</span>
          <span style={styles.logoPerformans}> Performans</span>
        </span>
      </div>
      <nav style={styles.nav}>
        {menuItem('/dashboard', 'Dashboard', IconDashboard, yeniDegerlendirmeVar)}
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
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 250,
  },
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
  yeniNoktasi: {
    marginLeft: 'auto',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#818cf8',
    boxShadow: '0 0 6px rgba(129,140,248,0.8)',
    flexShrink: 0,
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
