let dinleyiciler = [];
let toastlar = [];
let idSayaci = 0;

const yayinla = () => dinleyiciler.forEach(fn => fn(toastlar));

export function toastKapat(id) {
  toastlar = toastlar.filter(t => t.id !== id);
  yayinla();
}

export function toastGoster(mesaj, tip = 'basari', sure = 4000) {
  const id = ++idSayaci;
  toastlar = [...toastlar, { id, mesaj, tip }];
  yayinla();
  setTimeout(() => toastKapat(id), sure);
  return id;
}

export function toastAbone(fn) {
  dinleyiciler.push(fn);
  return () => { dinleyiciler = dinleyiciler.filter(d => d !== fn); };
}

export function toastListesiGetir() {
  return toastlar;
}
