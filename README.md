# InternAutomate 

LinkedIn, Youthall ve PythianGo'dan staj ilanlarını otomatik toplayan, filtreleyip başvuru durumunu takip etmeyi sağlayan yerel bir web uygulaması.



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
