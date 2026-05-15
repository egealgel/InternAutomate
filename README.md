# InternAutomate 🎯

LinkedIn, Youthall ve PythianGo'dan staj ilanlarını otomatik toplayan, filtreleyip başvuru durumunu takip etmeni sağlayan yerel bir web uygulaması.

## Özellikler

- **Otomatik ilan tarama** — LinkedIn, Youthall ve PythianGo'yu tek tıkla tara
- **Akıllı filtreleme** — Başlık, şirket, konum, kaynak, durum ve tarihe göre filtrele
- **Başvuru takibi** — Her ilan için New → Applied → Interview → Offer / Rejected durumu
- **Not ekleme** — Her ilana kişisel not bırak
- **CSV dışa aktarma** — Tüm ilanları Excel'e uyumlu CSV olarak indir
- **Tekrar tarama yok** — Aynı ilan iki kez eklenmez (URL bazlı)

## Kurulum

### Gereksinimler

- Python 3.11+
- Node.js 18+
- Google Chrome (LinkedIn scraping için)

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/egealgel/InternAutomate.git
cd InternAutomate

# Python bağımlılıklarını kur
pip install -r requirements.txt

# Node bağımlılıklarını kur (hem root hem frontend)
npm install
npm install --prefix frontend
```

## Kullanım

Tek komutla hem backend hem frontend başlatılır:

```bash
npm run dev
```

Tarayıcıda **http://localhost:5173** adresini aç.

> Flask API → `http://localhost:5001` üzerinde çalışır.

### İlan Tarama

1. **"İlan Tara"** sekmesine git
2. Anahtar kelime ve şehir gir (örn. `stajyer` / `İstanbul`)
3. Kaynakları seç: LinkedIn, Youthall, PythianGo
4. **"Taramayı Başlat"** butonuna tıkla

### Başvuru Takibi

İlan satırına tıkla → durum güncelle (New / Applied / Interview / Rejected / Offer) → not ekle.

## Desteklenen Kaynaklar

| Kaynak | Yöntem | Durum |
|---|---|---|
| LinkedIn | Public jobs API | ✅ Çalışıyor |
| Youthall | requests + BeautifulSoup | ✅ Çalışıyor |
| PythianGo | requests + BeautifulSoup | ✅ Çalışıyor |
| Kariyer.net | — | 🔒 Bot korumalı |
| Indeed | — | 🔒 Bot korumalı |

## Proje Yapısı

```
InternAutomate/
├── app.py                  # Flask uygulaması
├── config.py               # Ayarlar
├── requirements.txt
├── database/
│   ├── db.py               # SQLite CRUD işlemleri
│   └── models.py           # Tablo şeması
├── scrapers/
│   ├── linkedin.py         # LinkedIn scraper
│   ├── youthall.py         # Youthall scraper
│   └── pythiango.py        # PythianGo scraper
├── routes/
│   └── api.py              # REST API endpoint'leri
└── frontend/               # React + Vite + Tailwind
    └── src/
        ├── pages/          # Dashboard, ScrapeForm, JobDetail
        └── components/     # Badge vb.
```

## Teknolojiler

**Backend:** Python, Flask, SQLite, Selenium, BeautifulSoup  
**Frontend:** React, TypeScript, Vite, Tailwind CSS
