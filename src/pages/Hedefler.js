import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconCheck, IconEdit, IconTrash, IconRotateCcw, IconClock, IconCalendar, IconAlertTriangle } from '../components/icons';

function Hedefler() {
  const rol = localStorage.getItem('rol');
  const kullaniciDepartman = localStorage.getItem('departman');
  const [hedefler, setHedefler] = useState([]);
  const [calisanlar, setCalisanlar] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [secilenCalisan, setSecilenCalisan] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [bitisTarihi, setBitisTarihi] = useState('');
  const [hata, setHata] = useState('');
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenlenecekHedef, setDuzenlenecekHedef] = useState(null);
  const [duzenleAciklama, setDuzenleAciklama] = useState('');
  const [duzenleBitis, setDuzenleBitis] = useState('');
  const [silinecekId, setSilinecekId] = useState(null);

  const hedefleriGetir = useCallback(() => {
    api.get('/Hedefler').then(res => {
      const tumHedefler = res.data;
      const filtreli = rol === 'Evaluator' ? tumHedefler.filter(h => h.departman === kullaniciDepartman) : tumHedefler;
      setHedefler(filtreli);
    }).catch(() => {});
  }, [rol, kullaniciDepartman]);

  useEffect(() => {
    hedefleriGetir();
    if (rol === 'Admin' || rol === 'Evaluator') {
      api.get('/Kullanicilar').then(res => {
        setCalisanlar(res.data.filter(k => k.rol === 'Employee' && k.aktifMi && (rol === 'Admin' || k.departman === kullaniciDepartman)));
      }).catch(() => {});
    }
  }, [rol, kullaniciDepartman, hedefleriGetir]);

  const hedefEkle = async () => {
    if (!secilenCalisan || !aciklama || !bitisTarihi) {
      setHata('Tüm alanları doldurun.');
      return;
    }
    try {
      await api.post('/Hedefler', {
        calisanId: parseInt(secilenCalisan),
        aciklama,
        bitisTarihi: new Date(bitisTarihi).toISOString(),
        tamamlandiMi: false
      });
      setModalAcik(false);
      setSecilenCalisan('');
      setAciklama('');
      setBitisTarihi('');
      setHata('');
      hedefleriGetir();
    } catch {
      setHata('Hedef eklenirken hata oluştu.');
    }
  };

  const tamamla = async (hedefId, tamamlandi) => {
    const endpoint = tamamlandi ? `/Hedefler/${hedefId}/geriAl` : `/Hedefler/${hedefId}/tamamla`;
    try {
      await api.put(endpoint);
      setHata('');
      hedefleriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.');
    }
  };

  const duzenleAc = (h) => {
    setDuzenlenecekHedef(h);
    setDuzenleAciklama(h.aciklama ?? '');
    const bitis = new Date(h.bitisTarihi);
    setDuzenleBitis(bitis.toISOString().split('T')[0]);
    setDuzenleModalAcik(true);
  };

  const hedefGuncelle = async () => {
    if (!duzenleAciklama || !duzenleBitis) return;
    try {
      await api.put(`/Hedefler/${duzenlenecekHedef.id}`, {
        aciklama: duzenleAciklama,
        bitisTarihi: new Date(duzenleBitis).toISOString()
      });
      setDuzenleModalAcik(false);
      setDuzenlenecekHedef(null);
      hedefleriGetir();
    } catch {
      setHata('Güncelleme sırasında hata oluştu.');
    }
  };

  const silOnayla = async () => {
    const id = silinecekId;
    setSilinecekId(null);
    try {
      await api.delete(`/Hedefler/${id}`);
      setHata('');
      hedefleriGetir();
    } catch (err) {
      setHata(err.response?.data?.mesaj || 'Hedef silinirken hata oluştu.');
    }
  };

  const bugun = new Date();
  const aktifHedefler = hedefler.filter(h => !h.tamamlandiMi && new Date(h.bitisTarihi) >= bugun);
  const suresiGecmis = hedefler.filter(h => !h.tamamlandiMi && new Date(h.bitisTarihi) < bugun);
  const tamamlananlar = hedefler.filter(h => h.tamamlandiMi);

  const HedefKart = ({ h }) => {
    const tamamlandi = h.tamamlandiMi;
    const bitis = new Date(h.bitisTarihi);
    const gecti = !tamamlandi && bitis < bugun;
    const kalan = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));
    const [hovBtn, setHovBtn] = React.useState(null);

    const solCizgi = tamamlandi ? '#166534' : gecti ? '#ef4444' : '#4f46e5';

    return (
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#121212',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 20px 16px 24px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        gap: '12px',
        minWidth: 0,
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: solCizgi }} />
        {/* Üst: isim + hedef metni */}
        <div>
          {(rol === 'Admin' || rol === 'Evaluator') && (
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
              {h.ad} {h.soyad} · {h.departman}
            </div>
          )}
          <div style={{
            fontSize: '15px',
            fontWeight: '500',
            color: tamamlandi ? '#6b7280' : '#f3f4f6',
            textDecoration: tamamlandi ? 'line-through' : 'none',
            lineHeight: '1.6'
          }}>
            {h.aciklama}
          </div>
        </div>

        {/* Alt: tarih bilgisi + butonlar aynı hizada */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: gecti ? '#fb7185' : tamamlandi ? '#34d399' : '#6b7280' }}>
              <span style={{ color: '#94a3b8', display: 'flex' }}><IconClock /></span>
              {tamamlandi ? 'Tamamlandı' : gecti ? `${Math.abs(kalan)} gün geçti` : kalan === 0 ? 'Bugün bitiyor' : `${kalan} gün kaldı`}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#4b5563' }}>
              <span style={{ color: '#94a3b8', display: 'flex' }}><IconCalendar /></span>
              Bitiş: {bitis.toLocaleDateString('tr-TR')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {(rol === 'Admin' || rol === 'Evaluator') && (
              <button
                title={tamamlandi ? 'Geri Al' : 'Tamamlandı'}
                onClick={() => tamamla(h.id, tamamlandi)}
                onMouseEnter={() => setHovBtn('tamam')}
                onMouseLeave={() => setHovBtn(null)}
                style={{
                  padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  backgroundColor: hovBtn === 'tamam' ? (tamamlandi ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.1)') : 'transparent',
                  color: hovBtn === 'tamam' ? (tamamlandi ? '#d1d5db' : '#34d399') : '#9ca3af',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                {tamamlandi ? <IconRotateCcw /> : <IconCheck />}
              </button>
            )}
            {(rol === 'Admin' || rol === 'Evaluator') && (
              <>
                <button
                  title="Düzenle"
                  onClick={() => duzenleAc(h)}
                  onMouseEnter={() => setHovBtn('duzenle')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                    backgroundColor: hovBtn === 'duzenle' ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: hovBtn === 'duzenle' ? '#60a5fa' : '#9ca3af',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  <IconEdit />
                </button>
                <button
                  title="Sil"
                  onClick={() => setSilinecekId(h.id)}
                  onMouseEnter={() => setHovBtn('sil')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                    backgroundColor: hovBtn === 'sil' ? 'rgba(239,68,68,0.12)' : 'transparent',
                    color: hovBtn === 'sil' ? '#ef4444' : '#9ca3af',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  <IconTrash />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.sayfa}>
      <style>{`
        .sil-modal-iptal:hover {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .sil-modal-sil:hover {
          background-color: #e11d48 !important;
        }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Hedefler</h2>
            <p style={styles.altBaslik}>{rol === 'Employee' ? 'Hedeflerinizi takip edin ve tamamlayın' : 'Çalışan hedeflerini atayın ve takip edin'}</p>
          </div>
          {(rol === 'Admin' || rol === 'Evaluator') && (
            <button onClick={() => setModalAcik(true)} style={styles.ekleButon}>+ Hedef Ekle</button>
          )}
        </div>

        {hata && <div style={styles.hataKutu}>{hata}</div>}

        <div style={styles.bolum}>
          <div style={styles.bolumBaslik}>
            Aktif Hedefler
            <span style={styles.sayi}>{aktifHedefler.length}</span>
          </div>
          {aktifHedefler.length === 0
            ? <div style={styles.bos}>Aktif hedef bulunmuyor.</div>
            : <div style={styles.kartGrid}>
                {aktifHedefler.map((h, i) => <HedefKart key={i} h={h} />)}
              </div>
          }
        </div>

        {suresiGecmis.length > 0 && (
          <div style={styles.bolum}>
            <div style={styles.bolumBaslik}>
              Süresi Geçmiş
              <span style={{ ...styles.sayi, backgroundColor: '#7f1d1d', color: '#f87171' }}>{suresiGecmis.length}</span>
            </div>
            <div style={styles.kartGrid}>
              {suresiGecmis.map((h, i) => <HedefKart key={i} h={h} />)}
            </div>
          </div>
        )}

        {tamamlananlar.length > 0 && (
          <div style={styles.bolum}>
            <div style={styles.bolumBaslik}>
              Tamamlananlar
              <span style={{ ...styles.sayi, backgroundColor: '#166534', color: '#4ade80' }}>{tamamlananlar.length}</span>
            </div>
            <div style={styles.kartGrid}>
              {tamamlananlar.map((h, i) => <HedefKart key={i} h={h} />)}
            </div>
          </div>
        )}
      </div>

      {duzenleModalAcik && (
        <div style={styles.modalArka} onClick={() => setDuzenleModalAcik(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalBaslik}>Hedef Düzenle</div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Hedef Açıklaması</label>
              <textarea
                style={{ ...styles.input, resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
                value={duzenleAciklama}
                onChange={e => setDuzenleAciklama(e.target.value)}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Bitiş Tarihi</label>
              <input type="date" style={styles.input} value={duzenleBitis} onChange={e => setDuzenleBitis(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={hedefGuncelle} style={styles.kaydetButon}>Güncelle</button>
              <button onClick={() => setDuzenleModalAcik(false)} style={styles.iptalButon}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {modalAcik && (
        <div style={styles.modalArka} onClick={() => setModalAcik(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalBaslik}>Yeni Hedef Ekle</div>
            {hata && <div style={styles.hataKutu}>{hata}</div>}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Çalışan</label>
              <select style={styles.input} value={secilenCalisan} onChange={e => setSecilenCalisan(e.target.value)}>
                <option value="">Seçin...</option>
                {calisanlar.map(c => (
                  <option key={c.id} value={c.id}>{c.ad} {c.soyad} — {c.departman}</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Hedef Açıklaması</label>
              <textarea
                style={{ ...styles.input, resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
                placeholder="Hedefi açıklayın..."
                value={aciklama}
                onChange={e => setAciklama(e.target.value)}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Bitiş Tarihi</label>
              <input
                type="date"
                style={styles.input}
                value={bitisTarihi}
                onChange={e => setBitisTarihi(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={hedefEkle} style={styles.kaydetButon}>Kaydet</button>
              <button onClick={() => { setModalAcik(false); setHata(''); }} style={styles.iptalButon}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {silinecekId && (
        <div style={styles.silModalArka} onClick={() => setSilinecekId(null)}>
          <div style={styles.silModal} onClick={e => e.stopPropagation()}>
            <div style={styles.silIkonKapsayici}><IconAlertTriangle size={24} /></div>
            <h3 style={styles.silBaslik}>Hedefi Sil</h3>
            <p style={styles.silAciklama}>Bu hedefi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div style={styles.silButonlar}>
              <button type="button" className="sil-modal-iptal" onClick={() => setSilinecekId(null)} style={styles.silIptalButon}>İptal</button>
              <button type="button" className="sil-modal-sil" onClick={silOnayla} style={styles.silOnaylaButon}>Sil</button>
            </div>
          </div>
        </div>
      )}
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
  bolum: { marginBottom: '28px' },
  bolumBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' },
  kartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
  sayi: { fontSize: '12px', backgroundColor: '#2a2a2a', color: '#a0a0a0', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' },
  bos: { fontSize: '14px', color: '#a0a0a0' },
  modalArka: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#242424', borderRadius: '10px', padding: '28px', width: '460px', border: '1px solid #333' },
  modalBaslik: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '20px' },
  hataKutu: { backgroundColor: 'rgba(69,10,10,0.3)', border: '1px solid #991b1b', color: '#f87171', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '13px', color: '#b3b3b3', fontWeight: '500' },
  input: { padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', colorScheme: 'dark' },
  kaydetButon: { flex: 1, padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  iptalButon: { flex: 1, padding: '10px', backgroundColor: '#2a2a2a', color: '#a0a0a0', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },

  silModalArka: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  silModal: { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '36px', width: '100%', maxWidth: '480px', margin: '0 20px', textAlign: 'center', boxSizing: 'border-box' },
  silIkonKapsayici: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  silBaslik: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 8px' },
  silAciklama: { color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' },
  silButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  silIptalButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.15s, background-color 0.15s' },
  silOnaylaButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#f43f5e', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(244,63,94,0.25)', transition: 'all 0.15s' },
};

export default Hedefler;
