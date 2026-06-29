import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
        const tekDonemler = [...new Set(degerlendirmeler.map(d => d.Donem || d.donem).filter(Boolean))].sort().reverse();
        setCalisanDonemleri(tekDonemler);

        // Dönem bazlı grafik verisi
        const donemGrup = {};
        degerlendirmeler.forEach(d => {
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

        if (degerlendirmeler.length > 0) {
          const son = degerlendirmeler[degerlendirmeler.length - 1];
          setSonYorum(son.Yorum || son.yorum || '');
          setSonTarih((son.Tarih || son.tarih) ? new Date(son.Tarih || son.tarih).toLocaleDateString('tr-TR') : '');
          setSonDonem(son.Donem || son.donem || '');
          setPanelDonem(son.Donem || son.donem || '');
        }
        setSecilenCalisan(parseInt(id));
      }).catch(() => {});
    }
  }, []);

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

  const donemeSkorGetir = (calisanId, donem) => {
    setPanelDonem(donem);
    const donemParam = donem ? `?donem=${encodeURIComponent(donem)}` : '';
    api.get(`/Degerlendirmeler/skor/${calisanId}${donemParam}`).then(res => setSkorDetay(res.data)).catch(() => {});
    api.get(`/Degerlendirmeler/calisan/${calisanId}`).then(res => {
      const degerlendirmeler = res.data;
      const filtreli = donem ? degerlendirmeler.filter(d => (d.Donem || d.donem) === donem) : degerlendirmeler;
      const hedef = filtreli.length > 0 ? filtreli[filtreli.length - 1] : null;
      setSonYorum(hedef ? (hedef.Yorum || hedef.yorum || '') : '');
      setSonTarih(hedef && (hedef.Tarih || hedef.tarih) ? new Date(hedef.Tarih || hedef.tarih).toLocaleDateString('tr-TR') : '');
      setSonDonem(hedef ? (hedef.Donem || hedef.donem || '') : '');
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
      const tekDonemler = [...new Set(degerlendirmeler.map(d => d.Donem || d.donem).filter(Boolean))].sort().reverse();
      setCalisanDonemleri(tekDonemler);
      const baslangicDonem = secilenDonem && tekDonemler.includes(secilenDonem) ? secilenDonem : (tekDonemler[0] || '');
      donemeSkorGetir(calisanId, baslangicDonem);
    }).catch(() => {});
  };

  const dosyaIndir = (endpoint, dosyaAdi) => {
    const token = localStorage.getItem('token');
    fetch(`https://localhost:7006/api/Degerlendirmeler/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = dosyaAdi;
        a.click();
      });
  };

  const grafikVerisi = rol === 'Employee'
    ? employeeGrafik
    : siralama
        .filter(s => s.OrtalamaToplamSkor)
        .map(s => ({
          name: `${s.Ad} ${s.Soyad}`,
          skor: parseFloat(s.OrtalamaToplamSkor.toFixed(2))
        }));

  return (
    <div style={styles.sayfa}>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Raporlar</h2>
            <p style={styles.altBaslik}>Performans analizi ve sıralama</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {rol !== 'Employee' && donemler.length > 0 && (
              <select
                value={secilenDonem}
                onChange={e => donemDegistir(e.target.value)}
                style={styles.donemSelect}
              >
                <option value="">Tüm Dönemler</option>
                {Object.entries(
                  donemler.reduce((acc, d) => {
                    const yil = d.split(' ')[0];
                    if (!acc[yil]) acc[yil] = [];
                    acc[yil].push(d);
                    return acc;
                  }, {})
                ).sort(([a], [b]) => b - a).map(([yil, yilDonemler]) => (
                  <optgroup key={yil} label={`── ${yil}`}>
                    {yilDonemler.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            {rol === 'Admin' && (
              <>
                <button onClick={() => dosyaIndir('excel', 'PerformansRaporu.xlsx')} style={styles.excelButon}>Excel İndir</button>
                <button onClick={() => dosyaIndir('pdf', 'PerformansRaporu.pdf')} style={styles.pdfButon}>PDF İndir</button>
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
                  contentStyle={{ backgroundColor: '#242424', border: '1px solid #333', borderRadius: '6px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(val) => [`${val}`, 'Skor']}
                />
                <Bar dataKey="skor" radius={[4, 4, 0, 0]}>
                  {grafikVerisi.map((_, i) => (
                    <Cell
                      key={i}
                      fill={rol === 'Employee' ? '#4f46e5' : (i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#4f46e5')}
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
              <table style={styles.tabloEl}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Ad Soyad</th>
                    <th style={styles.th}>Departman</th>
                    <th style={styles.th}>Ortalama Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {siralama.map((s, i) => (
                    <tr
                      key={i}
                      style={{ ...styles.satir, backgroundColor: secilenCalisan === s.Id ? '#2a2a3a' : 'transparent' }}
                      onClick={() => {
                        if (secilenCalisan === s.Id) {
                          setSecilenCalisan('');
                          setSkorDetay(null);
                          setSonYorum('');
                          setSonTarih('');
                          setSonDonem('');
                          setCalisanDonemleri([]);
                        } else {
                          calisanSkorGetir(s.Id);
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = secilenCalisan === s.Id ? '#2a2a3a' : 'transparent'}
                    >
                      <td style={styles.td}>
                        <span style={{ ...styles.siraNo, backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#2a2a2a' }}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e0e0e0', fontWeight: i < 3 ? '600' : '400' }}>
                        {s.Ad} {s.Soyad}
                      </td>
                      <td style={styles.td}>{s.Departman}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.skorText, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#4f46e5' }}>
                          {s.OrtalamaToplamSkor ? s.OrtalamaToplamSkor.toFixed(2) : '-'}
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
                  <select
                    value={panelDonem}
                    onChange={e => donemeSkorGetir(secilenCalisan, e.target.value)}
                    style={{ padding: '6px 10px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {calisanDonemleri.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>
              {skorDetay ? (
                <>
                  <div style={styles.skorBuyuk}>{typeof (skorDetay.ToplamSkor ?? skorDetay.toplamSkor) === 'number' ? (skorDetay.ToplamSkor ?? skorDetay.toplamSkor).toFixed(1) : (skorDetay.ToplamSkor ?? skorDetay.toplamSkor)}</div>
                  <div style={styles.skorAlt}>Toplam Skor</div>
                  <div style={styles.kategoriListesi}>
                    {(skorDetay.KategoriDetay || skorDetay.kategoriDetay) && (skorDetay.KategoriDetay || skorDetay.kategoriDetay).map((k, i) => (
                      <div key={i} style={styles.kategoriSatir}>
                        <div style={styles.kategoriAdi}>{k.Baslik || k.baslik}</div>
                        <div style={styles.kategoriSag}>
                          <div style={styles.barContainer}>
                            <div style={{ ...styles.bar, width: `${((k.OrtalmaPuan ?? k.ortalmaPuan) / 5) * 100}%` }} />
                          </div>
                          <span style={styles.kategoriPuan}>
                            {(k.OrtalmaPuan ?? k.ortalmaPuan) ? (k.OrtalmaPuan ?? k.ortalmaPuan).toFixed(1) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px' }}>Skor verisi bulunamadı.</div>
              )}
              <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px', display: 'flex', gap: '16px' }}>
                {sonDonem && <div><div style={{ fontSize: '11px', color: '#a0a0a0', marginBottom: '2px' }}>DÖNEM</div><div style={{ fontSize: '13px', color: '#e0e0e0' }}>{sonDonem}</div></div>}
                {sonTarih && <div><div style={{ fontSize: '11px', color: '#a0a0a0', marginBottom: '2px' }}>TARİH</div><div style={{ fontSize: '13px', color: '#e0e0e0' }}>{sonTarih}</div></div>}
              </div>
              {sonYorum && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#a0a0a0', marginBottom: '4px' }}>YORUM</div>
                  <div style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: '1.5' }}>{sonYorum}</div>
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
  excelButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#4ade80', border: '1px solid #166534', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  pdfButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #991b1b', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  donemSelect: { padding: '10px 14px', backgroundColor: '#242424', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  kart: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', border: '1px solid #2a2a2a', marginBottom: '16px' },
  kartBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '0' },
  tabloEl: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333' },
  td: { padding: '12px 12px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a', cursor: 'pointer' },
  satir: { transition: 'background 0.1s' },
  siraNo: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', fontSize: '12px', fontWeight: '600', color: '#fff' },
  skorText: { fontWeight: '600', color: '#4f46e5' },
  skorBuyuk: { fontSize: '48px', fontWeight: '700', color: '#4f46e5', textAlign: 'center', marginBottom: '4px' },
  skorAlt: { fontSize: '13px', color: '#a0a0a0', textAlign: 'center', marginBottom: '24px' },
  kategoriListesi: { display: 'flex', flexDirection: 'column', gap: '12px' },
  kategoriSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  kategoriAdi: { fontSize: '13px', color: '#e0e0e0', minWidth: '120px' },
  kategoriSag: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  barContainer: { flex: 1, height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#4f46e5', borderRadius: '3px' },
  kategoriPuan: { fontSize: '13px', color: '#a0a0a0', minWidth: '30px', textAlign: 'right' },
};

export default Raporlar;