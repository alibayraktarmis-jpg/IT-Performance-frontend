import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconEdit, IconPower, IconTrash, IconAlertTriangle } from '../components/icons';

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
  const [hoveredEkleKart, setHoveredEkleKart] = useState(null);
  const [hoveredAnaButon, setHoveredAnaButon] = useState(false);

  useEffect(() => { verileriGetir(); }, []);

  const verileriGetir = () => {
    api.get('/AnaBasliklar').then(res => setAnaBasliklar(res.data)).catch(() => {});
    api.get('/AltKriterler').then(res => setAltKriterler(res.data)).catch(() => {});
  };

  const aciklamalariYukle = async (altKriterId) => {
    try {
      const res = await api.get(`/KriterAciklamalar/kriter/${altKriterId}`);
      const map = { Analist: '', Yazılımcı: '', QA: '' };
      res.data.forEach(a => { if (map.hasOwnProperty(a.rol)) map[a.rol] = a.aciklama || ''; });
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
      setHata('');
      setModalAcik(false);
      setYeniBaslik({ baslik: '', agirlikYuzdesi: 0 });
      verileriGetir();
    } catch (err) { setHata(err.response?.data?.mesaj || 'Hata oluştu.'); }
  };

  const altKriterEkle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/AltKriterler', { ...yeniAltKriter, aktifMi: true });
      const yeniId = res.data?.id;
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
      setHata('');
      setDuzenleModalAcik(false);
      setDuzenlenecekBaslik(null);
      verileriGetir();
    } catch (err) { setHata(err.response?.data?.mesaj || 'Hata oluştu.'); }
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
    try {
      await api.delete(`/AnaBasliklar/${id}`);
      setHata('');
      verileriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'Ana başlık silinirken hata oluştu.');
    }
  };

  const altKriterSil = async (id) => {
    if (!window.confirm('Bu alt kriteri silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/AltKriterler/${id}`);
      setHata('');
      verileriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'Alt kriter silinirken hata oluştu.');
    }
  };

  const baslikAktifPasif = async (ab) => {
    try {
      // Backend, ana baslik pasife alindiginda alt kriterleri otomatik pasife alir;
      // aktiflestirmede ise alt kriterlerin durumuna dokunmaz.
      await api.put(`/AnaBasliklar/${ab.id}`, { ...ab, aktifMi: !ab.aktifMi });
      setHata('');
      verileriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.');
      setTimeout(() => setHata(''), 4000);
    }
  };

  const altKriterAktifPasif = async (ak) => {
    if (!ak.aktifMi) {
      const anaBaslik = anaBasliklar.find(ab => ab.id === ak.anaBaslikId);
      if (anaBaslik && !anaBaslik.aktifMi) {
        setHata(`Önce "${anaBaslik.baslik}" ana kriterini aktif yapın.`);
        setTimeout(() => setHata(''), 3000);
        return;
      }
    }
    try {
      await api.put(`/AltKriterler/${ak.id}`, { ...ak, aktifMi: !ak.aktifMi });
      setHata('');
      verileriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.');
      setTimeout(() => setHata(''), 4000);
    }
  };

  const AciklamaAlanlari = ({ aciklamalar, onChange }) => (
    <div style={{ marginTop: '8px', borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Rol Bazlı Açıklamalar (İsteğe Bağlı)
      </div>
      {ROL_ACIKLAMALARI.map(rol => (
        <div key={rol} style={styles.inputGroup}>
          <label style={styles.label}>{rol}</label>
          <textarea
            className="kriter-input"
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
      <style>{`
        .kriter-input:focus {
          outline: none;
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
        }
        .sil-buton:hover {
          color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.12) !important;
        }
        .duzenle-buton:hover {
          color: #60a5fa !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .pasif-buton:hover {
          color: #fbbf24 !important;
          background-color: rgba(245, 158, 11, 0.1) !important;
        }
        .aktif-buton:hover {
          color: #34d399 !important;
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
        .alt-kriter-satir:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Kriter Yönetimi</h2>
            <p style={styles.altBaslik}>Ana başlıkları ve alt kriterleri yönetin</p>
          </div>
          <button
            onClick={() => setModalAcik(true)}
            onMouseEnter={() => setHoveredAnaButon(true)}
            onMouseLeave={() => setHoveredAnaButon(false)}
            style={{
              ...styles.ekleButon,
              backgroundColor: hoveredAnaButon ? '#6366f1' : '#4f46e5',
              transform: hoveredAnaButon ? 'translateY(-1px)' : 'none',
              boxShadow: hoveredAnaButon ? '0 4px 14px rgba(79,70,229,0.4)' : 'none',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>Yeni Ana Başlık</span>
          </button>
        </div>

        {basari && <div style={styles.basariKutusu}>{basari}</div>}
        {hata && (
          <div style={styles.hataKutusu}>
            <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
            <span>{hata}</span>
          </div>
        )}

        <div style={styles.grid}>
          {anaBasliklar.map(ab => (
            <div key={ab.id} style={{ ...styles.kart, opacity: ab.aktifMi ? 1 : 0.75 }}>
              {/* Kart Başlık Satırı */}
              <div style={styles.kartUst}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={styles.kartBaslik}>{ab.baslik}</span>
                    <span style={styles.agirlikBadge}>%{ab.agirlikYuzdesi}</span>
                    <span style={ab.aktifMi ? styles.aktifBadge : styles.pasifBadge}>
                      {ab.aktifMi ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
                {/* Eylem butonları — sağda, asla wrap etme */}
                <div style={styles.eylemGrup}>
                  <button
                    title="Düzenle"
                    onClick={() => { setDuzenlenecekBaslik({ ...ab }); setDuzenleModalAcik(true); }}
                    className="duzenle-buton"
                    style={styles.ikonButon}
                  >
                    <IconEdit />
                  </button>
                  <button
                    title={ab.aktifMi ? 'Pasif Yap' : 'Aktifleştir'}
                    onClick={() => baslikAktifPasif(ab)}
                    className={ab.aktifMi ? 'pasif-buton' : 'aktif-buton'}
                    style={styles.ikonButon}
                  >
                    <IconPower />
                  </button>
                  <button
                    title="Sil"
                    onClick={() => baslikSil(ab.id)}
                    className="sil-buton"
                    style={styles.ikonButon}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>

              {/* Ağırlık progress bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ height: '3px', backgroundColor: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${ab.agirlikYuzdesi}%`,
                    height: '100%',
                    backgroundColor: ab.aktifMi ? '#4f46e5' : '#444',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Alt Kriterler */}
              <div style={styles.altKriterListesi}>
                <div style={styles.altKriterBaslik}>Alt Kriterler</div>
                {altKriterler.filter(ak => ak.anaBaslikId === ab.id).length === 0
                  ? <div style={styles.bosMetin}>Henüz alt kriter eklenmedi.</div>
                  : altKriterler.filter(ak => ak.anaBaslikId === ab.id).map(ak => (
                    <div key={ak.id} className="alt-kriter-satir" style={styles.altKriterSatir}>
                      <span style={{
                        ...styles.altKriterAdi,
                        color: ak.aktifMi ? '#d1d5db' : '#4b5563',
                        textDecoration: ak.aktifMi ? 'none' : 'line-through',
                      }}>
                        {ak.kriterAdi}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          title="Düzenle"
                          className="duzenle-buton"
                          onClick={async () => {
                            const map = await aciklamalariYukle(ak.id);
                            setDuzenlenecekAciklamalar(map);
                            setDuzenlenecekAltKriter({ ...ak });
                            setAltKriterDuzenleModalAcik(true);
                          }}
                          style={styles.kucukIkonButon}
                        >
                          <IconEdit />
                        </button>
                        <button
                          title={ak.aktifMi ? 'Pasif Yap' : 'Aktifleştir'}
                          onClick={() => altKriterAktifPasif(ak)}
                          className={ak.aktifMi ? 'pasif-buton' : 'aktif-buton'}
                          style={styles.kucukIkonButon}
                        >
                          <IconPower />
                        </button>
                        <button
                          title="Sil"
                          onClick={() => altKriterSil(ak.id)}
                          className="sil-buton"
                          style={styles.kucukIkonButon}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))
                }

                {/* Kart içi alt kriter ekleme butonu */}
                <button
                  onMouseEnter={() => setHoveredEkleKart(ab.id)}
                  onMouseLeave={() => setHoveredEkleKart(null)}
                  onClick={() => {
                    setYeniAltKriter({ anaBaslikId: ab.id, kriterAdi: '' });
                    setYeniAciklamalar({ Analist: '', Yazılımcı: '', QA: '' });
                    setAltKriterModalAcik(true);
                  }}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: hoveredEkleKart === ab.id ? 'rgba(30,41,59,0.4)' : 'transparent',
                    border: '1px dashed #334155',
                    borderRadius: '6px',
                    color: hoveredEkleKart === ab.id ? '#cbd5e1' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    letterSpacing: '0.3px',
                  }}
                >
                  + Alt Kriter Ekle
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ana Başlık Ekle Modal */}
        {modalAcik && (
          <div style={styles.modalArkaplan} onClick={() => { setModalAcik(false); setHata(''); }}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={{ ...styles.modalBaslik, padding: 0, marginBottom: '24px' }}>Yeni Ana Başlık</h3>
              {hata && (
                <div style={{ ...styles.hataKutusu, marginBottom: '16px' }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
                  <span>{hata}</span>
                </div>
              )}
              <form onSubmit={anaBaslikEkle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Başlık Adı</label>
                  <input className="kriter-input" style={styles.input} value={yeniBaslik.baslik}
                    onChange={e => setYeniBaslik({ ...yeniBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input className="kriter-input" type="number" min="0" max="100" style={styles.input}
                    value={yeniBaslik.agirlikYuzdesi}
                    onChange={e => setYeniBaslik({ ...yeniBaslik, agirlikYuzdesi: parseInt(e.target.value) })} required />
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => { setModalAcik(false); setHata(''); }} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ana Başlık Düzenle Modal */}
        {duzenleModalAcik && duzenlenecekBaslik && (
          <div style={styles.modalArkaplan} onClick={() => { setDuzenleModalAcik(false); setDuzenlenecekBaslik(null); setHata(''); }}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={{ ...styles.modalBaslik, padding: 0, marginBottom: '24px' }}>Ana Başlık Düzenle</h3>
              {hata && (
                <div style={{ ...styles.hataKutusu, marginBottom: '16px' }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
                  <span>{hata}</span>
                </div>
              )}
              <form onSubmit={anaBaslikDuzenle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Başlık Adı</label>
                  <input className="kriter-input" style={styles.input} value={duzenlenecekBaslik.baslik}
                    onChange={e => setDuzenlenecekBaslik({ ...duzenlenecekBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input className="kriter-input" type="number" min="0" max="100" style={styles.input}
                    value={duzenlenecekBaslik.agirlikYuzdesi}
                    onChange={e => setDuzenlenecekBaslik({ ...duzenlenecekBaslik, agirlikYuzdesi: parseInt(e.target.value) })} required />
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => { setDuzenleModalAcik(false); setDuzenlenecekBaslik(null); setHata(''); }} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alt Kriter Ekle Modal */}
        {altKriterModalAcik && (
          <div style={styles.modalArkaplan} onClick={() => setAltKriterModalAcik(false)}>
            <div style={styles.modalGenis} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalBaslik}>Yeni Alt Kriter</h3>
              <div style={styles.modalIcerik}>
                <form onSubmit={altKriterEkle}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Ana Başlık</label>
                    <select className="kriter-input" style={styles.input} value={yeniAltKriter.anaBaslikId}
                      onChange={e => setYeniAltKriter({ ...yeniAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                      <option value="">Seçin...</option>
                      {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Kriter Adı</label>
                    <input className="kriter-input" style={styles.input} value={yeniAltKriter.kriterAdi}
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
          </div>
        )}

        {/* Alt Kriter Düzenle Modal */}
        {altKriterDuzenleModalAcik && duzenlenecekAltKriter && (
          <div style={styles.modalArkaplan} onClick={() => { setAltKriterDuzenleModalAcik(false); setDuzenlenecekAltKriter(null); }}>
            <div style={styles.modalGenis} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalBaslik}>Alt Kriter Düzenle</h3>
              <div style={styles.modalIcerik}>
              <form onSubmit={altKriterDuzenle}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Ana Başlık</label>
                  <select className="kriter-input" style={styles.input} value={duzenlenecekAltKriter.anaBaslikId}
                    onChange={e => setDuzenlenecekAltKriter({ ...duzenlenecekAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                    {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Kriter Adı</label>
                  <input className="kriter-input" style={styles.input} value={duzenlenecekAltKriter.kriterAdi}
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
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  sayfa: { display: 'flex', backgroundColor: '#111111', minHeight: '100vh', color: '#fff' },
  icerik: { marginLeft: '220px', padding: '32px 40px', flex: 1 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #222', paddingBottom: '20px' },
  baslik: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' },
  altBaslik: { fontSize: '14px', color: '#6b7280', margin: 0 },
  ekleButon: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' },
  basariKutusu: { backgroundColor: 'rgba(20,83,45,0.25)', border: '1px solid #166534', color: '#4ade80', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  hataKutusu: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },

  kart: {
    backgroundColor: '#1a1a1a',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    transition: 'box-shadow 0.2s ease',
  },

  kartUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' },
  kartBaslik: { fontSize: '15px', fontWeight: '600', color: '#f3f4f6' },

  agirlikBadge: {
    fontSize: '11px', fontWeight: '600', padding: '2px 7px',
    backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8',
    borderRadius: '12px', whiteSpace: 'nowrap',
  },
  aktifBadge: {
    fontSize: '11px', fontWeight: '600', padding: '2px 7px',
    backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399',
    borderRadius: '12px', whiteSpace: 'nowrap',
  },
  pasifBadge: {
    fontSize: '11px', fontWeight: '600', padding: '2px 7px',
    backgroundColor: 'rgba(244,63,94,0.1)', color: '#fb7185',
    borderRadius: '12px', whiteSpace: 'nowrap',
  },

  eylemGrup: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },

  ikonButon: {
    padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', color: '#9ca3af', border: 'none',
    borderRadius: '6px', cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },

  altKriterListesi: { borderTop: '1px solid #222', paddingTop: '14px' },
  altKriterBaslik: { fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '10px', fontWeight: '600' },
  bosMetin: { fontSize: '13px', color: '#374151', fontStyle: 'italic' },
  altKriterSatir: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 8px', margin: '0 -8px', borderRadius: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background-color 0.15s',
  },
  altKriterAdi: { fontSize: '13px', flex: 1, minWidth: 0 },

  kucukIkonButon: {
    padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', color: '#9ca3af', border: 'none',
    borderRadius: '6px', cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },

  modalArkaplan: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '32px', width: '420px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalGenis: { backgroundColor: '#1a1a1a', borderRadius: '12px', width: '520px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' },
  modalIcerik: { overflowY: 'auto', padding: '0 32px 32px', flexShrink: 1 },
  modalBaslik: { fontSize: '17px', fontWeight: '600', color: '#fff', margin: '0', padding: '32px 32px 20px', flexShrink: 0 },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #3d3d3d', borderRadius: '6px', color: '#f3f4f6', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  modalButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  iptalButon: { padding: '9px 18px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #2d2d2d', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  kaydetButon: { padding: '9px 18px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};

export default Kriterler;
