const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 4000;


/* =======================
   MIDDLEWARE
======================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

/* =======================
   DATABASE
======================= */
const db = new sqlite3.Database("./data/invest.db", (err) => {
    if (err) {
        console.error("DB bağlantı hatası:", err);
    } else {
        console.log("SQLite veritabanı bağlandı");
    }
});

/* =======================
   TABLE
======================= */
db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* =======================
   GLOBAL ERROR TEMPLATE
======================= */
function renderError(res, title, message, statusCode = 500) {
    return res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <div class="page">
        <div class="card error-card">
          <h2>${title}</h2>
          <p class="muted">${message}</p>
          <a class="btn" href="javascript:history.back()">Geri Dön</a>
        </div>
      </div>
    </body>
    </html>
  `);
}

/* =======================
   PAGE ROUTES (5 SAYFA)
======================= */
app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "views/index.html"))
);

app.get("/add", (req, res) =>
    res.sendFile(path.join(__dirname, "views/add.html"))
);

app.get("/list", (req, res) =>
    res.sendFile(path.join(__dirname, "views/list.html"))
);

app.get("/stats", (req, res) =>
    res.sendFile(path.join(__dirname, "views/stats.html"))
);

app.get("/about", (req, res) =>
    res.sendFile(path.join(__dirname, "views/about.html"))
);

/* =======================
   POST /add  (INSERT)
======================= */
app.post("/add", (req, res) => {
    console.log("FORM DATA:", req.body);
    const stock = (req.body.stock || "").trim();
    const price = Number(req.body.price);
    const quantity = Number(req.body.quantity);

    // VALIDATION
    if (!stock) {
        return renderError(res, "Geçersiz Giriş", "Hisse adı boş olamaz.", 400);
    }

    if (Number.isNaN(price) || price <= 0) {
        return renderError(res, "Geçersiz Giriş", "Fiyat pozitif bir sayı olmalıdır.", 400);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return renderError(res, "Geçersiz Giriş", "Adet pozitif tam sayı olmalıdır.", 400);
    }

    const insertQuery = `
    INSERT INTO transactions (stock, price, quantity)
    VALUES (?, ?, ?)
  `;

    db.run(insertQuery, [stock, price, quantity], function (err) {
        if (err) {
            console.error("INSERT HATASI:", err);
            return renderError(res, "Veritabanı Hatası", "Kayıt sırasında bir hata oluştu.");
        }

        res.redirect("/list");
    });
});

/* =======================
   API - LIST DATA (ok/data)
======================= */
app.get("/api/transactions", (req, res) => {
    const query = `
    SELECT id, stock, price, quantity, created_at
    FROM transactions
    ORDER BY created_at DESC
  `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("SELECT HATASI:", err);
            return res.status(500).json({ ok: false, data: [] });
        }

        res.json({ ok: true, data: rows });
    });
});

/* =======================
   ✅ API - DELETE (SİLME)
======================= */
app.delete("/api/transactions/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ ok: false, message: "Geçersiz ID" });
    }

    const delQuery = `DELETE FROM transactions WHERE id = ?`;

    db.run(delQuery, [id], function (err) {
        if (err) {
            console.error("DELETE HATASI:", err);
            return res.status(500).json({ ok: false, message: "Silme hatası" });
        }

        // hiçbir kayıt silinmediyse
        if (this.changes === 0) {
            return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
        }

        res.json({ ok: true });
    });
});

/* =======================
   SERVER START
======================= */
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});

