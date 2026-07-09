import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { DEPARTMANLAR, DEPARTMAN_ROZET_ADI } from '../constants/departmanlar';

function Gecmis() {
  const rol = localStorage.getItem('rol');
  const kullaniciId = localStorage.getItem('id');
  const kullaniciDepartman = localStorage.getItem('departman');
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
        // Backend zaten role gore kapsamı sınırlıyor (Evaluator sadece kendi ekibini, Admin herkesi alır);
        // burada departmana gore ek bir filtre uygulamak, Evaluator'ın kendi departmanı sonradan
        // degistirilirse (localStorage'daki eski deger yuzunden) kendi ekibinin gorunmez olmasina yol acardı.
        const emplar = res.data.filter(k => k.rol === 'Employee');
        setCalisanlar(emplar);
      }).catch(() => {});
    }
  }, [rol, kullaniciId, kullaniciDepartman]);

  const calisanSec = (calisan) => {
    setSecilenCalisan(calisan);
    api.get(`/Degerlendirmeler/calisan/${calisan.id}`).then(res => {
      setDegerlendirmeler(res.data);
    }).catch(() => {});
  };

  const filtreliCalisanlar = calisanlar.filter(c => {
    const isim = `${c.ad} ${c.soyad}`.toLowerCase();
    const depEsles = secilenDepFiltre === 'Tümü' || c.departman === secilenDepFiltre;
    return isim.includes(arama.toLowerCase()) && depEsles;
  });

  const skorRenk = (skor) => skor >= 80 ? '#34d399' : skor >= 60 ? '#fbbf24' : '#fb7185';

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
                    const skor = d.toplamSkor;
                    return (
                      <tr key={i} style={styles.satir}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={styles.td}><span style={styles.donemBadge}>{d.donem}</span></td>
                        <td style={styles.td}>{d.tarih && !d.tarih.startsWith('0001') ? new Date(d.tarih).toLocaleDateString('tr-TR') : '-'}</td>
                        <td style={styles.td}><span style={{ fontWeight: '700', fontSize: '15px', color: skorRenk(skor) }}>{skor != null ? parseFloat(skor).toFixed(1) : '-'}</span></td>
                        <td style={{ ...styles.td, color: '#a0a0a0', fontSize: '13px' }}>{d.yorum || '-'}</td>
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
        .gec-arama:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 1px #6366f1; }
        .gec-chip:hover { background-color: #3a3a3a !important; color: #e5e7eb !important; border-color: #4a4a4a !important; }
        .gec-liste-item:hover { background-color: #2a2a2a !important; }
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
            <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <svg
                  style={{ display: 'block', color: '#64748b' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                className="gec-arama"
                style={styles.aramaInput}
                placeholder="Çalışan ara..."
                value={arama}
                onChange={e => setArama(e.target.value)}
              />
            </div>
            {rol === 'Admin' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {['Tümü', ...DEPARTMANLAR].map(dep => (
                  <button
                    key={dep}
                    className={secilenDepFiltre === dep ? '' : 'gec-chip'}
                    onClick={() => setSecilenDepFiltre(dep)}
                    style={{
                      padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', transition: 'all 0.15s',
                      backgroundColor: secilenDepFiltre === dep ? '#4f46e5' : '#242424',
                      color: secilenDepFiltre === dep ? '#fff' : '#9ca3af',
                      border: secilenDepFiltre === dep ? '1px solid #4f46e5' : '1px solid transparent',
                    }}
                  >{dep === 'Tümü' ? 'Tümü' : DEPARTMAN_ROZET_ADI[dep]}</button>
                ))}
              </div>
            )}
            <div className="calisan-scroll" style={styles.calisanListesi}>
              {filtreliCalisanlar.length === 0 ? (
                <div style={{ padding: '16px', color: '#555', fontSize: '13px' }}>Sonuç bulunamadı</div>
              ) : filtreliCalisanlar.map((c, i) => {
                const secili = secilenCalisan && secilenCalisan.id === c.id;
                return (
                  <div key={i} onClick={() => calisanSec(c)} className={secili ? '' : 'gec-liste-item'} style={{
                    padding: '12px 16px', cursor: 'pointer', borderRadius: '6px', transition: 'background-color 0.15s',
                    backgroundColor: secili ? '#2a2a3a' : 'transparent',
                    borderLeft: secili ? '3px solid #4f46e5' : '3px solid transparent',
                    marginBottom: '2px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.avatar}>{c.ad?.[0]}{c.soyad?.[0]}</div>
                      <div>
                        <div style={{ fontSize: '14px', color: secili ? '#818cf8' : '#e0e0e0', fontWeight: secili ? '600' : '400' }}>
                          {c.ad} {c.soyad}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{c.departman}</div>
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
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#475569', opacity: 0.7, marginBottom: '16px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>Geçmişini görüntülemek için sol listeden bir çalışan seçin</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.avatarBuyuk}>
                    {secilenCalisan.ad?.[0]}
                    {secilenCalisan.soyad?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                      {secilenCalisan.ad} {secilenCalisan.soyad}
                    </div>
                    <div style={{ fontSize: '13px', color: '#a0a0a0' }}>{secilenCalisan.departman}</div>
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
                          const skor = d.toplamSkor;
                          return (
                            <tr key={i} style={styles.satir}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={styles.td}><span style={styles.donemBadge}>{d.donem}</span></td>
                              <td style={styles.td}>{d.tarih && !d.tarih.startsWith('0001') ? new Date(d.tarih).toLocaleDateString('tr-TR') : '-'}</td>
                              <td style={styles.td}><span style={{ fontWeight: '700', fontSize: '15px', color: skorRenk(skor) }}>{skor != null ? parseFloat(skor).toFixed(1) : '-'}</span></td>
                              <td style={{ ...styles.td, color: '#a0a0a0', fontSize: '13px' }}>{d.yorum || '-'}</td>
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
  aramaInput: { width: '100%', height: '38px', padding: '0 14px 0 40px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e5e7eb', fontSize: '14px', display: 'block', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  calisanListesi: { backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a', padding: '8px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2a2a3a', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  avatarBuyuk: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2a2a3a', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', flexShrink: 0 },
  kart: { backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #2a2a2a', overflow: 'hidden' },
  tablo: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.03)' },
  td: { padding: '18px 16px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  satir: { transition: 'background-color 0.15s' },
  donemBadge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: '6px', fontSize: '14px', fontWeight: '500' },
  bos: { padding: '32px', textAlign: 'center', color: '#555', fontSize: '14px' },
  bosSecim: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.08)', color: '#888', fontSize: '14px' },
};

export default Gecmis;
