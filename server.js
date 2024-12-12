const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configura la directory per salvare le immagini
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Pulizia opzionale della directory uploads al riavvio del server
// fs.readdirSync(uploadDir).forEach(file => fs.unlinkSync(path.join(uploadDir, file)));

// Middleware per analizzare i dati del body (necessario per i form)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione di Multer per gestire i file caricati
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Salva i file nella directory uploads
    },
    filename: (req, file, cb) => {
        const cellId = req.body.cellId; // Ottieni l'ID della cella dal frontend
        if (!cellId) {
            return cb(new Error('Cell ID is missing'));
        }
        cb(null, `${cellId}.png`); // Salva il file come <cellId>.png
    },
});

// Filtro per assicurarsi che solo immagini vengano caricate
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

// Configura Multer
const upload = multer({ storage, fileFilter });

// Middleware per servire file statici
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir)); // Serve le immagini dalla directory uploads

// Endpoint per il caricamento delle immagini
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            console.error('Errore: Nessun file caricato');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.body.cellId) {
            console.error('Errore: Nessun cellId ricevuto');
            return res.status(400).json({ error: 'Cell ID is missing' });
        }

        const imageUrl = `/uploads/${req.file.filename}`; // Costruisci l'URL dell'immagine
        console.log(`File caricato con successo: ${req.file.filename}`);
        res.status(200).json({ message: 'File uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Errore durante il caricamento:', error);
        res.status(500).json({ error: 'An error occurred while uploading the file' });
    }
});

// Endpoint per eliminare un'immagine
app.delete('/delete/:cellId', (req, res) => {
    const cellId = req.params.cellId;
    const filePath = path.join(uploadDir, `${cellId}.png`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Elimina il file
        console.log(`File rimosso: ${filePath}`);
        res.status(200).json({ message: 'File deleted successfully' });
    } else {
        console.error('Errore: File non trovato per la cella', cellId);
        res.status(404).json({ error: 'File not found' });
    }
});

// Gestione degli errori globali
app.use((err, req, res, next) => {
    console.error('Errore:', err.message);  // Log del messaggio di errore
    if (err.stack) {
        console.error('Stack trace:', err.stack);  // Log del trace dello stack se disponibile
    }
    res.status(500).json({ error: err.message });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
