const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Imposta la cartella per il salvataggio delle immagini
const uploadDir = path.join(__dirname, 'uploads');

// Crea la cartella se non esiste
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configurazione di multer per il salvataggio dei file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Salva i file nella cartella uploads
    },
    filename: (req, file, cb) => {
        const cellId = req.body.cellId;
        if (!cellId) {
            return cb(new Error('Cell ID is missing'));
        }
        cb(null, `${cellId}.png`); // Salva con il nome cellId.png
    },
});

const upload = multer({ storage });

// Serve i file statici dalla cartella uploads
app.use('/uploads', express.static(uploadDir));

// Serve i file statici dalla cartella pubblica (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Route per caricare l'immagine
app.post('/uploads', upload.single('image'), (req, res) => {
    console.log('File uploaded successfully:', req.file);
    res.sendStatus(200); // Risposta OK
});

// Rimuove l'immagine
app.delete('/delete/:cellId', (req, res) => {
    const cellId = req.params.cellId;
    const filePath = path.join(uploadDir, `${cellId}.png`);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Errore nella rimozione del file');
        }
        console.log(`File ${filePath} rimosso con successo`);
        res.sendStatus(200);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
