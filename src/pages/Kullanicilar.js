import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { IconEdit, IconPower, IconTrash, IconPlus, IconAlertTriangle } from '../components/icons';
import { DEPARTMANLAR } from '../constants/departmanlar';
import { Spinner, HataKutusu } from '../components/DurumGostergesi';
import { toastGoster } from '../services/toast';

function IslemBtn({ onClick, icon: Icon, variant = 'edit', title }) {
  const [hov, setHov] = React.useState(false);
  const renkler = {
    edit:   { hov: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    toggle: { hov: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
    danger: { hov: '#fb7185', bg: 'rgba(244,63,94,0.1)' },
  }[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
        transition: 'background-color 0.15s, color 0.15s',
        backgroundColor: hov ? renkler.bg : 'transparent',
        color: hov ? renkler.hov : '#9ca3af',
      }}
    >
      <Icon size={15} />
    </button>
  );
}

const cevrimiciMi = (sonAktiflikZamani) => {
  if (!sonAktiflikZamani) return false;
  const farkMs = new Date() - new Date(sonAktiflikZamani);
  return farkMs < 2 * 60 * 1000;
};

function AktiflikNoktasi({ sonAktiflikZamani, boyut = 10 }) {
  const aktif = cevrimiciMi(sonAktiflikZamani);
  return (
    <span
      title={aktif ? 'Şu an aktif' : 'Aktif değil'}
      style={{
        position: 'absolute', bottom: '-1px', right: '-1px',
        width: `${boyut}px`, height: `${boyut}px`, borderRadius: '50%',
        backgroundColor: aktif ? '#34d399' : '#4b5563',
        border: '2px solid #242424', boxSizing: 'content-box',
      }}
    />
  );
}

