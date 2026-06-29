import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Dashboard() {
  const rol = localStorage.getItem('rol');
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const id = localStorage.getItem('id');
  const [skorData, setSkorData] = useState(null);
  const [siralama, setSiralama] = useState([]);
  const [degerlendirmeler, setDegerlendirmeler] = useState([]);
  const [sonDegerlendirme, setSonDegerlendirme] = useState(null);
  const [employeeGrafik, setEmployeeGrafik] = useState([]);

  useEffect(() => {
    api.get('/Degerlendirmeler/siralama').then(res => setSiralama(res.data)).catch(() => {});

    if (rol === 'Employee') {
      api.get(`/Degerlendirmeler/skor/${id}`).then(res => setSkorData(res.data)).catch(() => {});
      api.get(`/Degerlendirmeler/calisan/${id}`).then(res => {
        const liste = res.data;
        setDegerlendirmeler(liste);
        if (liste.length > 0) {
          const son = liste[liste.length - 1];
          setSonDegerlendirme(son);
        }
        const donemGrup = {};
        liste.forEach(d => {
          const donem = d.Donem || d.donem;
          const skor = d.ToplamSkor ?? d.toplamSkor;
          if (donem && skor != null) {
            if (!donemGrup[donem]) donemGrup[donem] = [];
            donemGrup[donem].push(parseFloat(skor));
          }
        });
        const grafik = Object.entries(donemGrup)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([donem, skorlar]) => ({
            name: donem,
            skor: parseFloat((skorlar.reduce((s, x) => s + x, 0) / skorlar.length).toFixed(2))
          }));
        setEmployeeGrafik(grafik);
      }).catch(() => {});
    }
  }, []);

  const genelOrtalama = employeeGrafik.length > 0
    ? (employeeGrafik.reduce((s, x) => s + x.skor, 0) / employeeGrafik.length).toFixed(1)
    : null;

  const enYuksek = employeeGrafik.length > 0
    ? employeeGrafik.reduce((a, b) => a.skor > b.skor ? a : b)
    : null;

  return (
    <div style={styles.sayfa}>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={{ marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' }}>
          <h2 style={styles.baslik}>Dashboard</h2>
          <p style={styles.altBaslik}>Hoş geldin, {ad} {soyad}</p>
        </div>

        {rol === 'Employee' && (
          <>
            <div style={styles.kartGrid}>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Genel Ortalama</div>
                <div style={styles.kartDeger}>{genelOrtalama ?? '-'}</div>
              </div>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>En Yüksek Dönem</div>
                <div style={styles.kartDeger}>{enYuksek ? enYuksek.name : '-'}</div>
                {enYuksek && <div style={{ fontSize: '13px', color: '#4ade80', marginTop: '4px' }}>{enYuksek.skor} puan</div>}
              </div>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Değerlendirme Sayısı</div>
                <div style={styles.kartDeger}>{degerlendirmeler.length}</div>
              </div>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Son Değerlendirme</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginTop: '4px' }}>
                  {sonDegerlendirme
                    ? new Date(sonDegerlendirme.Tarih || sonDegerlendirme.tarih).toLocaleDateString('tr-TR')
                    : '-'}
                </div>
                {sonDegerlendirme && (
                  <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>
                    {sonDegerlendirme.Donem || sonDegerlendirme.donem}
                  </div>
                )}
              </div>
            </div>

            {skorData && (skorData.KategoriDetay || skorData.kategoriDetay) && (
              <div style={styles.bolum}>
                <div style={styles.bolumBaslik}>Kategori Skorlarım</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(skorData.KategoriDetay || skorData.kategoriDetay).map((k, i) => {
                    const puan = k.OrtalmaPuan ?? k.ortalmaPuan ?? 0;
                    const yuzde = (puan / 5) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', color: '#e0e0e0' }}>{k.Baslik || k.baslik}</span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#4f46e5' }}>{puan ? puan.toFixed(1) : '-'} / 5</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#2a2a2a', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${yuzde}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sonDegerlendirme && (sonDegerlendirme.Yorum || sonDegerlendirme.yorum) && (
              <div style={styles.bolum}>
                <div style={styles.bolumBaslik}>Son Yorum</div>
                <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: '1.7', padding: '16px', backgroundColor: '#1c1c1c', borderRadius: '8px', borderLeft: '3px solid #4f46e5' }}>
                  "{sonDegerlendirme.Yorum || sonDegerlendirme.yorum}"
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '8px' }}>
                  {sonDegerlendirme.Donem || sonDegerlendirme.donem} · {new Date(sonDegerlendirme.Tarih || sonDegerlendirme.tarih).toLocaleDateString('tr-TR')}
                </div>
              </div>
            )}
          </>
        )}

        {(rol === 'Admin' || rol === 'Evaluator') && (
          <>
            <div style={styles.kartGrid}>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Toplam Çalışan</div>
                <div style={styles.kartDeger}>{siralama.filter(s => s.Rol === 'Employee').length}</div>
              </div>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Değerlendirilen</div>
                <div style={styles.kartDeger}>{siralama.filter(s => s.OrtalamaToplamSkor && s.Rol === 'Employee').length}</div>
              </div>
              <div style={styles.kart}>
                <div style={styles.kartEtiket}>Genel Ortalama</div>
                <div style={styles.kartDeger}>
                  {(() => {
                    const emp = siralama.filter(s => s.Rol === 'Employee' && s.OrtalamaToplamSkor);
                    return emp.length > 0
                      ? (emp.reduce((a, b) => a + b.OrtalamaToplamSkor, 0) / emp.length).toFixed(1)
                      : '-';
                  })()}
                </div>
              </div>
            </div>

            <div style={styles.bolum}>
              <div style={styles.bolumBaslik}>Sıralama</div>
              <table style={styles.tabloEl}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Ad Soyad</th>
                    <th style={styles.th}>Departman</th>
                    <th style={styles.th}>Rol</th>
                    <th style={styles.th}>Ortalama Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {siralama.length > 0 ? siralama.map((s, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>{s.Ad} {s.Soyad}</td>
                      <td style={styles.td}>{s.Departman}</td>
                      <td style={styles.td}>{s.Rol}</td>
                      <td style={styles.td}>{s.OrtalamaToplamSkor ? s.OrtalamaToplamSkor.toFixed(2) : '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>Henüz değerlendirme verisi bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  sayfa: { display: 'flex', backgroundColor: '#1c1c1c', minHeight: '100vh', color: '#fff' },
  icerik: { marginLeft: '220px', padding: '32px 40px', flex: 1 },
  baslik: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' },
  altBaslik: { fontSize: '14px', color: '#a0a0a0', margin: 0 },
  kartGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  kart: { backgroundColor: '#242424', borderRadius: '8px', padding: '20px', borderBottom: '3px solid #4f46e5', border: '1px solid #2a2a2a', borderBottomColor: '#4f46e5', borderBottomWidth: '3px' },
  kartEtiket: { fontSize: '12px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' },
  kartDeger: { fontSize: '28px', fontWeight: '700', color: '#ffffff' },
  bolum: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', border: '1px solid #2a2a2a', marginBottom: '20px' },
  bolumBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '20px' },
  tabloEl: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333' },
  td: { padding: '12px 12px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
};

export default Dashboard;
