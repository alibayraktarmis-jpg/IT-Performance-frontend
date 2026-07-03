import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const IconRotateCcw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

function Hedefler() {
  const rol = localStorage.getItem('rol');
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

  const hedefleriGetir = () => {
    api.get('/Hedefler').then(res => setHedefler(res.data)).catch(() => {});
  };

  useEffect(() => {
    hedefleriGetir();
    if (rol === 'Admin' || rol === 'Evaluator') {
      api.get('/Kullanicilar').then(res => {
        setCalisanlar(res.data.filter(k => k.rol === 'Employee' && k.aktifMi));
      }).catch(() => {});
    }
  }, [rol]);

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
    await api.put(endpoint).catch(() => {});
    hedefleriGetir();
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

  const sil = async (hedefId) => {
    await api.delete(`/Hedefler/${hedefId}`).catch(() => {});
    hedefleriGetir();
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
        backgroundColor: '#1c1c1c',
        borderRadius: '8px',
        padding: '16px 20px',
        border: gecti ? '1px solid rgba(244,63,94,0.2)' : '1px solid #2a2a2a',
        borderLeft: `4px solid ${solCizgi}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        gap: '12px',
      }}>
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
                  onClick={() => sil(h.id)}
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

        <div style={styles.bolum}>
          <div style={styles.bolumBaslik}>
            Aktif Hedefler
            <span style={styles.sayi}>{aktifHedefler.length}</span>
          </div>
          {aktifHedefler.length === 0
            ? <div style={styles.bos}>Aktif hedef bulunmuyor.</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '10px', alignItems: 'stretch' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '10px', alignItems: 'stretch' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '10px', alignItems: 'stretch' }}>
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
  bolum: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', border: '1px solid #2a2a2a', marginBottom: '20px' },
  bolumBaslik: { fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' },
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
};

export default Hedefler;
