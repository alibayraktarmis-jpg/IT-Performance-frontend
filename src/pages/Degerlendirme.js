import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Degerlendirme() {
  const mevcutRol = localStorage.getItem('rol');
  const mevcutDepartman = localStorage.getItem('departman');
  const [calisanlar, setCalisanlar] = useState([]);
  const [anaBasliklar, setAnaBasliklar] = useState([]);
  const [altKriterler, setAltKriterler] = useState([]);
  const [secilenCalisan, setSecilenCalisan] = useState('');
  const [secilenCalisanRol, setSecilenCalisanRol] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [aramaAcik, setAramaAcik] = useState(false);
  const [secilenDep, setSecilenDep] = useState('');
  const [kriterAciklamalar, setKriterAciklamalar] = useState({});
  const [puanlar, setPuanlar] = useState({});
  const [yorum, setYorum] = useState('');
  const [secilenDonem, setSecilenDonem] = useState('');
  const [donemAcik, setDonemAcik] = useState(false);
  const [donemYil, setDonemYil] = useState(2025);
  const [calisanDonemler, setCalisanDonemler] = useState([]);
  const [tumDegerlendirmeler, setTumDegerlendirmeler] = useState([]);
  const [basari, setBasari] = useState('');
  const [hata, setHata] = useState('');
  const [mevcutDegerlendirmeId, setMevcutDegerlendirmeId] = useState(null);
  const [guncellemeMode, setGuncellemeMode] = useState(false);
  const degerlendiriciId = localStorage.getItem('id');

  const donemSecenekleri = [];
  for (let y = 2024; y <= 2027; y++) {
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => donemSecenekleri.push(`${y} ${q}`));
  }

  useEffect(() => {
    if (mevcutRol !== 'Admin') setSecilenDep(mevcutDepartman || '');
    api.get('/Kullanicilar').then(res => {
      setCalisanlar(res.data.filter(k => (k.rol || k.Rol) === 'Employee' && (k.aktifMi ?? k.AktifMi)));
    }).catch(() => {});
    api.get('/Degerlendirmeler').then(res => setTumDegerlendirmeler(res.data || [])).catch(() => {});
    api.get('/AnaBasliklar?sadaceAktif=true').then(res => {
      setAnaBasliklar(res.data);
    }).catch(() => {});
    api.get('/AltKriterler?sadaceAktif=true').then(async res => {
      const aktifler = res.data;
      setAltKriterler(aktifler);
      const aciklamaMap = {};
      await Promise.all(aktifler.map(async ak => {
        try {
          const r = await api.get(`/KriterAciklamalar/kriter/${ak.id}`);
          aciklamaMap[ak.id] = r.data;
        } catch {}
      }));
      setKriterAciklamalar(aciklamaMap);
    }).catch(() => {});
  }, []);

  // Çalışan değişince o çalışanın tüm dönemlerini çek
  useEffect(() => {
    if (!secilenCalisan) { setCalisanDonemler([]); return; }
    api.get(`/Degerlendirmeler/calisan/${secilenCalisan}`)
      .then(res => setCalisanDonemler((res.data || []).map(d => d.Donem || d.donem)))
      .catch(() => setCalisanDonemler([]));
  }, [secilenCalisan]);

  // Çalışan veya dönem değişince mevcut değerlendirmeyi çek
  useEffect(() => {
    if (!secilenCalisan || !secilenDonem) {
      setMevcutDegerlendirmeId(null);
      setGuncellemeMode(false);
      setPuanlar({});
      setYorum('');
      return;
    }

    api.get(`/Degerlendirmeler/calisan/${secilenCalisan}/donem`, {
      params: { donem: secilenDonem }
    }).then(res => {
      if (res.data) {
        const { degerlendirme, detaylar } = res.data;
        setMevcutDegerlendirmeId(degerlendirme.Id || degerlendirme.id);
        setGuncellemeMode(true);
        setYorum(degerlendirme.Yorum || degerlendirme.yorum || '');
        const puanMap = {};
        detaylar.forEach(d => {
          puanMap[d.AltKriterId || d.altKriterId] = d.Puan || d.puan;
        });
        setPuanlar(puanMap);
      } else {
        setMevcutDegerlendirmeId(null);
        setGuncellemeMode(false);
        setPuanlar({});
        setYorum('');
      }
    }).catch(() => {
      setMevcutDegerlendirmeId(null);
      setGuncellemeMode(false);
    });
  }, [secilenCalisan, secilenDonem]);

  const puanDegistir = (altKriterId, puan) => {
    setPuanlar(prev => ({
      ...prev,
      [altKriterId]: prev[altKriterId] === puan ? 0 : puan
    }));
  };

  const toplamSkorHesapla = () => {
    let toplam = 0;
    anaBasliklar.forEach(ab => {
      const abAltKriterler = altKriterler.filter(ak => ak.anaBaslikId === ab.id);
      if (abAltKriterler.length === 0) return;
      const puanToplam = abAltKriterler.reduce((acc, ak) => acc + (puanlar[ak.id] || 0), 0);
      const ortalama = puanToplam / abAltKriterler.length;
      toplam += (ab.agirlikYuzdesi / 100) * (ortalama / 5) * 100;
    });
    return Math.round(toplam * 100) / 100;
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secilenCalisan) { setHata('Lütfen bir çalışan seçin.'); return; }
    if (!secilenDonem) { setHata('Lütfen bir dönem seçin.'); return; }

    const toplamSkor = toplamSkorHesapla();
    const detaylar = Object.entries(puanlar)
      .filter(([, puan]) => puan > 0)
      .map(([altKriterId, puan]) => ({ altKriterId: parseInt(altKriterId), puan }));

    try {
      if (guncellemeMode && mevcutDegerlendirmeId) {
        await api.put(`/Degerlendirmeler/${mevcutDegerlendirmeId}/detaylar`, {
          yorum,
          toplamSkor,
          detaylar
        });
        setBasari(`Değerlendirme güncellendi. Toplam Skor: ${toplamSkor}`);
      } else {
        const degRes = await api.post('/Degerlendirmeler', {
          degerlendiricId: parseInt(degerlendiriciId),
          calisanId: parseInt(secilenCalisan),
          tarih: new Date().toISOString(),
          donem: secilenDonem,
          yorum,
          toplamSkor
        });
        const degerlendirmeId = degRes.data.id;
        for (const [altKriterId, puan] of Object.entries(puanlar)) {
          if (puan > 0) {
            await api.post('/DegerlendirmeDetaylar', {
              degerlendirmeId,
              altKriterId: parseInt(altKriterId),
              puan
            });
          }
        }
        setBasari(`Değerlendirme kaydedildi. Toplam Skor: ${toplamSkor}`);
        setGuncellemeMode(true);
        setMevcutDegerlendirmeId(degerlendirmeId);
        setCalisanDonemler(prev => [...prev, secilenDonem]);
      }
      setHata('');
    } catch {
      setHata('Değerlendirme kaydedilirken hata oluştu.');
    }
  };

  return (
    <div style={styles.sayfa}>
      <style>{`
        .deg-textarea:focus {
          outline: none;
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 1px #4f46e5;
        }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Performans Değerlendirme</h2>
            <p style={styles.altBaslik}>Çalışan performansını kriterlere göre puanlayın</p>
          </div>
        </div>

        {basari && <div style={styles.basariKutusu}>{basari}</div>}
        {hata && <div style={styles.hataKutusu}>{hata}</div>}

        {guncellemeMode && (
          <div style={styles.bilgiKutusu}>
            Bu dönem için mevcut değerlendirme yüklendi. Değişikliklerinizi yapıp <strong>Güncelle</strong> butonuna basın.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.ustForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Çalışan Seçin</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Departman filtre butonları — sadece Admin'e göster */}
                {mevcutRol === 'Admin' && <div style={{ display: 'flex', gap: '6px' }}>
                  {['İş Analistleri', 'Yazılımcılar', 'QA/Test Uzmanları'].map(dep => {
                    const kisaAd = { 'İş Analistleri': 'İş Analisti', 'Yazılımcılar': 'Yazılımcı', 'QA/Test Uzmanları': 'QA/Test' };
                    const aktif = secilenDep === dep;
                    return (
                      <button key={dep} type="button"
                        onClick={() => { setSecilenDep(aktif ? '' : dep); setAramaMetni(''); }}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: '6px', fontSize: '12px',
                          fontWeight: aktif ? '600' : '400', cursor: 'pointer',
                          border: aktif ? '1px solid #4f46e5' : '1px solid #374151',
                          backgroundColor: aktif ? '#4f46e5' : '#1f2937',
                          color: aktif ? '#ffffff' : '#9ca3af',
                        }}>{kisaAd[dep]}</button>
                    );
                  })}
                </div>}
                {/* Arama kutusu */}
                <div style={{ position: 'relative' }}>
                  {secilenCalisan && (
                    <button type="button" onClick={() => { setSecilenCalisan(''); setAramaMetni(''); setSecilenCalisanRol(''); }}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#2a2a2a', border: '1px solid #333', borderRadius: '50%', color: '#666', fontSize: '14px', cursor: 'pointer', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>×</button>
                  )}
                  <input
                    style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: secilenCalisan ? '40px' : '12px' }}
                    placeholder={secilenDep ? `${secilenDep} içinde ara...` : 'İsim yazarak arayın...'}
                    value={aramaMetni}
                    onChange={e => { setAramaMetni(e.target.value); setAramaAcik(true); }}
                    onFocus={() => setAramaAcik(true)}
                    onBlur={() => setTimeout(() => setAramaAcik(false), 150)}
                    autoComplete="off"
                  />
                  {aramaAcik && (
                    <div style={{
                      position: 'absolute', top: '44px', left: 0, right: 0, zIndex: 100,
                      backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                      maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      {(() => {
                        const filtrelenmis = calisanlar.filter(c => {
                          const tam = `${c.ad || c.Ad} ${c.soyad || c.Soyad}`.toLowerCase();
                          const depEsles = secilenDep ? (c.departman || c.Departman) === secilenDep : true;
                          return tam.includes(aramaMetni.toLowerCase()) && depEsles;
                        });
                        if (filtrelenmis.length === 0) return (
                          <div style={{ padding: '12px 16px', color: '#555', fontSize: '13px' }}>Sonuç bulunamadı</div>
                        );
                        const gruplar = secilenDep ? [secilenDep] : ['İş Analistleri', 'Yazılımcılar', 'QA/Test Uzmanları'];
                        return gruplar.map(dep => {
                          const grup = filtrelenmis.filter(c => (c.departman || c.Departman) === dep);
                          if (grup.length === 0) return null;
                          return (
                            <div key={dep}>
                              {!secilenDep && <div style={{ padding: '8px 14px 4px', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{dep}</div>}
                              {grup.map(c => {
                                const id = c.id || c.Id;
                                const isim = `${c.ad || c.Ad} ${c.soyad || c.Soyad}`;
                                const secili = secilenCalisan === String(id);
                                const buDonemYapildi = secilenDonem && tumDegerlendirmeler.some(
                                  d => (d.CalisanId || d.calisanId) === id && (d.Donem || d.donem) === secilenDonem
                                );
                                return (
                                  <div key={id}
                                    onMouseDown={() => {
                                      setSecilenCalisan(String(id));
                                      setSecilenCalisanRol(c.departman || c.Departman || '');
                                      setAramaMetni(isim);
                                      setAramaAcik(false);
                                    }}
                                    style={{
                                      padding: '10px 16px', cursor: 'pointer', fontSize: '14px',
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      backgroundColor: secili ? '#2a2a3a' : 'transparent',
                                      color: secili ? '#818cf8' : '#e0e0e0',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#242424'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = secili ? '#2a2a3a' : 'transparent'}
                                  >
                                    <span>{isim}</span>
                                    {buDonemYapildi && <span style={{ fontSize: '16px', color: '#4ade80', fontWeight: '600' }}>✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Dönem</label>
              <div style={{ position: 'relative' }}>
                <button type="button"
                  onClick={() => setDonemAcik(!donemAcik)}
                  style={{
                    ...styles.input, width: '100%', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: secilenDonem ? '#fff' : '#666'
                  }}>
                  <span>📅 {secilenDonem || 'Dönem seçin...'}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {secilenDonem && (
                      <span onClick={e => { e.stopPropagation(); setSecilenDonem(''); setDonemAcik(false); }}
                        style={{ color: '#555', fontSize: '16px', lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}>×</span>
                    )}
                    <span style={{ color: '#666' }}>{donemAcik ? '▲' : '▼'}</span>
                  </div>
                </button>

                {donemAcik && (
                  <div style={{
                    position: 'absolute', top: '48px', left: 0, zIndex: 100,
                    backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px',
                    padding: '16px', width: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Dönemler</span>
                      <button type="button" onClick={() => setDonemAcik(false)}
                        style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '50%', color: '#666', fontSize: '14px', cursor: 'pointer', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <button type="button" onClick={() => setDonemYil(y => Math.max(2025, y - 1))}
                        style={{ background: 'none', border: 'none', color: donemYil <= 2025 ? '#444' : '#a0a0a0', fontSize: '18px', cursor: donemYil <= 2025 ? 'default' : 'pointer', padding: '4px 8px' }}>‹</button>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{donemYil}</span>
                      <button type="button" onClick={() => setDonemYil(y => Math.min(2026, y + 1))}
                        style={{ background: 'none', border: 'none', color: donemYil >= 2026 ? '#444' : '#a0a0a0', fontSize: '18px', cursor: donemYil >= 2026 ? 'default' : 'pointer', padding: '4px 8px' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[['Q1','1. Çeyrek'],['Q2','2. Çeyrek'],['Q3','3. Çeyrek'],['Q4','4. Çeyrek']].map(([q, label]) => {
                        const donemStr = `${donemYil} ${q}`;
                        const secili = secilenDonem === donemStr;
                        const yapildi = calisanDonemler.includes(donemStr);
                        return (
                          <button key={q} type="button"
                            onClick={() => { setSecilenDonem(donemStr); setDonemAcik(false); }}
                            style={{
                              padding: '14px 8px', borderRadius: '8px', cursor: 'pointer',
                              border: secili ? '1px solid #4f46e5' : yapildi ? '1px solid #059669' : '1px solid #2a2a2a',
                              backgroundColor: secili ? '#4f46e5' : yapildi ? 'rgba(5,150,105,0.15)' : '#242424',
                              color: secili ? '#fff' : yapildi ? '#4ade80' : '#a0a0a0',
                              fontSize: '13px', fontWeight: '600', textAlign: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ fontSize: '16px', marginBottom: '3px' }}>{q}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>{yapildi && !secili ? '✓' : label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {anaBasliklar.map(ab => (
            <div key={ab.id} style={styles.kategoriKart}>
              <div style={styles.kategoriUst}>
                <div style={styles.kategoriBaslik}>{ab.baslik}</div>
                <div style={styles.kategoriAgirlik}>Ağırlık: %{ab.agirlikYuzdesi}</div>
              </div>
              <div style={styles.kriterListesi}>
                {altKriterler.filter(ak => ak.anaBaslikId === ab.id).map(ak => {
                  const aciklamaListesi = kriterAciklamalar[ak.id] || [];
                  const depToRol = { 'İş Analistleri': 'Analist', 'Yazılımcılar': 'Yazılımcı', 'QA/Test Uzmanları': 'QA' };
                  const rolAnahtar = depToRol[secilenCalisanRol] || secilenCalisanRol;
                  const rolAciklama = aciklamaListesi.find(a => (a.Rol || a.rol) === rolAnahtar);
                  const aciklamaMetni = rolAciklama ? (rolAciklama.Aciklama || rolAciklama.aciklama) : null;
                  return (
                    <div key={ak.id} style={styles.kriterSatir}>
                      <div>
                        <div style={styles.kriterAdi}>{ak.kriterAdi}</div>
                        {aciklamaMetni && (
                          <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '3px', fontStyle: 'italic' }}>{aciklamaMetni}</div>
                        )}
                      </div>
                      <div style={styles.puanButonlar}>
                        {[1, 2, 3, 4, 5].map(p => {
                          const etiketler = { 1: 'Yetersiz', 2: 'Gelişmeli', 3: 'Ortalama', 4: 'İyi', 5: 'Mükemmel' };
                          const secili = puanlar[ak.id] === p;
                          return (
                            <div key={p} style={{ position: 'relative' }}
                              onMouseEnter={e => e.currentTarget.querySelector('.tooltip').style.display = 'block'}
                              onMouseLeave={e => e.currentTarget.querySelector('.tooltip').style.display = 'none'}
                            >
                              <button
                                type="button"
                                onClick={() => puanDegistir(ak.id, p)}
                                style={{
                                  ...styles.puanButon,
                                  ...(secili ? { backgroundColor: '#4f46e5', border: '1px solid #6366f1', color: '#ffffff', fontWeight: '700' } : {})
                                }}
                              >
                                {p}
                              </button>
                              <div className="tooltip" style={{
                                display: 'none', position: 'absolute', bottom: '42px', left: '50%',
                                transform: 'translateX(-50%)', backgroundColor: '#111', color: '#fff',
                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
                                border: '1px solid #333'
                              }}>
                                {etiketler[p]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={styles.yorumAlani}>
            <label style={styles.label}>Genel Yorum</label>
            <textarea
              className="deg-textarea"
              style={styles.textarea}
              rows={4}
              placeholder="Çalışanın güçlü yönleri ve gelişim alanlarına dair görüşleriniz..."
              value={yorum}
              onChange={e => setYorum(e.target.value)}
            />
          </div>

          <div style={styles.altBar}>
            <div style={styles.skorOnizleme}>
              Tahmini Toplam Skor: <strong>{toplamSkorHesapla()}</strong>
            </div>
            <button type="submit" style={{
              ...styles.kaydetButon,
              backgroundColor: guncellemeMode ? '#059669' : '#4f46e5',
            }}>
              {guncellemeMode ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
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
  basariKutusu: { backgroundColor: 'rgba(20,83,45,0.3)', border: '1px solid #166534', color: '#4ade80', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  hataKutusu: { backgroundColor: 'rgba(69,10,10,0.3)', border: '1px solid #991b1b', color: '#f87171', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  bilgiKutusu: { backgroundColor: 'rgba(30,58,138,0.2)', borderLeft: '4px solid #3b82f6', color: '#bfdbfe', padding: '16px', borderRadius: '0 6px 6px 0', marginBottom: '16px', fontSize: '13px' },
  ustForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#b3b3b3', fontWeight: '500' },
  input: { padding: '10px 12px', backgroundColor: '#242424', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px' },
  kategoriKart: { backgroundColor: '#242424', borderRadius: '8px', padding: '20px', marginBottom: '16px', border: '1px solid #2a2a2a' },
  kategoriUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  kategoriBaslik: { fontSize: '16px', fontWeight: '600', color: '#fff' },
  kategoriAgirlik: { fontSize: '13px', color: '#a0a0a0' },
  kriterListesi: { display: 'flex', flexDirection: 'column', gap: '12px' },
  kriterSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2a2a2a' },
  kriterAdi: { fontSize: '14px', color: '#e0e0e0' },
  puanButonlar: { display: 'flex', gap: '8px' },
  puanButon: { width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#9ca3af', fontSize: '14px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.15s' },
  puanButonAktif: { backgroundColor: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },
  yorumAlani: { marginTop: '40px', marginBottom: '24px', borderTop: '1px solid #2a2a2a', paddingTop: '24px' },
  textarea: { width: '100%', padding: '14px 16px', backgroundColor: '#242424', border: '1px solid #333', borderRadius: '8px', color: '#e0e0e0', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6', marginTop: '8px' },
  altBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#242424', padding: '16px 20px', borderRadius: '8px', border: '1px solid #2a2a2a' },
  skorOnizleme: { fontSize: '16px', color: '#a0a0a0' },
  kaydetButon: { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default Degerlendirme;
