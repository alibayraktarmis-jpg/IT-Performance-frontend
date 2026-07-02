import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Hedefler() {
  const rol = localStorage.getItem('rol');
  const id = localStorage.getItem('id');
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
  }, []);

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
    setDuzenleAciklama(h.Aciklama ?? h.aciklama ?? '');
    const bitis = new Date(h.BitisTarihi ?? h.bitisTarihi);
    setDuzenleBitis(bitis.toISOString().split('T')[0]);
    setDuzenleModalAcik(true);
  };

  const hedefGuncelle = async () => {
    if (!duzenleAciklama || !duzenleBitis) return;
    try {
      await api.put(`/Hedefler/${duzenlenecekHedef.Id ?? duzenlenecekHedef.id}`, {
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
  const aktifHedefler = hedefler.filter(h => !(h.TamamlandiMi ?? h.tamamlandiMi) && new Date(h.BitisTarihi ?? h.bitisTarihi) >= bugun);
  const suresiGecmis = hedefler.filter(h => !(h.TamamlandiMi ?? h.tamamlandiMi) && new Date(h.BitisTarihi ?? h.bitisTarihi) < bugun);
  const tamamlananlar = hedefler.filter(h => h.TamamlandiMi ?? h.tamamlandiMi);

  const HedefKart = ({ h }) => {
    const tamamlandi = h.TamamlandiMi ?? h.tamamlandiMi;
    const bitis = new Date(h.BitisTarihi ?? h.bitisTarihi);
    const gecti = !tamamlandi && bitis < bugun;
    const kalan = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));
    const [hovBtn, setHovBtn] = React.useState(null);

    const solCizgi = tamamlandi ? '#166534' : gecti ? '#ef4444' : '#4f46e5';

    return (
      <div style={{
        backgroundColor: '#1c1c1c',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #2a2a2a',
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
              {h.Ad ?? h.ad} {h.Soyad ?? h.soyad} · {h.Departman ?? h.departman}
            </div>
          )}
          <div style={{
            fontSize: '15px',
            fontWeight: '500',
            color: tamamlandi ? '#6b7280' : '#f3f4f6',
            textDecoration: tamamlandi ? 'line-through' : 'none',
            lineHeight: '1.6'
          }}>
            {h.Aciklama ?? h.aciklama}
          </div>
        </div>

        {/* Alt: tarih bilgisi + butonlar aynı hizada */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: gecti ? '#f87171' : tamamlandi ? '#4ade80' : '#6b7280' }}>
              {tamamlandi ? 'Tamamlandı' : gecti ? `${Math.abs(kalan)} gün geçti` : kalan === 0 ? 'Bugün bitiyor' : `${kalan} gün kaldı`}
            </span>
            <span style={{ fontSize: '11px', color: '#4b5563' }}>
              Bitiş: {bitis.toLocaleDateString('tr-TR')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => tamamla(h.Id ?? h.id, tamamlandi)}
              onMouseEnter={() => setHovBtn('tamam')}
              onMouseLeave={() => setHovBtn(null)}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: hovBtn === 'tamam' ? (tamamlandi ? 'rgba(255,255,255,0.07)' : 'rgba(74,222,128,0.12)') : 'transparent',
                color: tamamlandi ? '#6b7280' : '#4ade80',
                transition: 'background-color 0.15s',
              }}
            >
              {tamamlandi ? 'Geri Al' : 'Tamamlandı'}
            </button>
            {(rol === 'Admin' || rol === 'Evaluator') && (
              <>
                <button
                  onClick={() => duzenleAc(h)}
                  onMouseEnter={() => setHovBtn('duzenle')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px',
                    backgroundColor: hovBtn === 'duzenle' ? 'rgba(79,70,229,0.15)' : 'transparent',
                    color: hovBtn === 'duzenle' ? '#a5b4fc' : '#818cf8',
                    transition: 'background-color 0.15s',
                  }}
                >
                  Düzenle
                </button>
                <button
                  onClick={() => sil(h.Id ?? h.id)}
                  onMouseEnter={() => setHovBtn('sil')}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px',
                    backgroundColor: hovBtn === 'sil' ? 'rgba(239,68,68,0.12)' : 'transparent',
                    color: hovBtn === 'sil' ? '#ef4444' : 'rgba(248,113,113,0.7)',
                    transition: 'background-color 0.15s',
                  }}
                >
                  Sil
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
  input: { padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px' },
  kaydetButon: { flex: 1, padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  iptalButon: { flex: 1, padding: '10px', backgroundColor: '#2a2a2a', color: '#a0a0a0', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
};

export default Hedefler;
