import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconMail, IconShield, IconLock, IconCalendar, IconClock, IconBarChart } from '../components/icons';
import { toastGoster } from '../services/toast';

const skorRenk = (skor) => skor == null ? '#94a3b8' : skor >= 80 ? '#34d399' : skor >= 60 ? '#fbbf24' : '#fb7185';

const tarihFormatla = (isoStr) => {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const tarihSaatFormatla = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
};

const ROL_RENKLERI = {
  Admin: { renk: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
  Evaluator: { renk: '#22d3ee', bg: 'rgba(8,145,178,0.1)', border: 'rgba(8,145,178,0.2)' },
  Employee: { renk: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.2)' },
};

function Profil() {
  const ad = localStorage.getItem('ad');
  const soyad = localStorage.getItem('soyad');
  const rol = localStorage.getItem('rol');
  const email = localStorage.getItem('email');
  const kayitTarihi = localStorage.getItem('kayitTarihi');
  const sonGirisTarihi = localStorage.getItem('sonGirisTarihi');
  const id = localStorage.getItem('id');
  const rolRenk = ROL_RENKLERI[rol] || ROL_RENKLERI.Employee;

  const [degerlendirmeler, setDegerlendirmeler] = useState([]);

  useEffect(() => {
    if (rol !== 'Employee' || !id) return;
    api.get(`/Degerlendirmeler/calisan/${id}`).then(res => setDegerlendirmeler(res.data || [])).catch(() => {});
  }, [rol, id]);

  const ortalamaHesapla = (liste) => {
    const skorlar = liste.map(d => d.toplamSkor).filter(s => s != null).map(Number);
    return skorlar.length > 0
      ? parseFloat((skorlar.reduce((a, b) => a + b, 0) / skorlar.length).toFixed(1))
      : null;
  };

  const buYil = new Date().getFullYear().toString();
  const buYilDegerlendirmeler = degerlendirmeler.filter(d => d.donem?.startsWith(buYil));
  const buYilOrtalama = ortalamaHesapla(buYilDegerlendirmeler);
  const genelOrtalama = ortalamaHesapla(degerlendirmeler);

  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const sifreDegistir = async (e) => {
    e.preventDefault();

    if (yeniSifre !== yeniSifreTekrar) {
      toastGoster('Yeni şifreler eşleşmiyor.', 'hata');
      return;
    }
    if (yeniSifre.length < 6) {
      toastGoster('Yeni şifre en az 6 karakter olmalıdır.', 'hata');
      return;
    }

    setYukleniyor(true);
    try {
      await api.put('/Kullanicilar/sifre-degistir', { mevcutSifre, yeniSifre });
      toastGoster('Şifreniz başarıyla değiştirildi.', 'basari');
      setMevcutSifre('');
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'Şifre değiştirilirken hata oluştu.', 'hata');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={styles.sayfa}>
      <style>{`
        .profil-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 1px #6366f1; }
        .profil-kaydet:hover:not(:disabled) { background-color: #6366f1 !important; }
      `}</style>
      <Sidebar />
      <div style={styles.icerik}>
        <div style={styles.topBar}>
          <h2 style={styles.baslik}>Profilim</h2>
          <p style={styles.altBaslik}>Hesap bilgilerini görüntüle ve şifreni değiştir</p>
        </div>

        <div style={styles.satirGrup}>
          <div style={styles.kart}>
            <div style={styles.profilHeader}>
              <div style={styles.buyukAvatar}>{ad?.[0]}{soyad?.[0]}</div>
              <div style={styles.buyukIsim}>{ad} {soyad}</div>
              <span style={{
                ...styles.rolRozet,
                color: rolRenk.renk,
                backgroundColor: rolRenk.bg,
                borderColor: rolRenk.border,
              }}>
                {rol}
              </span>
            </div>

            <div style={styles.bilgiListesi}>
              {email && (
                <div style={styles.bilgiSatir}>
                  <span style={styles.bilgiIkon}><IconMail size={15} /></span>
                  <span style={styles.bilgiDeger}>{email}</span>
                </div>
              )}
              {tarihFormatla(kayitTarihi) && (
                <div style={styles.bilgiSatir}>
                  <span style={styles.bilgiIkon}><IconCalendar size={15} /></span>
                  <span style={styles.bilgiDeger}>Kayıt: {tarihFormatla(kayitTarihi)}</span>
                </div>
              )}
              <div style={{ ...styles.bilgiSatir, borderBottom: 'none' }}>
                <span style={styles.bilgiIkon}><IconClock size={15} /></span>
                <span style={styles.bilgiDeger}>
                  {tarihSaatFormatla(sonGirisTarihi) ? `Son giriş: ${tarihSaatFormatla(sonGirisTarihi)}` : 'İlk girişiniz'}
                </span>
              </div>
            </div>
          </div>

          {rol === 'Employee' && (
            <div style={{ ...styles.kart, maxWidth: '520px' }}>
              <div style={styles.kartBaslikIkonlu}>
                <span style={styles.kartBaslikIkon}><IconBarChart size={16} /></span>
                Performans Özetim
              </div>
              <div style={styles.istatistikGrid}>
                <div style={styles.istatistikKutu}>
                  <div style={styles.istatistikDeger}>{degerlendirmeler.length}</div>
                  <div style={styles.istatistikEtiket}>Toplam Değerlendirme</div>
                </div>
                <div style={styles.istatistikKutu}>
                  <div style={{ ...styles.istatistikDeger, color: skorRenk(buYilOrtalama) }}>{buYilOrtalama ?? '-'}</div>
                  <div style={styles.istatistikEtiket}>{buYil} Ortalaması</div>
                </div>
                <div style={styles.istatistikKutu}>
                  <div style={{ ...styles.istatistikDeger, color: skorRenk(genelOrtalama) }}>{genelOrtalama ?? '-'}</div>
                  <div style={styles.istatistikEtiket}>Tüm Zamanlar Ortalaması</div>
                </div>
              </div>
            </div>
          )}

          <div style={styles.kart}>
            <div style={styles.kartBaslikIkonlu}>
              <span style={styles.kartBaslikIkon}><IconShield size={16} /></span>
              Şifre Değiştir
            </div>

            <form onSubmit={sifreDegistir}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mevcut Şifre</label>
                <div style={{ position: 'relative' }}>
                  <div style={styles.inputIkon}><IconLock size={15} /></div>
                  <input type="password" className="profil-input" style={styles.input} value={mevcutSifre}
                    onChange={e => setMevcutSifre(e.target.value)} required />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Yeni Şifre</label>
                <div style={{ position: 'relative' }}>
                  <div style={styles.inputIkon}><IconLock size={15} /></div>
                  <input type="password" className="profil-input" style={styles.input} value={yeniSifre}
                    onChange={e => setYeniSifre(e.target.value)} required />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Yeni Şifre (Tekrar)</label>
                <div style={{ position: 'relative' }}>
                  <div style={styles.inputIkon}><IconLock size={15} /></div>
                  <input type="password" className="profil-input" style={styles.input} value={yeniSifreTekrar}
                    onChange={e => setYeniSifreTekrar(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="profil-kaydet" style={styles.kaydetButon} disabled={yukleniyor}>
                {yukleniyor ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sayfa: { display: 'flex', backgroundColor: '#1c1c1c', minHeight: '100vh', color: '#fff' },
  icerik: { marginLeft: '220px', padding: '32px 40px', flex: 1 },
  topBar: { marginBottom: '28px', borderBottom: '1px solid #2a2a2a', paddingBottom: '20px' },
  baslik: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' },
  altBaslik: { fontSize: '14px', color: '#a0a0a0', margin: 0 },
  satirGrup: { display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' },
  kart: {
    backgroundColor: '#18181b',
    borderRadius: '10px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    flex: '1 1 380px',
    maxWidth: '440px',
    boxSizing: 'border-box',
  },
  kartBaslikIkonlu: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '18px' },
  kartBaslikIkon: { display: 'flex', alignItems: 'center', color: '#818cf8' },

  istatistikGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  istatistikKutu: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '16px 8px', textAlign: 'center' },
  istatistikDeger: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  istatistikEtiket: { fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' },

  profilHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '20px', marginBottom: '4px' },
  buyukAvatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', fontWeight: '700', marginBottom: '14px',
  },
  buyukIsim: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '10px' },
  rolRozet: {
    display: 'inline-block', fontSize: '11px', fontWeight: '600',
    padding: '4px 12px', borderRadius: '9999px', border: '1px solid',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },

  bilgiListesi: { borderTop: '1px solid rgba(255,255,255,0.05)' },
  bilgiSatir: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 2px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  bilgiIkon: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 },
  bilgiDeger: { fontSize: '13px', color: '#94a3b8' },

  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '13px', color: '#b3b3b3', fontWeight: '500' },
  inputIkon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingLeft: '14px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    color: '#64748b',
  },
  input: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  kaydetButon: { width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.15s' },
};

export default Profil;
