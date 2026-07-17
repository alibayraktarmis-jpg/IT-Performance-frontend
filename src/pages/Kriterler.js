import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconEdit, IconPower, IconTrash, IconAlertTriangle } from '../components/icons';
import { Spinner, HataKutusu } from '../components/DurumGostergesi';
import { toastGoster } from '../services/toast';

const ROL_ACIKLAMALARI = ['Analist', 'Yazılımcı', 'QA'];

function AciklamaAlanlari({ aciklamalar, onChange }) {
  return (
    <div style={{ marginTop: '8px', borderTop: '1px solid #2a2a2a', paddingTop: '14px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Rol Bazlı Açıklamalar (İsteğe Bağlı)
      </div>
      {ROL_ACIKLAMALARI.map(rol => (
        <div key={rol} style={styles.inputGroup}>
          <label htmlFor={`aciklama-${rol}`} style={styles.label}>{rol}</label>
          <textarea
            id={`aciklama-${rol}`}
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
}

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
  const [hata, setHata] = useState('');
  const [silinecek, setSilinecek] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [getirmeHatasi, setGetirmeHatasi] = useState(null);

  useEffect(() => { verileriGetir(true); }, []);

  useEffect(() => {
    const escKapat = (e) => {
      if (e.key !== 'Escape') return;
      setModalAcik(false);
      setDuzenleModalAcik(false); setDuzenlenecekBaslik(null);
      setAltKriterModalAcik(false);
      setAltKriterDuzenleModalAcik(false); setDuzenlenecekAltKriter(null);
      setSilinecek(null);
    };
    document.addEventListener('keydown', escKapat);
    return () => document.removeEventListener('keydown', escKapat);
  }, []);

  const verileriGetir = (ilkYukleme) => {
    if (ilkYukleme) { setYukleniyor(true); setGetirmeHatasi(null); }
    Promise.all([
      api.get('/AnaBasliklar').then(res => setAnaBasliklar(res.data)),
      api.get('/AltKriterler').then(res => setAltKriterler(res.data)),
    ])
      .then(() => { if (ilkYukleme) setYukleniyor(false); })
      .catch(() => { if (ilkYukleme) { setGetirmeHatasi('Kriterler yüklenemedi.'); setYukleniyor(false); } });
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
      toastGoster('Ana başlık eklendi.', 'basari');
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
      toastGoster('Alt kriter eklendi.', 'basari');
      setAltKriterModalAcik(false);
      setYeniAltKriter({ anaBaslikId: '', kriterAdi: '' });
      setYeniAciklamalar({ Analist: '', Yazılımcı: '', QA: '' });
      verileriGetir();
    } catch (err) { toastGoster(err.response?.data?.mesaj || 'Hata oluştu.', 'hata'); }
  };

  const anaBaslikDuzenle = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/AnaBasliklar/${duzenlenecekBaslik.id}`, duzenlenecekBaslik);
      toastGoster('Ana başlık güncellendi.', 'basari');
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
      toastGoster('Alt kriter güncellendi.', 'basari');
      setAltKriterDuzenleModalAcik(false);
      setDuzenlenecekAltKriter(null);
      verileriGetir();
    } catch (err) { toastGoster(err.response?.data?.mesaj || 'Hata oluştu.', 'hata'); }
  };

  const silOnayla = async () => {
    const { tip, id } = silinecek;
    setSilinecek(null);
    try {
      await api.delete(tip === 'baslik' ? `/AnaBasliklar/${id}` : `/AltKriterler/${id}`);
      verileriGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || (tip === 'baslik' ? 'Ana başlık silinirken hata oluştu.' : 'Alt kriter silinirken hata oluştu.'), 'hata');
    }
  };

  const baslikAktifPasif = async (ab) => {
    try {
      await api.put(`/AnaBasliklar/${ab.id}`, { ...ab, aktifMi: !ab.aktifMi });
      verileriGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.', 'hata');
    }
  };

  const altKriterAktifPasif = async (ak) => {
    if (!ak.aktifMi) {
      const anaBaslik = anaBasliklar.find(ab => ab.id === ak.anaBaslikId);
      if (anaBaslik && !anaBaslik.aktifMi) {
        toastGoster(`Önce "${anaBaslik.baslik}" ana kriterini aktif yapın.`, 'hata');
        return;
      }
    }
    try {
      await api.put(`/AltKriterler/${ak.id}`, { ...ak, aktifMi: !ak.aktifMi });
      verileriGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.', 'hata');
    }
  };

  return (
    <div style={styles.sayfa}>
      <style>{`
        .kriter-input:focus {
          outline: none;
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
        }
        .ana-ekle-buton:hover {
          background-color: #6366f1 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(79,70,229,0.4);
        }
        .alt-ekle-buton:hover {
          background-color: rgba(30,41,59,0.4) !important;
          color: #cbd5e1 !important;
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
        .sil-modal-iptal:hover {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .sil-modal-sil:hover {
          background-color: #e11d48 !important;
        }
        @media (max-width: 768px) {
          .icerik-responsive { margin-left: 0 !important; margin-top: 56px !important; padding: 20px 16px !important; min-width: 0 !important; }
          .kriter-topbar-responsive { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>
      <Sidebar />
      <div className="icerik-responsive" style={styles.icerik}>
        <div className="kriter-topbar-responsive" style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Kriter Yönetimi</h2>
            <p style={styles.altBaslik}>Ana başlıkları ve alt kriterleri yönetin</p>
          </div>
          <button
            onClick={() => setModalAcik(true)}
            className="ana-ekle-buton"
            style={styles.ekleButon}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>Yeni Ana Başlık</span>
          </button>
        </div>

        {yukleniyor ? (
          <Spinner />
        ) : getirmeHatasi ? (
          <HataKutusu mesaj={getirmeHatasi} onTekrarDene={() => verileriGetir(true)} />
        ) : (
        <>
        {(() => {
          const toplamAgirlik = anaBasliklar.filter(ab => ab.aktifMi).reduce((s, ab) => s + ab.agirlikYuzdesi, 0);
          const tamMi = toplamAgirlik === 100;
          return (
            <div style={{
              ...styles.hataKutusu,
              backgroundColor: tamMi ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${tamMi ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}`,
              color: tamMi ? '#34d399' : '#fbbf24',
            }}>
              <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
              <span>
                Toplam Aktif Ağırlık: <strong>%{toplamAgirlik}</strong>
                {!tamMi && ' — bu %100 olmadığı sürece hiçbir çalışan tam puan (100) alamaz.'}
              </span>
            </div>
          );
        })()}

        <div style={styles.grid}>
          {anaBasliklar.map(ab => (
            <div key={ab.id} style={{ ...styles.kart, opacity: ab.aktifMi ? 1 : 0.75 }}>
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
                <div style={styles.eylemGrup}>
                  <button
                    title="Düzenle"
                    aria-label={`${ab.baslik} başlığını düzenle`}
                    onClick={() => { setDuzenlenecekBaslik({ ...ab }); setDuzenleModalAcik(true); }}
                    className="duzenle-buton"
                    style={styles.ikonButon}
                  >
                    <IconEdit />
                  </button>
                  <button
                    title={ab.aktifMi ? 'Pasif Yap' : 'Aktifleştir'}
                    aria-label={`${ab.baslik} başlığını ${ab.aktifMi ? 'pasif yap' : 'aktifleştir'}`}
                    onClick={() => baslikAktifPasif(ab)}
                    className={ab.aktifMi ? 'pasif-buton' : 'aktif-buton'}
                    style={styles.ikonButon}
                  >
                    <IconPower />
                  </button>
                  <button
                    title="Sil"
                    aria-label={`${ab.baslik} başlığını sil`}
                    onClick={() => setSilinecek({ tip: 'baslik', id: ab.id })}
                    className="sil-buton"
                    style={styles.ikonButon}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>

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
                          aria-label={`${ak.kriterAdi} kriterini düzenle`}
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
                          aria-label={`${ak.kriterAdi} kriterini ${ak.aktifMi ? 'pasif yap' : 'aktifleştir'}`}
                          onClick={() => altKriterAktifPasif(ak)}
                          className={ak.aktifMi ? 'pasif-buton' : 'aktif-buton'}
                          style={styles.kucukIkonButon}
                        >
                          <IconPower />
                        </button>
                        <button
                          title="Sil"
                          aria-label={`${ak.kriterAdi} kriterini sil`}
                          onClick={() => setSilinecek({ tip: 'altKriter', id: ak.id })}
                          className="sil-buton"
                          style={styles.kucukIkonButon}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))
                }

                <button
                  className="alt-ekle-buton"
                  onClick={() => {
                    setYeniAltKriter({ anaBaslikId: ab.id, kriterAdi: '' });
                    setYeniAciklamalar({ Analist: '', Yazılımcı: '', QA: '' });
                    setAltKriterModalAcik(true);
                  }}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: '1px dashed #334155',
                    borderRadius: '6px',
                    color: '#94a3b8',
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
        </>
        )}

        {modalAcik && (
          <div style={styles.modalArkaplan} onClick={() => { setModalAcik(false); setHata(''); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="yeni-baslik-modal" style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 id="yeni-baslik-modal" style={{ ...styles.modalBaslik, padding: 0, marginBottom: '24px' }}>Yeni Ana Başlık</h3>
              {hata && (
                <div style={{ ...styles.hataKutusu, marginBottom: '16px' }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
                  <span>{hata}</span>
                </div>
              )}
              <form onSubmit={anaBaslikEkle}>
                <div style={styles.inputGroup}>
                  <label htmlFor="yeni-baslik-adi" style={styles.label}>Başlık Adı</label>
                  <input id="yeni-baslik-adi" className="kriter-input" style={styles.input} value={yeniBaslik.baslik}
                    onChange={e => setYeniBaslik({ ...yeniBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="yeni-baslik-agirlik" style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input id="yeni-baslik-agirlik" className="kriter-input" type="number" min="0" max="100" style={styles.input}
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

        {duzenleModalAcik && duzenlenecekBaslik && (
          <div style={styles.modalArkaplan} onClick={() => { setDuzenleModalAcik(false); setDuzenlenecekBaslik(null); setHata(''); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="duzenle-baslik-modal" style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 id="duzenle-baslik-modal" style={{ ...styles.modalBaslik, padding: 0, marginBottom: '24px' }}>Ana Başlık Düzenle</h3>
              {hata && (
                <div style={{ ...styles.hataKutusu, marginBottom: '16px' }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><IconAlertTriangle /></span>
                  <span>{hata}</span>
                </div>
              )}
              <form onSubmit={anaBaslikDuzenle}>
                <div style={styles.inputGroup}>
                  <label htmlFor="duzenle-baslik-adi" style={styles.label}>Başlık Adı</label>
                  <input id="duzenle-baslik-adi" className="kriter-input" style={styles.input} value={duzenlenecekBaslik.baslik}
                    onChange={e => setDuzenlenecekBaslik({ ...duzenlenecekBaslik, baslik: e.target.value })} required />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="duzenle-baslik-agirlik" style={styles.label}>Ağırlık Yüzdesi (%)</label>
                  <input id="duzenle-baslik-agirlik" className="kriter-input" type="number" min="0" max="100" style={styles.input}
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

        {altKriterModalAcik && (
          <div style={styles.modalArkaplan} onClick={() => setAltKriterModalAcik(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="yeni-altkriter-modal" style={styles.modalGenis} onClick={e => e.stopPropagation()}>
              <h3 id="yeni-altkriter-modal" style={styles.modalBaslik}>Yeni Alt Kriter</h3>
              <div style={styles.modalIcerik}>
                <form onSubmit={altKriterEkle}>
                  <div style={styles.inputGroup}>
                    <label htmlFor="yeni-altkriter-ana" style={styles.label}>Ana Başlık</label>
                    <select id="yeni-altkriter-ana" className="kriter-input" style={styles.input} value={yeniAltKriter.anaBaslikId}
                      onChange={e => setYeniAltKriter({ ...yeniAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                      <option value="">Seçin...</option>
                      {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label htmlFor="yeni-altkriter-adi" style={styles.label}>Kriter Adı</label>
                    <input id="yeni-altkriter-adi" className="kriter-input" style={styles.input} value={yeniAltKriter.kriterAdi}
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

        {altKriterDuzenleModalAcik && duzenlenecekAltKriter && (
          <div style={styles.modalArkaplan} onClick={() => { setAltKriterDuzenleModalAcik(false); setDuzenlenecekAltKriter(null); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="duzenle-altkriter-modal" style={styles.modalGenis} onClick={e => e.stopPropagation()}>
              <h3 id="duzenle-altkriter-modal" style={styles.modalBaslik}>Alt Kriter Düzenle</h3>
              <div style={styles.modalIcerik}>
              <form onSubmit={altKriterDuzenle}>
                <div style={styles.inputGroup}>
                  <label htmlFor="duzenle-altkriter-ana" style={styles.label}>Ana Başlık</label>
                  <select id="duzenle-altkriter-ana" className="kriter-input" style={styles.input} value={duzenlenecekAltKriter.anaBaslikId}
                    onChange={e => setDuzenlenecekAltKriter({ ...duzenlenecekAltKriter, anaBaslikId: parseInt(e.target.value) })} required>
                    {anaBasliklar.map(ab => <option key={ab.id} value={ab.id}>{ab.baslik}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="duzenle-altkriter-adi" style={styles.label}>Kriter Adı</label>
                  <input id="duzenle-altkriter-adi" className="kriter-input" style={styles.input} value={duzenlenecekAltKriter.kriterAdi}
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

        {silinecek && (
          <div style={styles.modalArkaplan} onClick={() => setSilinecek(null)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="sil-onay-modal" style={styles.silModal} onClick={e => e.stopPropagation()}>
              <div style={styles.silIkonKapsayici}><IconAlertTriangle size={24} /></div>
              <h3 id="sil-onay-modal" style={styles.silBaslik}>{silinecek.tip === 'baslik' ? 'Ana Başlığı Sil' : 'Alt Kriteri Sil'}</h3>
              <p style={styles.silAciklama}>
                {silinecek.tip === 'baslik'
                  ? 'Bu ana başlığı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
                  : 'Bu alt kriteri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'}
              </p>
              <div style={styles.silButonlar}>
                <button type="button" className="sil-modal-iptal" onClick={() => setSilinecek(null)} style={styles.silIptalButon}>İptal</button>
                <button type="button" className="sil-modal-sil" onClick={silOnayla} style={styles.silOnaylaButon}>Sil</button>
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
  altKriterBaslik: { fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '10px', fontWeight: '600' },
  bosMetin: { fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' },
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
  modal: { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '32px', width: '420px', maxWidth: '92vw', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalGenis: { backgroundColor: '#1a1a1a', borderRadius: '12px', width: '520px', maxWidth: '92vw', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' },
  modalIcerik: { overflowY: 'auto', padding: '0 32px 32px', flexShrink: 1 },
  modalBaslik: { fontSize: '17px', fontWeight: '600', color: '#fff', margin: '0', padding: '32px 32px 20px', flexShrink: 0 },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #3d3d3d', borderRadius: '6px', color: '#f3f4f6', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  modalButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  iptalButon: { padding: '9px 18px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #2d2d2d', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  kaydetButon: { padding: '9px 18px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  silModal: { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '36px', width: '100%', maxWidth: '480px', margin: '0 20px', textAlign: 'center', boxSizing: 'border-box' },
  silIkonKapsayici: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  silBaslik: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 8px' },
  silAciklama: { color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' },
  silButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  silIptalButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.15s, background-color 0.15s' },
  silOnaylaButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#f43f5e', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(244,63,94,0.25)', transition: 'all 0.15s' },
};

export default Kriterler;
