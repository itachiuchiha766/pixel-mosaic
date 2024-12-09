const express = require('express');
const path = require('path');
const app = express();

// Servire i file statici dal folder public
app.use(express.static(path.join(__dirname, 'public')));

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