function SelectWrap({ children }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <svg
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

function Kullanicilar() {
  const kendiId = parseInt(localStorage.getItem('id'));
  const [kullanicilar, setKullanicilar] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniKullanici, setYeniKullanici] = useState({
    ad: '', soyad: '', email: '', sifre: '', rol: 'Employee', departman: '', evaluatorId: null
  });
  const evaluatorlar = kullanicilar.filter(k => k.rol === 'Evaluator' && k.aktifMi);
  const [aramaMetni, setAramaMetni] = useState('');
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState(null);
  const [silinecekId, setSilinecekId] = useState(null);
  const [siralamaSutun, setSiralamaSutun] = useState(null);
  const [siralamaYon, setSiralamaYon] = useState('asc');
  const [gorunum, setGorunum] = useState('liste');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [getirmeHatasi, setGetirmeHatasi] = useState(null);

  useEffect(() => {
    kullanicilariGetir(true);
    const zamanlayici = setInterval(() => kullanicilariGetir(false), 30000);
    return () => clearInterval(zamanlayici);
  }, []);

  const kullanicilariGetir = (ilkYukleme) => {
    if (ilkYukleme) { setYukleniyor(true); setGetirmeHatasi(null); }
    api.get('/Kullanicilar')
      .then(res => { setKullanicilar(res.data); if (ilkYukleme) setYukleniyor(false); })
      .catch(() => { if (ilkYukleme) { setGetirmeHatasi('Kullanıcılar yüklenemedi.'); setYukleniyor(false); } });
  };

  const kullaniciEkle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/Kullanicilar', yeniKullanici);
      toastGoster('Kullanıcı başarıyla eklendi.', 'basari');
      setModalAcik(false);
      setYeniKullanici({ ad: '', soyad: '', email: '', sifre: '', rol: 'Employee', departman: '', evaluatorId: null });
      kullanicilariGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'Kullanıcı eklenirken hata oluştu.', 'hata');
    }
  };

  const aktifPasifYap = async (id, aktifMi) => {
    try {
      await api.patch(`/Kullanicilar/${id}/aktif`, !aktifMi, {
        headers: { 'Content-Type': 'application/json' }
      });
      kullanicilariGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'İşlem sırasında hata oluştu.', 'hata');
    }
  };

  const kullaniciGuncelle = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/Kullanicilar/${duzenlenecek.id}`, duzenlenecek);
      toastGoster('Kullanıcı başarıyla güncellendi.', 'basari');
      setDuzenleModalAcik(false);
      setDuzenlenecek(null);
      kullanicilariGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'Güncelleme sırasında hata oluştu.', 'hata');
    }
  };

  const kullaniciSilOnayla = async () => {
    const id = silinecekId;
    setSilinecekId(null);
    try {
      await api.delete(`/Kullanicilar/${id}`);
      kullanicilariGetir();
    } catch (err) {
      toastGoster(err.response?.data?.mesaj || 'Kullanıcı silinirken hata oluştu.', 'hata');
    }
  };

  const sutunaTikla = (sutun) => {
    if (siralamaSutun === sutun) {
      setSiralamaYon(y => y === 'asc' ? 'desc' : 'asc');
    } else {
      setSiralamaSutun(sutun);
      setSiralamaYon('asc');
    }
  };

  const rolSirasi = { Admin: 0, Evaluator: 1, Employee: 2 };

  const siralamaDegeri = (k, sutun) => {
    switch (sutun) {
      case 'ad': return `${k.ad} ${k.soyad}`;
      case 'email': return k.email || '';
      case 'departman': return k.departman || (k.rol === 'Admin' ? 'Yönetim' : '');
      case 'durum': return k.aktifMi ? 'Aktif' : 'Pasif';
      case 'sonGiris': return k.sonGirisTarihi || '';
      default: return '';
    }
  };

  const sonGirisGoster = (tarih) => {
    if (!tarih) return 'Hiç giriş yapmadı';
    const simdi = new Date();
    const giris = new Date(tarih);
    const farkGun = Math.floor((simdi - giris) / (1000 * 60 * 60 * 24));
    if (farkGun <= 0) return 'Bugün';
    if (farkGun === 1) return 'Dün';
    return `${farkGun} gün önce`;
  };

  const siraliBaslik = (sutun, etiket) => (
    <th
      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => sutunaTikla(sutun)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        {etiket}
        <span style={{ fontSize: '9px', color: siralamaSutun === sutun ? '#818cf8' : '#4b5563' }}>
          {siralamaSutun === sutun && siralamaYon === 'desc' ? '▼' : '▲'}
        </span>
      </span>
    </th>
  );

  const aramaEslesiyorMu = (c) => !!aramaMetni && `${c.ad} ${c.soyad}`.toLowerCase().includes(aramaMetni.toLowerCase());

  return (
    <div style={styles.sayfa}>
      <style>{`
        .kul-input:focus {
          outline: none;
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
        }
        .modal-iptal:hover {
          color: #fff !important;
          background-color: rgba(55, 65, 81, 0.5) !important;
        }
        .sil-modal-iptal:hover {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .sil-modal-sil:hover {
          background-color: #e11d48 !important;
        }
        .siralama-sifirla:hover {
          color: #f3f4f6 !important;
          border-color: #6366f1 !important;
          background-color: rgba(99, 102, 241, 0.08) !important;
        }
        select.kul-input {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 32px;
          width: 100%;
          box-sizing: border-box;
          display: block;
        }
        .kul-satir:hover {
          background-color: rgba(255,255,255,0.05);
        }
        @media (max-width: 768px) {
          .icerik-responsive { margin-left: 0 !important; margin-top: 56px !important; padding: 20px 16px !important; min-width: 0 !important; }
          .kul-topbar-responsive { flex-wrap: wrap; gap: 12px; }
          .kul-arac-cubugu-responsive { flex-wrap: wrap; }
          .kul-form-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Sidebar />
      <div className="icerik-responsive" style={styles.icerik}>
        <div className="kul-topbar-responsive" style={styles.topBar}>
          <div>
            <h2 style={styles.baslik}>Kullanıcılar</h2>
            <p style={styles.altBaslik}>Sistemdeki tüm kullanıcıları yönetin</p>
          </div>
          <div style={styles.gorunumGrup}>
            <button
              type="button"
              onClick={() => setGorunum('liste')}
              style={{ ...styles.gorunumButon, ...(gorunum === 'liste' ? styles.gorunumButonAktif : {}) }}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setGorunum('ekipler')}
              style={{ ...styles.gorunumButon, ...(gorunum === 'ekipler' ? styles.gorunumButonAktif : {}) }}
            >
              Ekipler
            </button>
          </div>
        </div>

        {yukleniyor ? (
          <Spinner />
        ) : getirmeHatasi ? (
          <HataKutusu mesaj={getirmeHatasi} onTekrarDene={() => kullanicilariGetir(true)} />
        ) : (
        <>
        <div className="kul-arac-cubugu-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '288px', maxWidth: '100%' }}>
              <svg
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="kul-input"
                style={{ ...styles.aramaInput }}
                placeholder="İsim ara..."
                value={aramaMetni}
                onChange={e => setAramaMetni(e.target.value)}
              />
            </div>
            {siralamaSutun && (
              <button
                type="button"
                className="siralama-sifirla"
                onClick={() => { setSiralamaSutun(null); setSiralamaYon('asc'); }}
                style={styles.siralamaSifirlaButon}
              >
                Sıralamayı Sıfırla
              </button>
            )}
          </div>
          <button onClick={() => setModalAcik(true)} style={styles.ekleButon}>
            <IconPlus /> Yeni Kullanıcı
          </button>
        </div>

        {gorunum === 'liste' && (
        <div style={styles.tablo}>
          <table style={styles.tabloEl}>
            <thead>
              <tr>
                {siraliBaslik('ad', 'Ad Soyad')}
                {siraliBaslik('email', 'Email')}
                {siraliBaslik('rol', 'Rol')}
                {siraliBaslik('departman', 'Departman')}
                {siraliBaslik('durum', 'Durum')}
                {siraliBaslik('sonGiris', 'Son Giriş')}
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.filter(k => {
                const q = aramaMetni.toLowerCase();
                return !q || `${k.ad} ${k.soyad}`.toLowerCase().includes(q);
              }).sort((a, b) => {
                if (!siralamaSutun) return 0;
                const cmp = siralamaSutun === 'rol'
                  ? (rolSirasi[a.rol] ?? 99) - (rolSirasi[b.rol] ?? 99)
                  : siralamaDegeri(a, siralamaSutun).localeCompare(siralamaDegeri(b, siralamaSutun), 'tr');
                return siralamaYon === 'asc' ? cmp : -cmp;
              }).map((k) => (
                <tr key={k.id} className="kul-satir" style={styles.satir}>
                  <td style={styles.td}>
                    <div style={styles.isimKismi}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={styles.avatar}>{k.ad?.[0]}{k.soyad?.[0]}</div>
                        <AktiflikNoktasi sonAktiflikZamani={k.sonAktiflikZamani} />
                      </div>
                      <span>{k.ad} {k.soyad}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{k.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.rolBadge,
                      backgroundColor: k.rol === 'Admin' ? '#4f46e5' : k.rol === 'Evaluator' ? '#0891b2' : '#475569'
                    }}>
                      {k.rol}
                    </span>
                  </td>
                  <td style={styles.td}>{k.departman || (k.rol === 'Admin' ? 'Yönetim' : '-')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.durumBadge,
                      backgroundColor: k.aktifMi ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                      color: k.aktifMi ? '#34d399' : '#fb7185'
                    }}>
                      {k.aktifMi ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: k.sonGirisTarihi ? '#9ca3af' : '#6b7280', fontStyle: k.sonGirisTarihi ? 'normal' : 'italic' }}>
                    {sonGirisGoster(k.sonGirisTarihi)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {k.id === kendiId ? (
                        <span style={{ fontSize: '12px', color: '#818cf8', fontStyle: 'italic' }}>Kendi hesabın</span>
                      ) : (
                        <>
                          <IslemBtn variant="edit" icon={IconEdit} title="Düzenle" onClick={() => { setDuzenlenecek({...k}); setDuzenleModalAcik(true); }} />
                          <IslemBtn variant="toggle" icon={IconPower} title={k.aktifMi ? 'Pasif Yap' : 'Aktif Yap'} onClick={() => aktifPasifYap(k.id, k.aktifMi)} />
                          <IslemBtn variant="danger" icon={IconTrash} title="Sil" onClick={() => setSilinecekId(k.id)} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {gorunum === 'ekipler' && (
        <div style={styles.ekiplerGrid}>
          {evaluatorlar.map(ev => {
            const ekip = kullanicilar.filter(k => k.rol === 'Employee' && k.evaluatorId === ev.id);
            return (
              <div key={ev.id} style={styles.ekipKart}>
                <div style={styles.ekipKartUst}>
                  <div style={styles.isimKismi}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ ...styles.avatar, backgroundColor: '#0891b2' }}>{ev.ad?.[0]}{ev.soyad?.[0]}</div>
                      <AktiflikNoktasi sonAktiflikZamani={ev.sonAktiflikZamani} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6' }}>{ev.ad} {ev.soyad}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{ev.departman}</div>
                    </div>
                  </div>
                  <span style={styles.ekipSayiBadge}>{ekip.length} çalışan</span>
                </div>
                <div style={styles.ekipListesi}>
                  {ekip.length === 0 ? (
                    <div style={styles.ekipBosMetin}>Henüz atanmış çalışan yok.</div>
                  ) : ekip.map(c => {
                    const eslesti = aramaEslesiyorMu(c);
                    return (
                    <div key={c.id} style={{
                      ...styles.ekipSatir,
                      opacity: aramaMetni && !eslesti ? 0.35 : 1,
                      backgroundColor: eslesti ? 'rgba(99,102,241,0.1)' : 'transparent',
                      borderRadius: '6px', margin: '0 -8px', padding: '4px 8px',
                      transition: 'opacity 0.15s, background-color 0.15s',
                    }}>
                      <div style={styles.isimKismi}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ ...styles.avatar, width: '26px', height: '26px', fontSize: '10px' }}>{c.ad?.[0]}{c.soyad?.[0]}</div>
                          <AktiflikNoktasi sonAktiflikZamani={c.sonAktiflikZamani} boyut={8} />
                        </div>
                        <span style={{ fontSize: '13px', color: eslesti ? '#818cf8' : (c.aktifMi ? '#d1d5db' : '#4b5563'), fontWeight: eslesti ? '700' : '400' }}>{c.ad} {c.soyad}</span>
                      </div>
                      <span style={{
                        ...styles.durumBadge,
                        fontSize: '11px', padding: '2px 8px',
                        backgroundColor: c.aktifMi ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                        color: c.aktifMi ? '#34d399' : '#fb7185'
                      }}>
                        {c.aktifMi ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(() => {
            const atanmamis = kullanicilar.filter(k => k.rol === 'Employee' && !k.evaluatorId);
            if (atanmamis.length === 0) return null;
            return (
              <div style={{ ...styles.ekipKart, border: '1px solid rgba(244,63,94,0.3)' }}>
                <div style={styles.ekipKartUst}>
                  <div style={styles.isimKismi}>
                    <div style={{ ...styles.avatar, backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185' }}>
                      <IconAlertTriangle size={16} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fb7185' }}>Atanmamış Çalışanlar</div>
                  </div>
                  <span style={{ ...styles.ekipSayiBadge, backgroundColor: 'rgba(244,63,94,0.1)', color: '#fb7185' }}>{atanmamis.length} çalışan</span>
                </div>
                <div style={styles.ekipListesi}>
                  {atanmamis.map(c => {
                    const eslesti = aramaEslesiyorMu(c);
                    return (
                    <div key={c.id} style={{
                      ...styles.ekipSatir,
                      opacity: aramaMetni && !eslesti ? 0.35 : 1,
                      backgroundColor: eslesti ? 'rgba(99,102,241,0.1)' : 'transparent',
                      borderRadius: '6px', margin: '0 -8px', padding: '4px 8px',
                      transition: 'opacity 0.15s, background-color 0.15s',
                    }}>
                      <div style={styles.isimKismi}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ ...styles.avatar, width: '26px', height: '26px', fontSize: '10px' }}>{c.ad?.[0]}{c.soyad?.[0]}</div>
                          <AktiflikNoktasi sonAktiflikZamani={c.sonAktiflikZamani} boyut={8} />
                        </div>
                        <span style={{ fontSize: '13px', color: eslesti ? '#818cf8' : '#d1d5db', fontWeight: eslesti ? '700' : '400' }}>{c.ad} {c.soyad}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{c.departman}</span>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
        )}
        </>
        )}

        {duzenleModalAcik && duzenlenecek && (
          <div style={styles.modalArkaplan}>
            <div style={styles.modal}>
              <h3 style={styles.modalBaslik}>Kullanıcı Düzenle</h3>
              <form onSubmit={kullaniciGuncelle}>
                <div className="kul-form-grid-responsive" style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Ad</label>
                    <input className="kul-input" style={styles.input} value={duzenlenecek.ad || ''}
                      onChange={e => setDuzenlenecek({...duzenlenecek, ad: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Soyad</label>
                    <input className="kul-input" style={styles.input} value={duzenlenecek.soyad || ''}
                      onChange={e => setDuzenlenecek({...duzenlenecek, soyad: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email</label>
                    <input type="email" className="kul-input" style={styles.input} value={duzenlenecek.email || ''}
                      onChange={e => setDuzenlenecek({...duzenlenecek, email: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rol</label>
                    <SelectWrap>
                      <select className="kul-input" style={styles.input} value={duzenlenecek.rol || 'Employee'}
                        onChange={e => setDuzenlenecek({...duzenlenecek, rol: e.target.value, evaluatorId: null})}>
                        <option value="Employee">Employee</option>
                        <option value="Evaluator">Evaluator</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </SelectWrap>
                  </div>
                  <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Departman</label>
                    <SelectWrap>
                      <select className="kul-input" style={styles.input} value={duzenlenecek.departman || ''}
                        onChange={e => {
                          const dep = e.target.value;
                          if (duzenlenecek.rol !== 'Employee') {
                            setDuzenlenecek({...duzenlenecek, departman: dep});
                            return;
                          }
                          const otomatikEv = evaluatorlar.find(ev => ev.departman === dep);
                          setDuzenlenecek({...duzenlenecek, departman: dep, evaluatorId: otomatikEv ? otomatikEv.id : null});
                        }}>
                        <option value="">Seçiniz</option>
                        {DEPARTMANLAR.map(dep => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </SelectWrap>
                  </div>
                  {duzenlenecek.rol === 'Employee' && (
                    <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Değerlendirici</label>
                      <SelectWrap>
                        <select className="kul-input" style={styles.input} value={duzenlenecek.evaluatorId || ''}
                          onChange={e => {
                            const evId = e.target.value ? parseInt(e.target.value) : null;
                            const secilen = evaluatorlar.find(ev => ev.id === evId);
                            setDuzenlenecek({...duzenlenecek, evaluatorId: evId, departman: secilen ? secilen.departman : duzenlenecek.departman});
                          }}>
                          <option value="">Seçiniz</option>
                          {evaluatorlar.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.ad} {ev.soyad} — {ev.departman}</option>
                          ))}
                        </select>
                      </SelectWrap>
                    </div>
                  )}
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" className="modal-iptal" onClick={() => { setDuzenleModalAcik(false); setDuzenlenecek(null); }} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Güncelle</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalAcik && (
          <div style={styles.modalArkaplan}>
            <div style={styles.modal}>
              <h3 style={styles.modalBaslik}>Yeni Kullanıcı Ekle</h3>
              <form onSubmit={kullaniciEkle}>
                <div className="kul-form-grid-responsive" style={styles.formGrid}>
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
                    <input type="email" className="kul-input" style={styles.input} value={yeniKullanici.email}
                      onChange={e => setYeniKullanici({...yeniKullanici, email: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Şifre</label>
                    <input type="password" className="kul-input" style={styles.input} value={yeniKullanici.sifre}
                      onChange={e => setYeniKullanici({...yeniKullanici, sifre: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rol</label>
                    <SelectWrap>
                      <select className="kul-input" style={styles.input} value={yeniKullanici.rol}
                        onChange={e => setYeniKullanici({...yeniKullanici, rol: e.target.value, evaluatorId: null})}>
                        <option value="Employee">Employee</option>
                        <option value="Evaluator">Evaluator</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </SelectWrap>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Departman</label>
                    <SelectWrap>
                      <select className="kul-input" style={styles.input} value={yeniKullanici.departman}
                        onChange={e => {
                          const dep = e.target.value;
                          if (yeniKullanici.rol !== 'Employee') {
                            setYeniKullanici({...yeniKullanici, departman: dep});
                            return;
                          }
                          const otomatikEv = evaluatorlar.find(ev => ev.departman === dep);
                          setYeniKullanici({...yeniKullanici, departman: dep, evaluatorId: otomatikEv ? otomatikEv.id : null});
                        }} required>
                        <option value="">Seçiniz</option>
                        {DEPARTMANLAR.map(dep => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </SelectWrap>
                  </div>
                  {yeniKullanici.rol === 'Employee' && (
                    <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Değerlendirici</label>
                      <SelectWrap>
                        <select className="kul-input" style={styles.input} value={yeniKullanici.evaluatorId || ''}
                          onChange={e => {
                            const evId = e.target.value ? parseInt(e.target.value) : null;
                            const secilen = evaluatorlar.find(ev => ev.id === evId);
                            setYeniKullanici({...yeniKullanici, evaluatorId: evId, departman: secilen ? secilen.departman : yeniKullanici.departman});
                          }}>
                          <option value="">Seçiniz</option>
                          {evaluatorlar.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.ad} {ev.soyad} — {ev.departman}</option>
                          ))}
                        </select>
                      </SelectWrap>
                    </div>
                  )}
                </div>
                <div style={styles.modalButonlar}>
                  <button type="button" className="modal-iptal" onClick={() => setModalAcik(false)} style={styles.iptalButon}>İptal</button>
                  <button type="submit" style={styles.kaydetButon}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {silinecekId && (
          <div style={styles.modalArkaplan} onClick={() => setSilinecekId(null)}>
            <div style={styles.silModal} onClick={e => e.stopPropagation()}>
              <div style={styles.silIkonKapsayici}><IconAlertTriangle size={24} /></div>
              <h3 style={{ ...styles.modalBaslik, margin: '0 0 8px' }}>Kullanıcıyı Sil</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div style={styles.modalButonlar}>
                <button type="button" className="sil-modal-iptal" onClick={() => setSilinecekId(null)} style={styles.silIptalButon}>İptal</button>
                <button type="button" className="sil-modal-sil" onClick={kullaniciSilOnayla} style={styles.silOnaylaButon}>Sil</button>
              </div>
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
  ekleButon: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  siralamaSifirlaButon: { padding: '9px 14px', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #3a3a3a', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  gorunumGrup: { display: 'flex', gap: '4px', backgroundColor: '#242424', border: '1px solid #333', borderRadius: '8px', padding: '4px' },
  gorunumButon: { padding: '7px 16px', backgroundColor: 'transparent', color: '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' },
  gorunumButonAktif: { backgroundColor: '#4f46e5', color: '#fff' },
  ekiplerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  ekipKart: { backgroundColor: '#242424', borderRadius: '10px', padding: '20px', border: '1px solid #2a2a2a' },
  ekipKartUst: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #2a2a2a' },
  ekipSayiBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '20px', whiteSpace: 'nowrap' },
  ekipListesi: { display: 'flex', flexDirection: 'column', gap: '10px' },
  ekipSatir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ekipBosMetin: { fontSize: '13px', color: '#4b5563', fontStyle: 'italic' },
  tablo: { backgroundColor: '#242424', borderRadius: '8px', padding: '24px', overflowX: 'auto' },
  tabloEl: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', fontWeight: '600' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#e0e0e0', borderBottom: '1px solid #2a2a2a' },
  satir: { transition: 'background-color 0.15s' },
  isimKismi: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  rolBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: '#fff' },
  durumBadge: { padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' },
  modalArkaplan: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#242424', borderRadius: '12px', padding: '32px', width: '500px', maxWidth: '92vw', boxSizing: 'border-box', border: '1px solid #333' },
  modalBaslik: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#d1d5db', fontWeight: '500', display: 'block', marginBottom: '6px' },
  aramaInput: { width: '100%', padding: '9px 12px 9px 38px', backgroundColor: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: '6px', color: '#f3f4f6', fontSize: '13px', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  input: { padding: '10px 12px', backgroundColor: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: '6px', color: '#f3f4f6', fontSize: '14px', transition: 'border-color 0.15s' },
  modalButonlar: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  iptalButon: { padding: '10px 20px', backgroundColor: 'transparent', color: '#d1d5db', border: '1px solid #374151', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', transition: 'color 0.15s, background-color 0.15s' },
  kaydetButon: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  silModal: { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '36px', width: '100%', maxWidth: '480px', margin: '0 20px', textAlign: 'center', boxSizing: 'border-box' },
  silIkonKapsayici: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  silIptalButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'color 0.15s, background-color 0.15s' },
  silOnaylaButon: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#f43f5e', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(244,63,94,0.25)', transition: 'all 0.15s' },
};

export default Kullanicilar;
