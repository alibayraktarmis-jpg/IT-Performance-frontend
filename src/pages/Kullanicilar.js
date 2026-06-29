import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Kullanicilar() {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniKullanici, setYeniKullanici] = useState({
    ad: '', soyad: '', email: '', sifre: '', rol: 'Employee', departman: ''
  });
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  useEffect(() => {
    kullanicilariGetir();
  }, []);

  const kullanicilariGetir = () => {
    api.get('/Kullanicilar')
      .then(res => setKullanicilar(res.data))
      .catch(() => {});
  };

  const kullaniciEkle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/Kullanicilar', yeniKullanici);
      setBasari('Kullanıcı başarıyla eklendi.');
      setHata('');
      setModalAcik(false);
      setYeniKullanici({ ad: '', soyad: '', email: '', sifre: '', rol: 'Employee', departman: '' });
      kullanicilariGetir();
    } catch {
      setHata('Kullanıcı eklenirken hata oluştu.');
      setBasari('');
    }
  };

  const aktifPasifYap = async (id, aktifMi) => {
    try {
      await api.patch(`/Kullanicilar/${id}/aktif`, !aktifMi, {
        headers: { 'Content-Type': 'application/json' }
      });
      kullanicilariGetir();
    } catch {}
  };

  const kullaniciSil = async (id) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/Kullanicilar/${id}`);
      kullanicilariGetir();
    } catch {}
  };

  return (
    <div style={styles.sayfa}>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Kullanıcılar</h2>
            <p style={styles.altBaslik}>Sistemdeki tüm kullanıcıları yönetin</p>
          </div>
          <button onClick={() => setModalAcik(true)} style={styles.ekleButon}>
            + Yeni Kullanıcı
          </button>
        </div>

        {basari && <div style={styles.basariKutusu}>{basari}</div>}
        {hata && <div style={styles.hataKutusu}>{hata}</div>}

        <div style={styles.tablo}>
          <table style={styles.tabloEl}>
            <thead>
              <tr>
                <th style={styles.th}>Ad Soyad</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Departman</th>
                <th style={styles.th}>Durum</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map((k) => (
                <tr key={k.id} style={styles.satir}>
                  <td style={styles.td}>
                    <div style={styles.isimKismi}>
                      <div style={styles.avatar}>{k.ad?.[0]}{k.soyad?.[0]}</div>
                      <span>{k.ad} {k.soyad}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{k.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.rolBadge,
                      backgroundColor: k.rol === 'Admin' ? '#4f46e5' : k.rol === 'Evaluator' ? '#0891b2' : '#374151'
                    }}>
                      {k.rol}
                    </span>
                  </td>
                  <td style={styles.td}>{k.departman}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.durumBadge,
                      backgroundColor: k.aktifMi ? '#14532d' : '#450a0a',
                      color: k.aktifMi ? '#4ade80' : '#f87171'
                    }}>
                      {k.aktifMi ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => aktifPasifYap(k.id, k.aktifMi)}
                      style={styles.islemButon}
                    >
                      {k.aktifMi ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={() => kullaniciSil(k.id)}
                      style={styles.silButon}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalAcik && (
          <div style={styles.modalArkaplan}>
            <div style={styles.modal}>
              <h3 style={styles.modalBaslik}>Yeni Kullanıcı Ekle</h3>
              <form onSubmit={kullaniciEkle}>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Ad</label>
                    <input style={styles.input} value={yeniKullanici.ad}
                      onChange={e => setYeniKullanici({...yeniKullanici, ad: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Soyad</label>
                    <input style={styles.input} value={yeniKullanici.soyad}
                      onChange={e => setYeniKullanici({...yeniKullanici, soyad: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email</label>
                    <input type="email" style={styles.input} value={yeniKullanici.email}
                      onChange={e => setYeniKullanici({...yeniKullanici, email: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Şifre</label>
                    <input type="password" style={styles.input} value={yeniKullanici.sifre}
                      onChange={e => setYeniKullanici({...yeniKullanici, sifre: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rol</label>
                    <select style={styles.input} value={yeniKullanici.rol}
                      onChange={e => setYeniKullanici({...yeniKullanici, rol: e.target.value})}>
                      <option value="Employee">Employee</option>
                      <option value="Evaluator">Evaluator</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Departman</label>
                    <input style={styles.input} value={yeniKullanici.departman}
                      onChange={e => setYeniKullanici({...yeniKullanici, departman: e.target.value})} required />
                  </div>
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" onClick={() => setModalAcik(false)} style={styles.iptalButon}>İptal</button>
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
  basariKutusu: { backgroundColor: 'rgba(20,83,45,0.3)', border: '1px solid #166534', color: '#4ade80', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  hataKutusu: { backgroundColor: 'rgba(69,10,10,0.3)', border: '1px solid #991b1b', color: '#f87171', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  tablo: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px' },
  tabloEl: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', fontWeight: '600' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  satir: {},
  isimKismi: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  rolBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: '#fff' },
  durumBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  islemButon: { padding: '6px 12px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' },
  silButon: { padding: '6px 12px', backgroundColor: 'transparent', color: '#f87171', border: '1px solid #991b1b', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' },
  modalArkaplan: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#242424', borderRadius: '12px', padding: '32px', width: '500px', border: '1px solid #333' },
  modalBaslik: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#b3b3b3', fontWeight: '500' },
  input: { padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px' },
  modalButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  iptalButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #333', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  kaydetButon: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default Kullanicilar;