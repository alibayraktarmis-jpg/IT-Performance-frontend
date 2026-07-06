import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconUsers, IconUserCheck, IconBarChart, IconActivity, IconTrophy, IconHash, IconCalendar, IconQuote } from '../components/icons';
import FiltreButon from '../components/FiltreButon';
import { DEPARTMANLAR } from '../constants/departmanlar';

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
  const [secilenDep, setSecilenDep] = useState('Tümü');
  const [hoveredRow, setHoveredRow] = useState(null);

  const skorRenk = (skor) => skor == null ? '#e0e0e0' : skor >= 80 ? '#34d399' : skor >= 60 ? '#fbbf24' : '#fb7185';

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
          const donem = d.donem;
          const skor = d.toplamSkor;
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
  }, [id, rol]);

  const genelOrtalama = employeeGrafik.length > 0
    ? (employeeGrafik.reduce((s, x) => s + x.skor, 0) / employeeGrafik.length).toFixed(1)
    : null;

  const enYuksek = employeeGrafik.length > 0
    ? employeeGrafik.reduce((a, b) => a.skor > b.skor ? a : b)
    : null;

  return (
    <div style={styles.sayfa}>
      <style>{`
        .dash-kart:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.35); border-color: #3f3f4a !important; }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={{ marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' }}>
          <h2 style={styles.baslik}>Dashboard</h2>
          <p style={styles.altBaslik}>Hoş geldin, {ad} {soyad}</p>
        </div>

        {rol === 'Employee' && (
          <>
            <div style={styles.kartGrid}>
              <div className="dash-kart" style={styles.kart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.kartEtiket}>Genel Ortalama</div>
                  <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399' }}><IconActivity size={20} /></div>
                </div>
                <div style={styles.kartDeger}>{genelOrtalama ?? '-'}</div>
              </div>
              <div className="dash-kart" style={styles.kart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.kartEtiket}>En Yüksek Dönem</div>
                  <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}><IconTrophy size={20} /></div>
                </div>
                <div style={styles.kartDeger}>{enYuksek ? enYuksek.name : '-'}</div>
                {enYuksek && <div style={{ fontSize: '13px', color: '#4ade80', marginTop: '4px' }}>{enYuksek.skor} puan</div>}
              </div>
              <div className="dash-kart" style={styles.kart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.kartEtiket}>Değerlendirme Sayısı</div>
                  <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8' }}><IconHash size={20} /></div>
                </div>
                <div style={styles.kartDeger}>{degerlendirmeler.length}</div>
              </div>
              <div className="dash-kart" style={styles.kart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.kartEtiket}>Son Değerlendirme</div>
                  <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><IconCalendar size={20} /></div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginTop: '4px' }}>
                  {sonDegerlendirme
                    ? new Date(sonDegerlendirme.tarih).toLocaleDateString('tr-TR')
                    : '-'}
                </div>
                {sonDegerlendirme && (
                  <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>
                    {sonDegerlendirme.donem}
                  </div>
                )}
              </div>
            </div>

            {skorData && skorData.kategoriDetay && (
              <div style={styles.bolum}>
                <div style={styles.bolumBaslik}>Kategori Skorlarım</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {skorData.kategoriDetay.map((k, i) => {
                    const puan = k.ortalamaPuan ?? 0;
                    const yuzde = (puan / 5) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', color: '#e0e0e0' }}>{k.baslik}</span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#4f46e5' }}>{puan ? puan.toFixed(1) : '-'} / 5</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${yuzde}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '99px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sonDegerlendirme && sonDegerlendirme.yorum && (
              <div style={styles.bolum}>
                <div style={styles.bolumBaslik}>Son Yorum</div>
                <div style={{ position: 'relative', fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.7', padding: '20px 44px 20px 24px', backgroundColor: '#1c1c1c', borderRadius: '8px', borderLeft: '2px solid #6366f1', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: '10px', right: '14px', color: 'rgba(51,65,85,0.3)' }}><IconQuote size={32} /></span>
                  <span style={{ position: 'relative', zIndex: 1 }}>{sonDegerlendirme.yorum}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '8px' }}>
                  {sonDegerlendirme.donem} · {new Date(sonDegerlendirme.tarih).toLocaleDateString('tr-TR')}
                </div>
              </div>
            )}
          </>
        )}

        {(rol === 'Admin' || rol === 'Evaluator') && (
          <>
            {(() => {
              const depFiltreli = siralama.filter(s =>
                s.rol === 'Employee' && (secilenDep === 'Tümü' ? true : s.departman === secilenDep)
              );
              const degerlendirilen = depFiltreli.filter(s => s.ortalamaToplamSkor);
              const ortalama = degerlendirilen.length > 0
                ? (degerlendirilen.reduce((a, b) => a + b.ortalamaToplamSkor, 0) / degerlendirilen.length).toFixed(1)
                : '-';
              return (
                <div style={{ ...styles.kartGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="dash-kart" style={styles.kart}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={styles.kartEtiket}>Toplam Çalışan</div>
                      <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><IconUsers size={20} /></div>
                    </div>
                    <div style={styles.kartDeger}>{depFiltreli.length}</div>
                  </div>
                  <div className="dash-kart" style={styles.kart}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={styles.kartEtiket}>Değerlendirilen</div>
                      <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399' }}><IconUserCheck /></div>
                    </div>
                    <div style={styles.kartDeger}>{degerlendirilen.length}</div>
                  </div>
                  <div className="dash-kart" style={styles.kart}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={styles.kartEtiket}>{secilenDep === 'Tümü' ? 'Genel Ortalama' : `${secilenDep} Ortalaması`}</div>
                      <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}><IconBarChart /></div>
                    </div>
                    <div style={styles.kartDeger}>{ortalama}</div>
                  </div>
                </div>
              );
            })()}

            <div style={styles.bolum}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.bolumBaslik}>Sıralama</div>
                {rol === 'Admin' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Tümü', ...DEPARTMANLAR].map(dep => (
                      <FiltreButon key={dep} label={dep} aktif={secilenDep === dep} onClick={() => setSecilenDep(dep)} />
                    ))}
                  </div>
                )}
              </div>
              <table style={styles.tabloEl}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #333' }}>
                    <th style={{ ...styles.th, textAlign: 'center', width: '40px', paddingLeft: '8px', paddingRight: '8px' }}>#</th>
                    <th style={styles.th}>Ad Soyad</th>
                    <th style={styles.th}>Departman</th>
                    <th style={styles.th}>Rol</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Ortalama Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtreli = siralama.filter(s =>
                      s.rol === 'Employee' && (secilenDep === 'Tümü' ? true : s.departman === secilenDep)
                    );
                    return filtreli.length > 0 ? filtreli.map((s, i) => {
                      const tdBg = hoveredRow === i ? 'rgba(255,255,255,0.05)' : 'transparent';
                      return (
                        <tr
                          key={i}
                          onMouseEnter={() => setHoveredRow(i)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ cursor: 'default' }}
                        >
                          <td style={{ ...styles.td, textAlign: 'center', width: '40px', paddingLeft: '8px', paddingRight: '8px', backgroundColor: tdBg, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', transition: 'background-color 0.15s' }}>
                            {i < 3 ? (
                              <span style={{
                                ...styles.siraNo,
                                backgroundColor: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.2)' : 'rgba(180,83,9,0.2)',
                                color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309',
                              }}>
                                {i + 1}
                              </span>
                            ) : (
                              <span style={styles.siraNoDuz}>{i + 1}</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, backgroundColor: tdBg, transition: 'background-color 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={styles.avatarKucuk}>{s.ad?.[0]}{s.soyad?.[0]}</div>
                              <span>{s.ad} {s.soyad}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, backgroundColor: tdBg, transition: 'background-color 0.15s' }}>{s.departman}</td>
                          <td style={{ ...styles.td, backgroundColor: tdBg, transition: 'background-color 0.15s' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '2px 10px', borderRadius: '6px',
                              fontSize: '12px', fontWeight: '500',
                              backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8',
                              border: '1px solid rgba(99,102,241,0.2)',
                            }}>
                              {s.rol}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', backgroundColor: tdBg, borderTopRightRadius: '8px', borderBottomRightRadius: '8px', transition: 'background-color 0.15s' }}>
                            <span style={{ fontWeight: '600', color: skorRenk(s.ortalamaToplamSkor) }}>
                              {s.ortalamaToplamSkor ? s.ortalamaToplamSkor.toFixed(2) : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>Henüz değerlendirme verisi bulunmuyor.</td></tr>
                    );
                  })()}
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
  kart: { backgroundColor: '#242424', borderRadius: '8px', padding: '20px', border: '1px solid #2a2a2a', transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' },
  kartEtiket: { fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '600', marginBottom: '10px' },
  kartIkon: { color: '#818cf8', backgroundColor: 'rgba(79,70,229,0.15)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kartDeger: { fontSize: '28px', fontWeight: '700', color: '#ffffff' },
  bolum: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', border: '1px solid #2a2a2a', marginBottom: '20px' },
  bolumBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '20px' },
  tabloEl: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', fontSize: '11px', color: '#cbd5e1', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333' },
  td: { padding: '20px 14px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  siraNo: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', fontSize: '13px', fontWeight: '700' },
  siraNoDuz: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', fontSize: '13px', fontWeight: '600', color: '#64748b' },
  avatarKucuk: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0 },
};

export default Dashboard;
