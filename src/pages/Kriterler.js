import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const ROL_ACIKLAMALARI = ['Analist', 'Yazılımcı', 'QA'];

function Kriterler() {
  const [anaBasliklar, setAnaBasliklar] = useState([]);
  const [altKriterler, setAltKriterler] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [altKriterModalAcik, setAltKriterModalAcik] = useState(false);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [altKriterDuzenleModalAcik, setAltKriterDuzenleModalAcik] = useState(false);
  const [yeniBaslik, setYeniBaslik] = useState({ baslik: '', agirlikYuzdesi: 0 });
  const [yeniAltKriter, setYeniAltKriter] = useState({ anaBaslikId: '', kriterAdi: '' });
  const [yeniAciklamalar, setYeniAciklamalar] = useState({ Analist: '', Yazılımcı: '', QA: '' });
  const [duzenlenecekBaslik, setDuzenlenecekBaslik] = useState(null);
  const [duzenlenecekAltKriter, setDuzenlenecekAltKriter] = useState(null);
  const [duzenlenecekAciklamalar, setDuzenlenecekAciklamalar] = useState({ Analist: '', Yazılımcı: '', QA: '' });
  const [basari, setBasari] = useState('');
  const [hata, setHata] = useState('');

  useEffect(() => { verileriGetir(); }, []);

  const verileriGetir = () => {
    api.get('/AnaBasliklar').then(res => setAnaBasliklar(res.data)).catch(() => {});
    api.get('/AltKriterler').then(res => setAltKriterler(res.data)).catch(() => {});
  };

  const aciklamalariYukle = async (altKriterId) => {
    try {
      const res = await api.get(`/KriterAciklamalar/kriter/${altKriterId}`);
      const map = { Analist: '', Yazılımcı: '', QA: '' };
      res.data.forEach(a => { if (map.hasOwnProperty(a.Rol || a.rol)) map[a.Rol || a.rol] = a.Aciklama || a.aciklama || ''; });
      return map;
    } catch { return { Analist: '', Yazılımcı: '', QA: '' }; }
  };

  const aciklamalariKaydet = async (altKriterId, aciklamalar) => {
    const payload = ROL_ACIKLAMALARI.map(rol => ({ altKriterId, rol, aciklama: aciklamalar[rol] || '' }));
    await api.post(`/KriterAciklamalar/kriter/${altKriterId}/upsert`, payload);
  };

  const anaBaslikEkle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/AnaBasliklar', { ...yeniBaslik, aktifMi: true });
      setBasari('Ana başlık eklendi.');
      setModalAcik(false);
      setYeniBaslik({ baslik: '', agirlikYuzdesi: 0 });
      verileriGetir();
    } catch { setHata('Hata oluştu.'); }
  };

  const altKriterEkle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/AltKriterler', { ...yeniAltKriter, aktifMi: true });
      const yeniId = res.data?.id || res.data?.Id;
      if (yeniId) await aciklamalariKaydet(yeniId, yeniAciklamalar);
      setBasari('Alt kriter eklendi.');
      setAltKriterModalAcik(false);
      setYeniAltKriter({ anaBaslikId: '', kriterAdi: '' });
      setYeniAciklamalar({ Analist: '', Yazılımcı: '', QA: '' });
      verileriGetir();
    } catch { setHata('Hata oluştu.'); }
  };

  const anaBaslikDuzenle = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/AnaBasliklar/${duzenlenecekBaslik.id}`, duzenlenecekBaslik);
      setBasari('Ana başlık güncellendi.');
      setDuzenleModalAcik(false);
      setDuzenlenecekBaslik(null);
      verileriGetir();
    } catch { setHata('Hata oluştu.'); }
  };

  const altKriterDuzenle = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/AltKriterler/${duzenlenecekAltKriter.id}`, duzenlenecekAltKriter);
      await aciklamalariKaydet(duzenlenecekAltKriter.id, duzenlenecekAciklamalar);
      setBasari('Alt kriter güncellendi.');
      setAltKriterDuzenleModalAcik(false);
      setDuzenlenecekAltKriter(null);
      verileriGetir();
    } catch { setHata('Hata oluştu.'); }
  };

  const baslikSil = async (id) => {
    if (!window.confirm('Bu ana başlığı silmek istediğinize emin misiniz?')) return;
    try { await api.delete(`/AnaBasliklar/${id}`); verileriGetir(); } catch {}
  };

  const altKriterSil = async (id) => {
    if (!window.confirm('Bu alt kriteri silmek istediğinize emin misiniz?')) return;
    try { await api.delete(`/AltKriterler/${id}`); verileriGetir(); } catch {}
  };

  const baslikAktifPasif = async (ab) => {
    try { await api.put(`/AnaBasliklar/${ab.id}`, { ...ab, aktifMi: !ab.aktifMi }); verileriGetir(); } catch {}
  };

  const altKriterAktifPasif = async (ak) => {
    try { await api.put(`/AltKriterler/${ak.id}`, { ...ak, aktifMi: !ak.aktifMi }); verileriGetir(); } catch {}
  };

  const AciklamaAlanlari = ({ aciklamalar, onChange }) => (
    <div style={{ marginTop: '8px', borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
      <div style={{ fontSize: '12px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Rol Bazlı Açıklamalar (İsteğe Bağlı)
      </div>
      {ROL_ACIKLAMALARI.map(rol => (
        <div key={rol} style={styles.inputGroup}>
          <label style={{ ...styles.label, color: rol === 'Analist' ? '#60a5fa' : rol === 'Yazılımcı' ? '#a78bfa' : '#34d399' }}>
            {rol}
          </label>
          <textarea
            style={{ ...styles.input, resize: 'vertical', minHeight: '60px', lineHeight: '1.5' }}
            placeholder={`${rol} için bu kriterin açıklaması...`}
            value={aciklamalar[rol] || ''}
            onChange={e => onChange({ ...aciklamalar, [rol]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.sayfa}>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Kriter Yönetimi</h2>
            <p style={styles.altBaslik}>Ana başlıkları ve alt kriterleri yönetin</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setAltKriterModalAcik(true)} style={styles.ikincilButon}>+ Alt Kriter</button>
            <button onClick={() => setModalAcik(true)} style={styles.ekleButon}>+ Ana Başlık</button>
          </div>
        </div>

        {basari && <div style={styles.basariKutusu}>{basari}</div>}
        {hata && <div style={styles.hataKutusu}>{hata}</div>}

        <div style={styles.grid}>
          {anaBasliklar.map(ab => (
            <div key={ab.id} style={styles.kart}>
              <div style={styles.kartUst}>
                <div>
                  <div style={styles.kartBaslik}>{ab.baslik}</div>
                  <div style={styles.kartAgirlik}>Ağırlık: %{ab.agirlikYuzdesi}</div>
                </div>
                <div style={styles.kartSagUst}>
                  <span style={{ ...styles.durumBadge, backgroundColor: ab.aktifMi ? '#14532d' : '#450a0a', color: ab.aktifMi ? '#4ade80' : '#f87171' }}>
                    {ab.aktifMi ? 'Aktif' : 'Pasif'}
                  </span>
                  <button onClick={() => { setDuzenlenecekBaslik({ ...ab }); setDuzenleModalAcik(true); }} style={styles.duzenleButon}>Düzenle</button>
                  <button onClick={() => baslikAktifPasif(ab)} style={styles.islemButon}>{ab.aktifMi ? 'Pasif Yap' : 'Aktif Yap'}</button>
                  <button onClick={() => baslikSil(ab.id)} style={styles.silButon}>Sil</button>
                </div>
              </div>

              <div style={styles.altKriterListesi}>
                <div style={styles.altKriterBaslik}>Alt Kriterler</div>
                {altKriterler.filter(ak => ak.anaBaslikId === ab.id).length === 0 ? (
                  <div style={styles.bosMetin}>Henüz alt kriter eklenmedi.</div>
                ) : (
                  altKriterler.filter(ak => ak.anaBaslikId === ab.id).map(ak => (
                    <div key={ak.id} style={styles.altKriterSatir}>
                      <span style={{ ...styles.altKriterAdi, color: ak.aktifMi ? '#e0e0e0' : '#555' }}>{ak.kriterAdi}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={async () => {
                          const map = await aciklamalariYukle(ak.id);
                          setDuzenlenecekAciklamalar(map);
                          setDuzenlenecekAltKriter({ ...ak });
                          setAltKriterDuzenleModalAcik(true);
                        }} style={styles.kucukDuzenleButon}>Düzenle</button>
                        <button onClick={() => altKriterAktifPasif(ak)} style={styles.kucukIslemButon}>{ak.aktifMi ? 'Pasif' : 'Aktif'}</button>
                        <button onClick={() => altKriterSil(ak.id)} style={styles.kucukSilButon}>Sil</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ana Başlık Ekle Modal */}
        {modalAcik && (
          <div style={styles.modalArkaplan}>
            <div style={styles.modal}>
              <h3 style={styles.modalBaslik}>Yeni Ana Başlık</h3>
              <form onSubmit={anaBaslikEkle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Başlık Adı</label>
                  <input style={styles.input} value={yeniBaslik.baslik}
                    onChange={e => setYeniBaslik({ ...yeniBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input type="number" min="0" max="100" style={styles.input}
                    value={yeniBaslik.agirlikYuzdesi}
                    onChange={e => setYeniBaslik({ ...yeniBaslik, agirlikYuzdesi: parseInt(e.target.value) })} required />
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => setModalAcik(false)} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ana Başlık Düzenle Modal */}
        {duzenleModalAcik && duzenlenecekBaslik && (
          <div style={styles.modalArkaplan}>
            <div style={styles.modal}>
              <h3 style={styles.modalBaslik}>Ana Başlık Düzenle</h3>
              <form onSubmit={anaBaslikDuzenle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Başlık Adı</label>
                  <input style={styles.input} value={duzenlenecekBaslik.baslik}
                    onChange={e => setDuzenlenecekBaslik({ ...duzenlenecekBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input type="number" min="0" max="100" style={styles.input}
                    value={duzenlenecekBaslik.agirlikYuzdesi}
                    onChange={e => setDuzenlenecekBaslik({ ...duzenlenecekBaslik, agirlikYuzdesi: parseInt(e.target.value) })} required />
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => { setDuzenleModalAcik(false); setDuzenlenecekBaslik(null); }} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alt Kriter Ekle Modal */}
        {altKriterModalAcik && (
          <div style={styles.modalArkaplan}>
            <div style={{ ...styles.modal, width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={styles.modalBaslik}>Yeni Alt Kriter</h3>
              <form onSubmit={altKriterEkle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ana Başlık</label>
                  <select style={styles.input} value={yeniAltKriter.anaBaslikId}
                    onChange={e => setYeniAltKriter({ ...yeniAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                    <option value="">Seçin...</option>
                    {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Kriter Adı</label>
                  <input style={styles.input} value={yeniAltKriter.kriterAdi}
                    onChange={e => setYeniAltKriter({ ...yeniAltKriter, kriterAdi: e.target.value })} required />
                </div>
                <AciklamaAlanlari aciklamalar={yeniAciklamalar} onChange={setYeniAciklamalar} />
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => setAltKriterModalAcik(false)} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alt Kriter Düzenle Modal */}
        {altKriterDuzenleModalAcik && duzenlenecekAltKriter && (
          <div style={styles.modalArkaplan}>
            <div style={{ ...styles.modal, width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={styles.modalBaslik}>Alt Kriter Düzenle</h3>
              <form onSubmit={altKriterDuzenle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ana Başlık</label>
                  <select style={styles.input} value={duzenlenecekAltKriter.anaBaslikId}
                    onChange={e => setDuzenlenecekAltKriter({ ...duzenlenecekAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                    {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Kriter Adı</label>
                  <input style={styles.input} value={duzenlenecekAltKriter.kriterAdi}
                    onChange={e => setDuzenlenecekAltKriter({ ...duzenlenecekAltKriter, kriterAdi: e.target.value })} required />
                </div>
                <AciklamaAlanlari aciklamalar={duzenlenecekAciklamalar} onChange={setDuzenlenecekAciklamalar} />
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => { setAltKriterDuzenleModalAcik(false); setDuzenlenecekAltKriter(null); }} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}
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
  ekleButon: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  ikincilButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  basariKutusu: { backgroundColor: 'rgba(20,83,45,0.3)', border: '1px solid #166534', color: '#4ade80', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  hataKutusu: { backgroundColor: 'rgba(69,10,10,0.3)', border: '1px solid #991b1b', color: '#f87171', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  kart: { backgroundColor: '#242424', borderRadius: '8px', padding: '20px', border: '1px solid #2a2a2a' },
  kartUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  kartBaslik: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' },
  kartAgirlik: { fontSize: '13px', color: '#a0a0a0' },
  kartSagUst: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  durumBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  duzenleButon: { padding: '6px 10px', backgroundColor: 'transparent', color: '#60a5fa', border: '1px solid #1e40af', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  islemButon: { padding: '6px 10px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  silButon: { padding: '6px 10px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #991b1b', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  altKriterListesi: { borderTop: '1px solid #2a2a2a', paddingTop: '12px' },
  altKriterBaslik: { fontSize: '12px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
  bosMetin: { fontSize: '13px', color: '#555', fontStyle: 'italic' },
  altKriterSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #2a2a2a' },
  altKriterAdi: { fontSize: '14px' },
  kucukDuzenleButon: { padding: '3px 8px', backgroundColor: 'transparent', color: '#60a5fa', border: '1px solid #1e40af', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  kucukIslemButon: { padding: '3px 8px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  kucukSilButon: { padding: '3px 8px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #991b1b', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  modalArkaplan: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#242424', borderRadius: '12px', padding: '32px', width: '420px', border: '1px solid #333' },
  modalBaslik: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 24px' },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', color: '#b3b3b3', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  modalButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  iptalButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  kaydetButon: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default Kriterler;
