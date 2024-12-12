// Backend Code
const express = require("express");
const multer = require("multer");
const Busboy = require("busboy"); // Importa Busboy
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Configura la directory per salvare le immagini
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Crea la directory uploads se non esiste
}

// Middleware per analizzare i dati del body (necessario per i form)
app.use(express.urlencoded({ extended: true })); // Analizza i dati form-urlencoded
app.use(express.json()); // Analizza i dati JSON

// Middleware per gestire i dati di form prima del caricamento del file
const preMulterMiddleware = (req, res, next) => {
  if (
    !req.headers["content-type"] ||
    !req.headers["content-type"].includes("multipart/form-data")
  ) {
    return next(); // Salta se non è multipart/form-data
  }

  const busboy = Busboy({ headers: req.headers }); // Crea una nuova istanza di Busboy

  req.body = {}; // Prepara un oggetto body vuoto
  busboy.on("field", (fieldname, val) => {
    req.body[fieldname] = val; // Salva i campi form-data in req.body
  });

  busboy.on("file", (fieldname, file, filename) => {
    req.fileStream = { fieldname, file, filename }; // Salva il file per Multer
  });

  busboy.on("finish", () => {
    next();
  });

  req.pipe(busboy); // Collega la richiesta a Busboy
};

// Configurazione di Multer per gestire i file caricati
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Salva i file nella directory uploads
  },
  filename: (req, file, cb) => {
    const cellId = req.body.cellId; // Ottieni l'ID della cella dal frontend
    if (!cellId) {
      return cb(new Error("Cell ID is missing"));
    }
    cb(null, `${cellId}.png`); // Salva il file come <cellId>.png
  },
});

// Filtro per assicurarsi che solo immagini vengano caricate
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

// Configura Multer
const upload = multer({ storage, fileFilter });

// Middleware per servire file statici
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir)); // Serve le immagini dalla directory uploads

// Endpoint per il caricamento delle immagini
app.post("/upload", preMulterMiddleware, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      console.error("Errore: Nessun file caricato");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`; // Costruisci l'URL dell'immagine
    console.log(`File caricato con successo: ${req.file.filename}`);
    res.status(200).json({ message: "File uploaded successfully", imageUrl });
  } catch (error) {
    console.error("Errore durante il caricamento:", error);
    res
      .status(500)
      .json({ error: "An error occurred while uploading the file" });
  }
});

// Endpoint per eliminare un'immagine
app.delete("/delete/:cellId", (req, res) => {
  const cellId = req.params.cellId;
  const filePath = path.join(uploadDir, `${cellId}.png`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // Elimina il file
    console.log(`File rimosso: ${filePath}`);
    res.status(200).json({ message: "File deleted successfully" });
  } else {
    console.error("Errore: File non trovato per la cella", cellId);
    res.status(404).json({ error: "File not found" });
  }
});

// Gestione degli errori globali
app.use((err, req, res, next) => {
  console.error("Errore:", err.message); // Log del messaggio di errore
  if (err.stack) {
    console.error("Stack trace:", err.stack); // Log del trace dello stack se disponibile
  }
  res.status(500).json({ error: err.message });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Frontend Code (da includere in "public/script.js")
document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll(".cell");

  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const cellId = cell.dataset.cellId; // Ottieni l'ID della cella
      console.log(`Cella selezionata: ${cellId}`);

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log(`File selezionato: ${file.name}`);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("cellId", cellId);

        try {
          const response = await fetch("/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (response.ok) {
            console.log("Immagine caricata:", result.imageUrl);

            // Aggiorna la cella con l'immagine caricata
            const img = document.createElement("img");
            img.src = result.imageUrl;
            img.alt = `Cell ${cellId}`;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";

            // Rimuovi eventuali contenuti precedenti e aggiungi l'immagine
            cell.innerHTML = "";
            cell.appendChild(img);
          } else {
            console.error("Errore nel caricamento dell'immagine:", result);
            alert(result.error || "Errore durante il caricamento");
          }
        } catch (error) {
          console.error("Errore nel caricamento dell'immagine:", error);
          alert("Errore durante il caricamento");
        }
      });

      fileInput.click();
    });
  });
});
