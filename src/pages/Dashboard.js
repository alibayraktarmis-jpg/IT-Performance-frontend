import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconUsers, IconUserCheck, IconBarChart, IconActivity, IconTrophy, IconHash, IconCalendar, IconQuote, IconClock } from '../components/icons';
import FiltreButon from '../components/FiltreButon';
import { DEPARTMANLAR } from '../constants/departmanlar';
import { Spinner, HataKutusu } from '../components/DurumGostergesi';

function Dashboard() {
  const navigate = useNavigate();
  const rol = localStorage.getItem('rol');
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const id = localStorage.getItem('id');
  const [skorData, setSkorData] = useState(null);
  const [siralama, setSiralama] = useState([]);
  const [donemSiralama, setDonemSiralama] = useState([]);
  const [oncekiDonemSiralama, setOncekiDonemSiralama] = useState([]);
  const [degerlendirmeler, setDegerlendirmeler] = useState([]);
  const [sonDegerlendirme, setSonDegerlendirme] = useState(null);
  const [employeeGrafik, setEmployeeGrafik] = useState([]);
  const [secilenDep, setSecilenDep] = useState('Tümü');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  const skorRenk = (skor) => skor == null ? '#e0e0e0' : skor >= 80 ? '#34d399' : skor >= 60 ? '#fbbf24' : '#fb7185';

  const guncelDonemHesapla = () => {
    const bugun = new Date();
    const ceyrek = Math.floor(bugun.getMonth() / 3) + 1;
    return `${bugun.getFullYear()} Q${ceyrek}`;
  };
  const guncelDonem = guncelDonemHesapla();

  const oncekiDonemHesapla = () => {
    const bugun = new Date();
    let yil = bugun.getFullYear();
    let ceyrek = Math.floor(bugun.getMonth() / 3) + 1 - 1;
    if (ceyrek < 1) { ceyrek = 4; yil -= 1; }
    return `${yil} Q${ceyrek}`;
  };
  const oncekiDonem = oncekiDonemHesapla();

  const trendHesapla = (calisanId) => {
    const guncel = donemSiralama.find(s => s.id === calisanId)?.ortalamaToplamSkor;
    const onceki = oncekiDonemSiralama.find(s => s.id === calisanId)?.ortalamaToplamSkor;
    if (guncel == null || onceki == null) return null;
    const fark = parseFloat((guncel - onceki).toFixed(1));
    if (fark === 0) return null;
    return { fark, yukariMi: fark > 0 };
  };

  const donemBilgisiHesapla = () => {
    const bugun = new Date();
    const ceyrekBaslangicAy = Math.floor(bugun.getMonth() / 3) * 3;
    const donemBaslangic = new Date(bugun.getFullYear(), ceyrekBaslangicAy, 1);
    const donemBitis = new Date(bugun.getFullYear(), ceyrekBaslangicAy + 3, 0);
    const gunMs = 24 * 60 * 60 * 1000;
    const toplamGun = Math.round((donemBitis - donemBaslangic) / gunMs) + 1;
    const kalanGun = Math.max(0, Math.round((donemBitis - bugun) / gunMs));
    const gecenOran = 1 - (kalanGun / toplamGun);
    return { kalanGun, gecenOran };
  };
  const { kalanGun, gecenOran } = donemBilgisiHesapla();
  const bekleyenRenk = gecenOran > 0.8
    ? { renk: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    : gecenOran > 0.5
    ? { renk: '#fbbf24', bg: 'rgba(245,158,11,0.1)' }
    : { renk: '#60a5fa', bg: 'rgba(59,130,246,0.1)' };

  const veriGetir = useCallback(() => {
    setYukleniyor(true);
    setHata(null);
    const istekler = [
      api.get('/Degerlendirmeler/siralama').then(res => setSiralama(res.data)),
      api.get(`/Degerlendirmeler/siralama?donem=${encodeURIComponent(guncelDonem)}`).then(res => setDonemSiralama(res.data)),
      api.get(`/Degerlendirmeler/siralama?donem=${encodeURIComponent(oncekiDonem)}`).then(res => setOncekiDonemSiralama(res.data)),
    ];

    if (rol === 'Employee') {
      istekler.push(api.get(`/Degerlendirmeler/skor/${id}`).then(res => setSkorData(res.data)));
      istekler.push(api.get(`/Degerlendirmeler/calisan/${id}`).then(res => {
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
      }));
    }

    Promise.all(istekler)
      .then(() => setYukleniyor(false))
      .catch(() => { setHata('Veriler yüklenemedi.'); setYukleniyor(false); });
  }, [id, rol, guncelDonem, oncekiDonem]);

  useEffect(() => { veriGetir(); }, [veriGetir]);

  const genelOrtalama = employeeGrafik.length > 0
    ? (employeeGrafik.reduce((s, x) => s + x.skor, 0) / employeeGrafik.length).toFixed(1)
    : null;

  const buYil = new Date().getFullYear().toString();
  const buYilGrafik = employeeGrafik.filter(x => x.name.startsWith(buYil));
  const buYilOrtalama = buYilGrafik.length > 0
    ? (buYilGrafik.reduce((s, x) => s + x.skor, 0) / buYilGrafik.length).toFixed(1)
    : null;

  const enYuksek = employeeGrafik.length > 0
    ? employeeGrafik.reduce((a, b) => a.skor > b.skor ? a : b)
    : null;

  return (
    <div style={styles.sayfa}>
      <style>{`
        .dash-kart:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.35); border-color: #3f3f4a !important; }
        .dash-satir td { transition: background-color 0.15s; }
        .dash-satir:hover td { background-color: rgba(255,255,255,0.05); }
        .bekleyen-satir:hover { background-color: rgba(255,255,255,0.05) !important; }
        @media (max-width: 768px) {
          .icerik-responsive { margin-left: 0 !important; margin-top: 56px !important; padding: 20px 16px !important; min-width: 0 !important; }
          .kart-grid-responsive { grid-template-columns: 1fr !important; }
          .kart-grid-responsive > * { min-width: 0 !important; }
        }
      `}</style>
      <Sidebar />
      <div className="icerik-responsive" style={styles.icerik}>
        <div style={{ marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' }}>
          <h2 style={styles.baslik}>Dashboard</h2>
          <p style={styles.altBaslik}>Hoş geldin, {ad} {soyad}</p>
        </div>

        {yukleniyor ? (
          <Spinner />
        ) : hata ? (
          <HataKutusu mesaj={hata} onTekrarDene={veriGetir} />
        ) : (
        <>
        {rol === 'Employee' && (
          <>
            <div className="kart-grid-responsive" style={styles.kartGrid}>
              <div className="dash-kart" style={styles.kart}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.kartEtiket}>{buYil} Ortalaması</div>
                  <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399' }}><IconActivity size={20} /></div>
                </div>
                <div style={styles.kartDeger}>{buYilOrtalama ?? '-'}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Tüm zamanlar: {genelOrtalama ?? '-'}</div>
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
                  {skorData.kategoriDetay.map(k => {
                    const puan = k.ortalamaPuan ?? 0;
                    const yuzde = (puan / 5) * 100;
                    return (
                      <div key={k.baslik}>
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
              const degerlendirilenTumZamanlar = depFiltreli.filter(s => s.ortalamaToplamSkor);
              const ortalama = degerlendirilenTumZamanlar.length > 0
                ? (degerlendirilenTumZamanlar.reduce((a, b) => a + b.ortalamaToplamSkor, 0) / degerlendirilenTumZamanlar.length).toFixed(1)
                : '-';

              const donemDepFiltreli = donemSiralama.filter(s =>
                s.rol === 'Employee' && (secilenDep === 'Tümü' ? true : s.departman === secilenDep)
              );
              const degerlendirilenBuDonem = donemDepFiltreli.filter(s => s.ortalamaToplamSkor);
              const bekleyen = donemDepFiltreli.length - degerlendirilenBuDonem.length;
              const bekleyenListesi = donemDepFiltreli.filter(s => !s.ortalamaToplamSkor);
              const degerlendirilen = rol === 'Evaluator' ? degerlendirilenBuDonem : degerlendirilenTumZamanlar;
              return (
                <>
                <div className="kart-grid-responsive" style={{ ...styles.kartGrid, gridTemplateColumns: rol === 'Evaluator' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
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
                  {rol === 'Evaluator' && (
                    <div className="dash-kart" style={styles.kart}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={styles.kartEtiket}>Bekleyen Değerlendirme</div>
                        <div style={{ ...styles.kartIkon, backgroundColor: bekleyenRenk.bg, color: bekleyenRenk.renk }}><IconClock size={20} /></div>
                      </div>
                      <div style={styles.kartDeger}>{bekleyen}</div>
                      {bekleyen > 0 && (
                        <div style={{ fontSize: '13px', fontWeight: '600', color: bekleyenRenk.renk, marginTop: '4px' }}>
                          {kalanGun > 0 ? `Dönem bitimine ${kalanGun} gün` : 'Dönem bugün bitiyor'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="dash-kart" style={styles.kart}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={styles.kartEtiket}>{secilenDep === 'Tümü' ? 'Genel Ortalama' : `${secilenDep} Ortalaması`}</div>
                      <div style={{ ...styles.kartIkon, backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}><IconBarChart /></div>
                    </div>
                    <div style={styles.kartDeger}>{ortalama}</div>
                  </div>
                </div>

                {rol === 'Evaluator' && bekleyenListesi.length > 0 && (
                  <div style={styles.bolum}>
                    <div style={styles.bolumBaslik}>Bu Dönem Henüz Değerlendirmedin</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {bekleyenListesi.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className="bekleyen-satir"
                          onClick={() => navigate('/degerlendirme', { state: { calisanId: s.id } })}
                          style={styles.bekleyenSatir}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={styles.avatarKucuk}>{s.ad?.[0]}{s.soyad?.[0]}</div>
                            <span>{s.ad} {s.soyad}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{s.departman}</span>
                          </div>
                          <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '600' }}>Değerlendir →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </>
              );
            })()}

            <div style={styles.bolum}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={styles.bolumBaslik}>Sıralama</div>
                {rol === 'Admin' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Tümü', ...DEPARTMANLAR].map(dep => (
                      <FiltreButon key={dep} label={dep} aktif={secilenDep === dep} onClick={() => setSecilenDep(dep)} />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
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
                      return (
                        <tr
                          key={s.id}
                          className="dash-satir"
                          style={{ cursor: 'default' }}
                        >
                          <td style={{ ...styles.td, textAlign: 'center', width: '40px', paddingLeft: '8px', paddingRight: '8px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
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
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={styles.avatarKucuk}>{s.ad?.[0]}{s.soyad?.[0]}</div>
                              <span>{s.ad} {s.soyad}</span>
                            </div>
                          </td>
                          <td style={styles.td}>{s.departman}</td>
                          <td style={styles.td}>
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
                          <td style={{ ...styles.td, textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                            <span style={{ fontWeight: '600', color: skorRenk(s.ortalamaToplamSkor) }}>
                              {s.ortalamaToplamSkor ? s.ortalamaToplamSkor.toFixed(2) : '-'}
                            </span>
                            {(() => {
                              const trend = trendHesapla(s.id);
                              if (!trend) return null;
                              return (
                                <span
                                  title={`Önceki döneme göre ${trend.yukariMi ? '+' : ''}${trend.fark}`}
                                  style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600', color: trend.yukariMi ? '#34d399' : '#fb7185' }}
                                >
                                  {trend.yukariMi ? '↑' : '↓'} {trend.yukariMi ? '+' : ''}{trend.fark}
                                </span>
                              );
                            })()}
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
            </div>
          </>
        )}
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
  bekleyenSatir: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent',
    color: '#e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', transition: 'background-color 0.15s',
  },
};

export default Dashboard;
