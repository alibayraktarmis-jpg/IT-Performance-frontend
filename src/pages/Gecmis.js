import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Gecmis() {
  const rol = localStorage.getItem('rol');
  const [degerlendirmeler, setDegerlendirmeler] = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [filtre, setFiltre] = useState('');

  useEffect(() => {
    api.get('/Degerlendirmeler').then(res => setDegerlendirmeler(res.data)).catch(() => {});
    if (rol === 'Admin' || rol === 'Evaluator') {
      api.get('/Kullanicilar').then(res => setKullanicilar(res.data)).catch(() => {});
    }
  }, []);

  const isimBul = (calisanId) => {
    const k = kullanicilar.find(u => (u.id || u.Id) === calisanId);
    return k ? `${k.ad || k.Ad} ${k.soyad || k.Soyad}` : `#${calisanId}`;
  };

  const filtrelenmis = degerlendirmeler.filter(d => {
    if (!filtre) return true;
    const ad = isimBul(d.CalisanId || d.calisanId).toLowerCase();
    const donem = (d.Donem || d.donem || '').toLowerCase();
    const yorum = (d.Yorum || d.yorum || '').toLowerCase();
    return ad.includes(filtre.toLowerCase()) || donem.includes(filtre.toLowerCase()) || yorum.includes(filtre.toLowerCase());
  });

  return (
    <div style={styles.sayfa}>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Değerlendirme Geçmişi</h2>
            <p style={styles.altBaslik}>
              {rol === 'Employee' ? 'Size yapılan tüm değerlendirmeler' : 'Tüm değerlendirme kayıtları'}
            </p>
          </div>
          <input
            style={styles.aramaInput}
            placeholder="Ara..."
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
          />
        </div>

        <div style={styles.kart}>
          <table style={styles.tablo}>
            <thead>
              <tr>
                {rol !== 'Employee' && <th style={styles.th}>Çalışan</th>}
                <th style={styles.th}>Dönem</th>
                <th style={styles.th}>Tarih</th>
                <th style={styles.th}>Toplam Skor</th>
                <th style={styles.th}>Yorum</th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.length === 0 ? (
                <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#a0a0a0' }}>Kayıt bulunamadı.</td></tr>
              ) : (
                filtrelenmis.map((d, i) => {
                  const skor = d.ToplamSkor ?? d.toplamSkor;
                  const donem = d.Donem || d.donem || '-';
                  const tarih = d.Tarih || d.tarih;
                  const yorum = d.Yorum || d.yorum || '-';
                  const calisanId = d.CalisanId || d.calisanId;
                  return (
                    <tr key={i} style={styles.satir}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {rol !== 'Employee' && (
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500', color: '#e0e0e0' }}>{isimBul(calisanId)}</div>
                        </td>
                      )}
                      <td style={styles.td}>
                        <span style={styles.donemBadge}>{donem}</span>
                      </td>
                      <td style={styles.td}>
                        {tarih ? new Date(tarih).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          fontWeight: '700', fontSize: '15px',
                          color: skor >= 80 ? '#4ade80' : skor >= 60 ? '#f59e0b' : '#f87171'
                        }}>
                          {skor != null ? parseFloat(skor).toFixed(1) : '-'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, maxWidth: '300px', color: '#a0a0a0', fontSize: '13px', fontStyle: yorum === '-' ? 'italic' : 'normal' }}>
                        {yorum}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sayfa: { display: 'flex', backgroundColor: '#1c1c1c', minHeight: '100vh', color: '#fff' },
  icerik: { marginLeft: '220px', padding: '32px 40px', flex: 1 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' },
  baslik: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' },
  altBaslik: { fontSize: '14px', color: '#a0a0a0', margin: 0 },
  aramaInput: { padding: '10px 14px', backgroundColor: '#242424', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', width: '220px' },
  kart: { backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a', overflow: 'hidden' },
  tablo: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  satir: { transition: 'background 0.1s' },
  donemBadge: { padding: '3px 10px', backgroundColor: '#2a2a3a', color: '#818cf8', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
};

export default Gecmis;
