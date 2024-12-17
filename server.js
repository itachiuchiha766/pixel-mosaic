const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp"); // Aggiungi questa libreria per ridimensionamento
const compression = require("compression"); // Add compression middleware

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, "uploads");
const databaseFile = path.join(__dirname, "image_database.json");

// Assicurati che la directory e il file esistano
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Inizializza database con oggetto vuoto se non esiste
if (!fs.existsSync(databaseFile)) {
  fs.writeFileSync(databaseFile, JSON.stringify({}), "utf8");
}

// Compression middleware
app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

const storage = multer.memoryStorage(); // Cambia a memory storage per sharp

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Solo file immagine consentiti"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function updateImageDatabase(cellId, imageUrl) {
  try {
    // Leggi con gestione errori
    let database = {};
    try {
      const rawData = fs.readFileSync(databaseFile, "utf8");
      database = rawData ? JSON.parse(rawData) : {};
    } catch (parseError) {
      console.error("Errore nel parsing del database:", parseError);
    }

    database[cellId] = imageUrl;

    fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2), "utf8");
  } catch (error) {
    console.error("Errore nell'aggiornamento del database:", error);
  }
}

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    const cellId = req.body.cellId;
    if (!cellId) {
      return res.status(400).json({ error: "Cell ID mancante" });
    }

    // Ridimensiona l'immagine
    const resizedImage = await sharp(req.file.buffer)
      .resize(100, 100, {
        fit: sharp.fit.cover,
        position: sharp.strategy.attention,
      })
      .webp({ quality: 80 }) // Use WebP for smaller file sizes
      .toFile(path.join(uploadDir, `${cellId}.webp`));

    const imageUrl = `/uploads/${cellId}.webp`;

    // Aggiorna database delle immagini
    updateImageDatabase(cellId, imageUrl);

    res.status(200).json({
      message: "File caricato con successo",
      imageUrl,
      cellId,
    });
  } catch (error) {
    console.error("Errore durante il caricamento:", error);
    res.status(500).json({ error: "Errore durante il caricamento del file" });
  }
});

// Endpoint per eliminare un'immagine
app.delete("/delete/:cellId", (req, res) => {
  const cellId = req.params.cellId;
  const filePath = path.join(uploadDir, `${cellId}.webp`);

  try {
    // Rimuovi file se esiste
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Aggiorna database delle immagini
    const rawData = fs.readFileSync(databaseFile, "utf8");
    const database = JSON.parse(rawData);

    delete database[cellId];

    fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2), "utf8");

    res.status(200).json({
      message: "File eliminato con successo",
      cellId,
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    res.status(500).json({ error: "Errore durante l'eliminazione del file" });
  }
});

// Endpoint per ottenere le immagini correnti
app.get("/current-images", (req, res) => {
  try {
    const rawData = fs.readFileSync(databaseFile, "utf8");
    const database = JSON.parse(rawData);
    res.status(200).json(database);
  } catch (error) {
    console.error("Errore nel recupero delle immagini:", error);
    res.status(500).json({ error: "Errore nel recupero delle immagini" });
  }
});

// Gestione degli errori globali
app.use((err, req, res, next) => {
  console.error("Errore:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});