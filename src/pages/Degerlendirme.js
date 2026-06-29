import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Degerlendirme() {
  const [calisanlar, setCalisanlar] = useState([]);
  const [anaBasliklar, setAnaBasliklar] = useState([]);
  const [altKriterler, setAltKriterler] = useState([]);
  const [secilenCalisan, setSecilenCalisan] = useState('');
  const [secilenCalisanRol, setSecilenCalisanRol] = useState('');
  const [kriterAciklamalar, setKriterAciklamalar] = useState({});
  const [puanlar, setPuanlar] = useState({});
  const [yorum, setYorum] = useState('');
  const [donemYil, setDonemYil] = useState('');
  const [donemCeyrek, setDonemCeyrek] = useState('');
  const [basari, setBasari] = useState('');
  const [hata, setHata] = useState('');
  const degerlendiriciId = localStorage.getItem('id');

  const donem = donemYil && donemCeyrek ? `${donemYil} ${donemCeyrek}` : '';

  useEffect(() => {
    api.get('/Kullanicilar').then(res => {
      setCalisanlar(res.data.filter(k => k.rol === 'Employee' && k.aktifMi));
    }).catch(() => {});
    api.get('/AnaBasliklar').then(res => {
      setAnaBasliklar(res.data.filter(ab => ab.aktifMi));
    }).catch(() => {});
    api.get('/AltKriterler').then(async res => {
      const aktifler = res.data.filter(ak => ak.aktifMi);
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

    const toplamSkor = toplamSkorHesapla();

    try {
      const degRes = await api.post('/Degerlendirmeler', {
        degerlendiricId: parseInt(degerlendiriciId),
        calisanId: parseInt(secilenCalisan),
        tarih: new Date().toISOString(),
        donem: donem,
        yorum: yorum,
        toplamSkor: toplamSkor
      });

      const degerlendirmeId = degRes.data.id;

      for (const [altKriterId, puan] of Object.entries(puanlar)) {
        if (puan > 0) {
          await api.post('/DegerlendirmeDetaylar', {
            degerlendirmeId: degerlendirmeId,
            altKriterId: parseInt(altKriterId),
            puan: puan
          });
        }
      }

      setBasari(`Değerlendirme tamamlandı. Toplam Skor: ${toplamSkor}`);
      setHata('');
      setPuanlar({});
      setYorum('');
      setDonemYil('');
      setDonemCeyrek('');
      setSecilenCalisan('');
    } catch {
      setHata('Değerlendirme kaydedilirken hata oluştu.');
    }
  };

  return (
    <div style={styles.sayfa}>
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

        <form onSubmit={handleSubmit}>
          <div style={styles.ustForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Çalışan Seçin</label>
              <select style={styles.input} value={secilenCalisan}
                onChange={e => {
                  setSecilenCalisan(e.target.value);
                  const c = calisanlar.find(x => x.id === parseInt(e.target.value));
                  setSecilenCalisanRol(c ? (c.departman || '') : '');
                }} required>
                <option value="">Seçin...</option>
                {calisanlar.map(c => (
                  <option key={c.id} value={c.id}>{c.ad} {c.soyad} — {c.departman}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Dönem</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ ...styles.input, flex: 1 }} value={donemYil} onChange={e => setDonemYil(e.target.value)} required>
                  <option value="">Yıl</option>
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select style={{ ...styles.input, flex: 1 }} value={donemCeyrek} onChange={e => setDonemCeyrek(e.target.value)} required>
                  <option value="">Çeyrek</option>
                  <option value="Q1">Q1 (Ocak–Mart)</option>
                  <option value="Q2">Q2 (Nisan–Haziran)</option>
                  <option value="Q3">Q3 (Temmuz–Eylül)</option>
                  <option value="Q4">Q4 (Ekim–Aralık)</option>
                </select>
              </div>
              {donem && <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>Seçili dönem: {donem}</div>}
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
                  const rolAciklama = aciklamaListesi.find(a => (a.Rol || a.rol) === secilenCalisanRol);
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
                      {[1, 2, 3, 4, 5].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => puanDegistir(ak.id, p)}
                          style={{
                            ...styles.puanButon,
                            ...(puanlar[ak.id] === p ? styles.puanButonAktif : {})
                          }}
                        >
                          {p}
                        </button>
                      ))}
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
              style={styles.textarea}
              rows={4}
              placeholder="Çalışan hakkında genel değerlendirmenizi yazın..."
              value={yorum}
              onChange={e => setYorum(e.target.value)}
            />
          </div>

          <div style={styles.altBar}>
            <div style={styles.skorOnizleme}>
              Tahmini Toplam Skor: <strong>{toplamSkorHesapla()}</strong>
            </div>
            <button type="submit" style={styles.kaydetButon}>
              Değerlendirmeyi Kaydet
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
  puanButon: { width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#141414', color: '#a0a0a0', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  puanButonAktif: { backgroundColor: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },
  yorumAlani: { marginTop: '40px', marginBottom: '24px', borderTop: '1px solid #2a2a2a', paddingTop: '24px' },
  textarea: { width: '100%', padding: '14px 16px', backgroundColor: '#242424', border: '1px solid #333', borderRadius: '8px', color: '#e0e0e0', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6', marginTop: '8px' },
  altBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#242424', padding: '16px 20px', borderRadius: '8px', border: '1px solid #2a2a2a' },
  skorOnizleme: { fontSize: '16px', color: '#a0a0a0' },
  kaydetButon: { padding: '12px 28px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default Degerlendirme;