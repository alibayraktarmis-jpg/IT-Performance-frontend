import React from 'react';

function Sidebar() {
  const rol = localStorage.getItem('rol');
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const aktifSayfa = window.location.pathname;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItem = (href, label) => (
    <a 
      href={href}
      style={{
        ...styles.menuItem,
        ...(aktifSayfa === href ? styles.menuItemAktif : {}),
      }}
    >
      {label}
    </a>
  );

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>IT Performans</div>
      <nav style={styles.nav}>
        {menuItem('/dashboard', 'Dashboard')}
        {(rol === 'Admin' || rol === 'Evaluator') && menuItem('/degerlendirme', 'Değerlendirme')}
        {rol === 'Admin' && menuItem('/kullanicilar', 'Kullanıcılar')}
        {rol === 'Admin' && menuItem('/kriterler', 'Kriterler')}
        {menuItem('/hedefler', 'Hedefler')}
        {menuItem('/gecmis', 'Geçmiş')}
        {menuItem('/raporlar', 'Raporlar')}
      </nav>
      {/* KAYBOLAN PROFİL VE ÇIKIŞ BUTONU GERİ GELDİ */}
      <div style={styles.altKisim}>
        <div style={styles.kullanici}>
          <div style={styles.avatar}>{ad?.[0]}{soyad?.[0]}</div>
          <div>
            <div style={styles.kullaniciAd}>{ad} {soyad}</div>
            <div style={styles.kullaniciRol}>{rol}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.cikisButon}>Çıkış Yap</button>
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
    fontSize: '18px',
    fontWeight: '700', 
    color: '#ffffff',
    marginBottom: '32px',
    textAlign: 'left', 
    paddingLeft: '8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1, // Bu kod alt kısmı en aşağıya itiyor
  },
  menuItem: {
    padding: '12px 14px',
    borderRadius: '6px', 
    fontSize: '15px',
    color: '#a0a0a0', 
    textAlign: 'left',  
    textDecoration: 'none',
  },
  menuItemAktif: {
    backgroundColor: '#4f46e5', // Yeni Ana Rengimiz
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
    padding: '6px 0', // Daha ince bir yapı
    marginTop: '10px',
    backgroundColor: 'transparent', // Arka planı transparan yapıyoruz
    color: '#d32f2f', // Sadece yazıyı kırmızı bırakıyoruz
    border: '0.5px solid #d32f2f', // İnce bir çerçeve
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default Sidebar;