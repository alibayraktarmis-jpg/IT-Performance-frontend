import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function CustomSelect({ value, onChange, gruplar, placeholder = 'Seçin...', hideClear = false }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const kapat = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, []);

  const tumSecenekler = gruplar.flatMap(g => g.secenekler);
  const secilenEtiket = value ? (tumSecenekler.find(s => s.value === value)?.label ?? value) : placeholder;

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '180px' }}>
      <button
        type="button"
        onClick={() => setAcik(a => !a)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          padding: '9px 14px', backgroundColor: '#1e1e1e', color: value ? '#f3f4f6' : '#6b7280',
          border: `1px solid ${acik ? '#4f46e5' : '#3a3a3a'}`, borderRadius: '6px',
          fontSize: '13px', cursor: 'pointer',
          boxShadow: acik ? '0 0 0 3px rgba(79,70,229,0.2)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span>{secilenEtiket}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: acik ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {acik && (
        <div className="dropdown-scroll" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#1a1b23', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '8px',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: '260px', overflowY: 'auto',
        }}>
          {!hideClear && (
            <div
              onClick={() => { onChange(''); setAcik(false); }}
              style={{
                padding: '9px 14px', fontSize: '13px', cursor: 'pointer',
                color: !value ? '#818cf8' : '#9ca3af',
                backgroundColor: !value ? 'rgba(79,70,229,0.1)' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = !value ? 'rgba(79,70,229,0.1)' : 'transparent'}
            >
              {placeholder}
            </div>
          )}
          {gruplar.map(g => (
            <div key={g.label}>
              <div style={{ padding: '10px 12px 4px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600', borderTop: '1px solid rgba(51,65,85,0.3)', marginTop: '2px' }}>
                {g.label}
              </div>
              {g.secenekler.map(s => (
                <div
                  key={s.value}
                  onClick={() => { onChange(s.value); setAcik(false); }}
                  style={{
                    padding: '9px 14px 9px 20px', fontSize: '13px', cursor: 'pointer',
                    color: value === s.value ? '#818cf8' : '#d1d5db',
                    backgroundColor: value === s.value ? 'rgba(79,70,229,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (value !== s.value) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = value === s.value ? 'rgba(79,70,229,0.12)' : 'transparent'; }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Raporlar() {
  const [siralama, setSiralama] = useState([]);
  const [skorDetay, setSkorDetay] = useState(null);
  const [secilenCalisan, setSecilenCalisan] = useState('');
  const [calisanlar, setCalisanlar] = useState([]);
  const [donemler, setDonemler] = useState([]);
  const [secilenDonem, setSecilenDonem] = useState('');
  const [employeeGrafik, setEmployeeGrafik] = useState([]);
  const rol = localStorage.getItem('rol');
  const id = localStorage.getItem('id');

  const siralamayiGetir = (donem) => {
    const params = donem ? `?donem=${encodeURIComponent(donem)}` : '';
    api.get(`/Degerlendirmeler/siralama${params}`).then(res => setSiralama(res.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/Degerlendirmeler/donemler').then(res => setDonemler(res.data)).catch(() => {});
    siralamayiGetir('');
    if (rol === 'Admin' || rol === 'Evaluator') {
      api.get('/Kullanicilar').then(res => {
        setCalisanlar(res.data.filter(k => k.rol === 'Employee'));
      }).catch(() => {});
    }
    if (rol === 'Employee') {
      api.get(`/Degerlendirmeler/skor/${id}`).then(res => setSkorDetay(res.data)).catch(() => {});
      api.get(`/Degerlendirmeler/calisan/${id}`).then(res => {
        const degerlendirmeler = res.data;
        const tekDonemler = [...new Set(degerlendirmeler.map(d => d.donem).filter(Boolean))].sort().reverse();
        setCalisanDonemleri(tekDonemler);

        // Dönem bazlı grafik verisi
        const donemGrup = {};
        degerlendirmeler.forEach(d => {
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

        if (degerlendirmeler.length > 0) {
          const son = degerlendirmeler[degerlendirmeler.length - 1];
          setSonYorum(son.yorum || '');
          setSonTarih(son.tarih ? new Date(son.tarih).toLocaleDateString('tr-TR') : '');
          setSonDonem(son.donem || '');
          setPanelDonem(son.donem || '');
        }
        setSecilenCalisan(parseInt(id));
      }).catch(() => {});
    }
  }, [id, rol]);

  const donemDegistir = (donem) => {
    setSecilenDonem(donem);
    setSecilenCalisan('');
    setSkorDetay(null);
    setSonYorum('');
    setSonTarih('');
    setSonDonem('');
    siralamayiGetir(donem);
  };

  const [sonYorum, setSonYorum] = useState('');
  const [sonTarih, setSonTarih] = useState('');
  const [sonDonem, setSonDonem] = useState('');
  const [calisanDonemleri, setCalisanDonemleri] = useState([]);
  const [panelDonem, setPanelDonem] = useState('');
  const [hovExcel, setHovExcel] = useState(false);
  const [hovPdf, setHovPdf] = useState(false);

  const donemeSkorGetir = (calisanId, donem) => {
    setPanelDonem(donem);
    const donemParam = donem ? `?donem=${encodeURIComponent(donem)}` : '';
    api.get(`/Degerlendirmeler/skor/${calisanId}${donemParam}`).then(res => setSkorDetay(res.data)).catch(() => {});
    api.get(`/Degerlendirmeler/calisan/${calisanId}`).then(res => {
      const degerlendirmeler = res.data;
      const filtreli = donem ? degerlendirmeler.filter(d => d.donem === donem) : degerlendirmeler;
      const hedef = filtreli.length > 0 ? filtreli[filtreli.length - 1] : null;
      setSonYorum(hedef ? (hedef.yorum || '') : '');
      setSonTarih(hedef && hedef.tarih ? new Date(hedef.tarih).toLocaleDateString('tr-TR') : '');
      setSonDonem(hedef ? (hedef.donem || '') : '');
    }).catch(() => {});
  };

  const calisanSkorGetir = (calisanId) => {
    setSecilenCalisan(calisanId);
    setSkorDetay(null);
    setSonYorum('');
    setSonTarih('');
    setSonDonem('');
    setCalisanDonemleri([]);
    setPanelDonem('');

    api.get(`/Degerlendirmeler/calisan/${calisanId}`).then(res => {
      const degerlendirmeler = res.data;
      const tekDonemler = [...new Set(degerlendirmeler.map(d => d.donem).filter(Boolean))].sort().reverse();
      setCalisanDonemleri(tekDonemler);
      const baslangicDonem = secilenDonem && tekDonemler.includes(secilenDonem) ? secilenDonem : (tekDonemler[0] || '');
      donemeSkorGetir(calisanId, baslangicDonem);
    }).catch(() => {});
  };

  const dosyaIndir = (endpoint, dosyaAdi) => {
    api.get(`/Degerlendirmeler/${endpoint}`, { responseType: 'blob' }).then(res => {
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = dosyaAdi;
      a.click();
    });
  };

  const employeeIdleri = new Set(calisanlar.map(c => c.id));
  const sadeceCalisanSiralama = siralama.filter(s => employeeIdleri.has(s.id));

  const grafikVerisi = rol === 'Employee'
    ? employeeGrafik
    : sadeceCalisanSiralama
        .filter(s => s.ortalamaToplamSkor)
        .map(s => ({
          name: `${s.ad} ${s.soyad}`,
          skor: parseFloat(s.ortalamaToplamSkor.toFixed(2))
        }));

  return (
    <div style={styles.sayfa}>
      <style>{`
        .rapor-select:focus { outline: none; border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.2); }
        .dropdown-scroll::-webkit-scrollbar { width: 5px; }
        .dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
        .dropdown-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 99px; }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .panel-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.25); }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Raporlar</h2>
            <p style={styles.altBaslik}>Performans analizi ve sıralama</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {rol !== 'Employee' && donemler.length > 0 && (
              <CustomSelect
                value={secilenDonem}
                onChange={donemDegistir}
                placeholder="Tüm Dönemler"
                gruplar={Object.entries(
                  donemler.reduce((acc, d) => {
                    const yil = d.split(' ')[0];
                    if (!acc[yil]) acc[yil] = [];
                    acc[yil].push(d);
                    return acc;
                  }, {})
                ).sort(([a], [b]) => b - a).map(([yil, yilDonemler]) => ({
                  label: yil,
                  secenekler: yilDonemler.map(d => ({ value: d, label: d }))
                }))}
              />
            )}
            {rol === 'Admin' && (
              <>
                <button
                  onClick={() => dosyaIndir('excel', 'PerformansRaporu.xlsx')}
                  onMouseEnter={() => setHovExcel(true)}
                  onMouseLeave={() => setHovExcel(false)}
                  style={{ ...styles.excelButon, backgroundColor: hovExcel ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.08)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Excel
                </button>
                <button
                  onClick={() => dosyaIndir('pdf', 'PerformansRaporu.pdf')}
                  onMouseEnter={() => setHovPdf(true)}
                  onMouseLeave={() => setHovPdf(false)}
                  style={{ ...styles.pdfButon, backgroundColor: hovPdf ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.08)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {grafikVerisi.length > 0 && (
          <div style={styles.kart}>
            <div style={styles.kartBaslik}>{rol === 'Employee' ? 'Performans Grafiğim' : 'Çalışan Performans Grafiği'}</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={grafikVerisi} margin={{ top: 10, right: 20, left: 0, bottom: 20 }} barSize={grafikVerisi.length === 1 ? 80 : undefined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.8)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                  formatter={(val) => [`${val}`, 'Skor']}
                  cursor={false}
                />
                <Bar dataKey="skor" radius={[4, 4, 0, 0]} activeBar={false}>
                  {grafikVerisi.map((_, i) => (
                    <Cell
                      key={i}
                      fill={rol === 'Employee' ? '#4f46e5' : (i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#4f46e5')}
                      fillOpacity={rol !== 'Employee' && i >= 3 ? 0.8 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: secilenCalisan ? '1fr 1fr' : '1fr', gap: '16px', marginTop: '16px' }}>
          <div style={styles.kart}>
            <div style={styles.kartBaslik}>{rol === 'Employee' ? 'Performans Özetim' : 'Sıralama'}</div>

            {rol === 'Employee' ? (
              <>
                {employeeGrafik.length > 0 && (
                  <>
                    <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
                      <div style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Genel Ortalama</div>
                      <div style={{ fontSize: '48px', fontWeight: '700', color: '#4f46e5' }}>
                        {(employeeGrafik.reduce((s, x) => s + x.skor, 0) / employeeGrafik.length).toFixed(1)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {employeeGrafik.map((d, i) => (
                        <div
                          key={i}
                          onClick={() => donemeSkorGetir(parseInt(id), d.name)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                            backgroundColor: panelDonem === d.name ? '#2a2a3a' : '#1c1c1c',
                            border: `1px solid ${panelDonem === d.name ? '#4f46e5' : '#2a2a2a'}`,
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '500' }}>{d.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '120px', height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${d.skor}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#4f46e5', minWidth: '40px', textAlign: 'right' }}>{d.skor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {employeeGrafik.length === 0 && (
                  <div style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '16px' }}>Henüz değerlendirme bulunmuyor.</div>
                )}
              </>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Ad Soyad</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Departman</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Ortalama Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {sadeceCalisanSiralama.map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(55,65,81,0.5)',
                        transition: 'background-color 0.15s',
                        borderLeft: secilenCalisan === s.id ? '2px solid #6366f1' : '2px solid transparent',
                        backgroundColor: secilenCalisan === s.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (secilenCalisan === s.id) {
                          setSecilenCalisan('');
                          setSkorDetay(null);
                          setSonYorum('');
                          setSonTarih('');
                          setSonDonem('');
                          setCalisanDonemleri([]);
                        } else {
                          calisanSkorGetir(s.id);
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = secilenCalisan === s.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = secilenCalisan === s.id ? 'rgba(99,102,241,0.1)' : 'transparent'}
                    >
                      <td style={styles.td}>
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
                      <td style={{ ...styles.td, fontWeight: i < 3 ? '600' : '400' }}>{s.ad} {s.soyad}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{s.departman}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={styles.skorText}>
                          {s.ortalamaToplamSkor ? s.ortalamaToplamSkor.toFixed(2) : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {secilenCalisan && (
            <div style={styles.kart}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={styles.kartBaslik} >Kategori Detayı</div>
                {rol !== 'Employee' && calisanDonemleri.length > 1 && (
                  <CustomSelect
                    hideClear
                    value={panelDonem}
                    onChange={(d) => donemeSkorGetir(secilenCalisan, d)}
                    gruplar={Object.entries(
                      calisanDonemleri.reduce((acc, d) => {
                        const yil = d.split(' ')[0];
                        if (!acc[yil]) acc[yil] = [];
                        acc[yil].push(d);
                        return acc;
                      }, {})
                    ).sort(([a], [b]) => b - a).map(([yil, yilDonemler]) => ({
                      label: yil,
                      secenekler: yilDonemler.map(d => ({ value: d, label: d }))
                    }))}
                  />
                )}
              </div>
              {skorDetay ? (
                <>
                  <div style={styles.skorBuyuk}>{typeof skorDetay.toplamSkor === 'number' ? skorDetay.toplamSkor.toFixed(1) : skorDetay.toplamSkor}</div>
                  <div style={styles.skorAlt}>Toplam Skor</div>
                  <div style={styles.kategoriListesi}>
                    {skorDetay.kategoriDetay && skorDetay.kategoriDetay.map((k, i) => (
                      <div key={i} style={styles.kategoriSatir}>
                        <div style={styles.kategoriAdi}>{k.baslik}</div>
                        <div style={styles.kategoriSag}>
                          <div style={styles.barContainer}>
                            <div style={{ ...styles.bar, width: `${(k.ortalamaPuan / 5) * 100}%` }} />
                          </div>
                          <span style={styles.kategoriPuan}>
                            {k.ortalamaPuan ? k.ortalamaPuan.toFixed(1) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px' }}>Skor verisi bulunamadı.</div>
              )}
              <div style={{ marginTop: '24px', borderTop: '1px solid #2a2a2a', paddingTop: '20px', display: 'flex', gap: '24px' }}>
                {sonDonem && <div><div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dönem</div><div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '500' }}>{sonDonem}</div></div>}
                {sonTarih && <div><div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tarih</div><div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '500' }}>{sonTarih}</div></div>}
              </div>
              {sonYorum && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Yorum</div>
                  <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.65', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(55,65,81,0.5)', fontStyle: 'italic' }}>{sonYorum}</div>
                </div>
              )}
              {!sonDonem && !sonTarih && !sonYorum && !skorDetay && (
                <div style={{ color: '#a0a0a0', fontSize: '13px' }}>Bu çalışan için değerlendirme bulunamadı.</div>
              )}
            </div>
          )}
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
  excelButon: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#4ade80', transition: 'background-color 0.15s' },
  pdfButon: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#f87171', transition: 'background-color 0.15s' },
  donemSelect: { padding: '9px 14px', backgroundColor: '#1e1e1e', color: '#f3f4f6', border: '1px solid #3a3a3a', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'border-color 0.15s' },
  kart: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', border: '1px solid #2a2a2a', marginBottom: '16px' },
  kartBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '0' },
  th: { padding: '16px', fontSize: '14px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #374151' },
  td: { padding: '16px', fontSize: '14px', color: '#e0e0e0', whiteSpace: 'nowrap' },
  siraNo: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', fontSize: '12px', fontWeight: '700' },
  siraNoDuz: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', fontSize: '12px', fontWeight: '600', color: '#64748b' },
  skorText: { fontWeight: '500', color: '#e0e0e0' },
  skorBuyuk: { fontSize: '48px', fontWeight: '700', color: '#818cf8', textAlign: 'center', marginBottom: '4px', marginTop: '8px' },
  skorAlt: { fontSize: '13px', color: '#a0a0a0', textAlign: 'center', marginBottom: '28px' },
  kategoriListesi: { display: 'flex', flexDirection: 'column', gap: '16px' },
  kategoriSatir: { display: 'flex', alignItems: 'center', gap: '16px' },
  kategoriAdi: { fontSize: '13px', color: '#e0e0e0', minWidth: '130px', lineHeight: '1', flexShrink: 0 },
  kategoriSag: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  barContainer: { flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#4f46e5', borderRadius: '99px' },
  kategoriPuan: { fontSize: '13px', color: '#a0a0a0', minWidth: '30px', textAlign: 'right', lineHeight: '1', alignSelf: 'center' },
};

export default Raporlar;