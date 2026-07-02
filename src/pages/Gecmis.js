import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Gecmis() {
  const rol = localStorage.getItem('rol');
  const kullaniciId = localStorage.getItem('id');
  const [calisanlar, setCalisanlar] = useState([]);
  const [secilenCalisan, setSecilenCalisan] = useState(null);
  const [degerlendirmeler, setDegerlendirmeler] = useState([]);
  const [arama, setArama] = useState('');
  const [secilenDepFiltre, setSecilenDepFiltre] = useState('Tümü');

  useEffect(() => {
    if (rol === 'Employee') {
      api.get(`/Degerlendirmeler/calisan/${kullaniciId}`).then(res => {
        setDegerlendirmeler(res.data);
      }).catch(() => {});
    } else {
      api.get('/Kullanicilar').then(res => {
        const emplar = res.data.filter(k => (k.rol || k.Rol) === 'Employee');
        setCalisanlar(emplar);
      }).catch(() => {});
    }
  }, []);

  const calisanSec = (calisan) => {
    setSecilenCalisan(calisan);
    const id = calisan.id || calisan.Id;
    api.get(`/Degerlendirmeler/calisan/${id}`).then(res => {
      setDegerlendirmeler(res.data);
    }).catch(() => {});
  };

  const filtreliCalisanlar = calisanlar.filter(c => {
    const isim = `${c.ad || c.Ad} ${c.soyad || c.Soyad}`.toLowerCase();
    const depEsles = secilenDepFiltre === 'Tümü' || (c.departman || c.Departman) === secilenDepFiltre;
    return isim.includes(arama.toLowerCase()) && depEsles;
  });

  const skorRenk = (skor) => skor >= 80 ? '#4ade80' : skor >= 60 ? '#f59e0b' : '#f87171';

  if (rol === 'Employee') {
    return (
      <div style={styles.sayfa}>
        <Sidebar />
        <div style={styles.icerik}>
          <div style={{ marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' }}>
            <h2 style={styles.baslik}>Değerlendirme Geçmişim</h2>
            <p style={styles.altBaslik}>Size yapılan tüm değerlendirmeler</p>
          </div>
          <div style={styles.kart}>
            {degerlendirmeler.length === 0 ? (
              <div style={styles.bos}>Henüz değerlendirme kaydı bulunmuyor.</div>
            ) : (
              <table style={styles.tablo}>
                <thead>
                  <tr>
                    <th style={styles.th}>Dönem</th>
                    <th style={styles.th}>Tarih</th>
                    <th style={styles.th}>Toplam Skor</th>
                    <th style={styles.th}>Yorum</th>
                  </tr>
                </thead>
                <tbody>
                  {degerlendirmeler.map((d, i) => {
                    const skor = d.ToplamSkor ?? d.toplamSkor;
                    return (
                      <tr key={i} style={styles.satir}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={styles.td}><span style={styles.donemBadge}>{d.Donem || d.donem}</span></td>
                        <td style={styles.td}>{(() => { const t = d.Tarih || d.tarih; return t && !t.startsWith('0001') ? new Date(t).toLocaleDateString('tr-TR') : '-'; })()}</td>
                        <td style={styles.td}><span style={{ fontWeight: '700', fontSize: '15px', color: skorRenk(skor) }}>{skor != null ? parseFloat(skor).toFixed(1) : '-'}</span></td>
                        <td style={{ ...styles.td, color: '#a0a0a0', fontSize: '13px' }}>{d.Yorum || d.yorum || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sayfa}>
      <style>{`
        .calisan-scroll::-webkit-scrollbar { width: 6px; }
        .calisan-scroll::-webkit-scrollbar-track { background: transparent; }
        .calisan-scroll::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 99px; }
        .calisan-scroll::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
        .gec-arama::placeholder { color: #6b7280; }
        .gec-arama:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.3); }
        .gec-chip:hover { background-color: #374151 !important; color: #e5e7eb !important; border-color: #4b5563 !important; }
        .gec-liste-item:hover { background-color: #1f2937 !important; }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={{ marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' }}>
          <h2 style={styles.baslik}>Değerlendirme Geçmişi</h2>
          <p style={styles.altBaslik}>Çalışan seçerek geçmiş değerlendirmeleri görüntüleyin</p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Sol — çalışan listesi */}
          <div style={{ width: '260px', flexShrink: 0 }}>
            <input
              className="gec-arama"
              style={styles.aramaInput}
              placeholder="Çalışan ara..."
              value={arama}
              onChange={e => setArama(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['Tümü', 'İş Analistleri', 'Yazılımcılar', 'QA/Test Uzmanları'].map(dep => (
                <button
                  key={dep}
                  className={secilenDepFiltre === dep ? '' : 'gec-chip'}
                  onClick={() => setSecilenDepFiltre(dep)}
                  style={{
                    padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', transition: 'all 0.15s',
                    backgroundColor: secilenDepFiltre === dep ? '#4f46e5' : '#1f2937',
                    color: secilenDepFiltre === dep ? '#fff' : '#9ca3af',
                    border: secilenDepFiltre === dep ? '1px solid #4f46e5' : '1px solid transparent',
                  }}
                >{dep === 'Tümü' ? 'Tümü' : dep === 'İş Analistleri' ? 'Analist' : dep === 'Yazılımcılar' ? 'Yazılımcı' : 'QA'}</button>
              ))}
            </div>
            <div className="calisan-scroll" style={styles.calisanListesi}>
              {filtreliCalisanlar.length === 0 ? (
                <div style={{ padding: '16px', color: '#555', fontSize: '13px' }}>Sonuç bulunamadı</div>
              ) : filtreliCalisanlar.map((c, i) => {
                const id = c.id || c.Id;
                const secili = secilenCalisan && (secilenCalisan.id || secilenCalisan.Id) === id;
                return (
                  <div key={i} onClick={() => calisanSec(c)} className={secili ? '' : 'gec-liste-item'} style={{
                    padding: '12px 16px', cursor: 'pointer', borderRadius: '6px', transition: 'background-color 0.15s',
                    backgroundColor: secili ? '#2a2a3a' : 'transparent',
                    borderLeft: secili ? '3px solid #4f46e5' : '3px solid transparent',
                    marginBottom: '2px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatar}>{(c.ad || c.Ad)?.[0]}{(c.soyad || c.Soyad)?.[0]}</div>
                      <div>
                        <div style={{ fontSize: '14px', color: secili ? '#818cf8' : '#e0e0e0', fontWeight: secili ? '600' : '400' }}>
                          {c.ad || c.Ad} {c.soyad || c.Soyad}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{c.departman || c.Departman}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sağ — seçilen kişinin geçmişi */}
          <div style={{ flex: 1 }}>
            {!secilenCalisan ? (
              <div style={styles.bosSecim}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div style={{ color: '#9ca3af', fontSize: '18px', fontWeight: '500' }}>Geçmişini görüntülemek için sol listeden bir çalışan seçin</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.avatarBuyuk}>
                    {(secilenCalisan.ad || secilenCalisan.Ad)?.[0]}
                    {(secilenCalisan.soyad || secilenCalisan.Soyad)?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                      {secilenCalisan.ad || secilenCalisan.Ad} {secilenCalisan.soyad || secilenCalisan.Soyad}
                    </div>
                    <div style={{ fontSize: '13px', color: '#a0a0a0' }}>{secilenCalisan.departman || secilenCalisan.Departman}</div>
                  </div>
                </div>

                <div style={styles.kart}>
                  {degerlendirmeler.length === 0 ? (
                    <div style={styles.bos}>Bu çalışan için henüz değerlendirme kaydı bulunmuyor.</div>
                  ) : (
                    <table style={styles.tablo}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Dönem</th>
                          <th style={styles.th}>Tarih</th>
                          <th style={styles.th}>Toplam Skor</th>
                          <th style={styles.th}>Yorum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {degerlendirmeler.map((d, i) => {
                          const skor = d.ToplamSkor ?? d.toplamSkor;
                          return (
                            <tr key={i} style={styles.satir}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={styles.td}><span style={styles.donemBadge}>{d.Donem || d.donem}</span></td>
                              <td style={styles.td}>{(() => { const t = d.Tarih || d.tarih; return t && !t.startsWith('0001') ? new Date(t).toLocaleDateString('tr-TR') : '-'; })()}</td>
                              <td style={styles.td}><span style={{ fontWeight: '700', fontSize: '15px', color: skorRenk(skor) }}>{skor != null ? parseFloat(skor).toFixed(1) : '-'}</span></td>
                              <td style={{ ...styles.td, color: '#a0a0a0', fontSize: '13px' }}>{d.Yorum || d.yorum || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sayfa: { display: 'flex', backgroundColor: '#1c1c1c', minHeight: '100vh', color: '#fff' },
  icerik: { marginLeft: '220px', padding: '32px 40px', flex: 1 },
  baslik: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' },
  altBaslik: { fontSize: '14px', color: '#a0a0a0', margin: 0 },
  aramaInput: { width: '100%', padding: '10px 14px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#e5e7eb', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  calisanListesi: { backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '8px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2a2a3a', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  avatarBuyuk: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2a2a3a', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', flexShrink: 0 },
  kart: { backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a', overflow: 'hidden' },
  tablo: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.03)' },
  td: { padding: '18px 16px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  satir: { transition: 'background 0.1s' },
  donemBadge: { padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#d1d5db', borderRadius: '5px', fontSize: '12px', fontWeight: '500' },
  bos: { padding: '32px', textAlign: 'center', color: '#555', fontSize: '14px' },
  bosSecim: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', backgroundColor: 'rgba(17,24,39,0.5)', borderRadius: '16px', border: '2px dashed #374151', color: '#888', fontSize: '14px' },
};

export default Gecmis;
