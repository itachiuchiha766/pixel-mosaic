// Seleziona il contenitore della griglia, l'input file, e la modale
const gridContainer = document.getElementById('grid-container');
const imageUploadInput = document.getElementById('image-upload');
const modal = document.getElementById('cell-occupied-modal');
const closeModalButton = document.querySelector('.close-btn');
const chooseDifferentCellButton = document.getElementById('choose-different-cell-btn');
const removeImageButton = document.getElementById('remove-image-btn');

// Numero totale di celle
const totalCells = 400; // Cambia questo valore per il numero desiderato di pixel

// Funzione per mostrare la modale
function showModal() {
    modal.style.display = 'flex'; // Mostra la modale
}

// Funzione per chiudere la modale
function closeModal() {
    modal.style.display = 'none'; // Chiudi la modale
}

// Aggiungi l'evento per chiudere la modale cliccando fuori dalla modale
modal.addEventListener('click', (event) => {
    // Se l'utente clicca fuori dal contenuto della modale, la chiudiamo
    if (event.target === modal) {
        closeModal();
    }
});

// Aggiungi l'evento per chiudere la modale cliccando sul tasto di chiusura
closeModalButton.addEventListener('click', closeModal);

// Aggiungi l'evento per scegliere una cella diversa
chooseDifferentCellButton.addEventListener('click', () => {
    closeModal(); // Chiudi la modale quando si clicca su "Choose a different cell"
});

// Aggiungi l'evento per rimuovere l'immagine
removeImageButton.addEventListener('click', () => {
    const occupiedCell = document.querySelector('.grid-cell.occupied');
    if (occupiedCell) {
        occupiedCell.style.backgroundImage = ''; // Rimuovi l'immagine
        occupiedCell.classList.remove('occupied'); // Rimuovi la classe "occupied"
        closeModal(); // Chiudi la modale
    }
});

// Genera le celle della griglia
for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');

    // Aggiungi un evento click per caricare un'immagine
    cell.addEventListener('click', () => {
        // Se la cella è già occupata, mostra la modale
        if (cell.classList.contains('occupied')) {
            showModal();
        } else {
            // Salva la cella corrente in una variabile temporanea
            const currentCell = cell;

            // Simula un click sull'input file nascosto
            imageUploadInput.click();

            // Gestisci il caricamento dell'immagine
            imageUploadInput.onchange = (event) => {
                const file = event.target.files[0]; // Ottieni il file selezionato
                if (file) {
                    const reader = new FileReader();

                    // Quando l'immagine è caricata, applicala come sfondo della cella
                    reader.onload = (e) => {
                        currentCell.style.backgroundImage = `url(${e.target.result})`;
                        currentCell.style.backgroundSize = 'cover';
                        currentCell.style.backgroundPosition = 'center';
                    };

                    reader.readAsDataURL(file); // Leggi il file come Data URL
                    currentCell.classList.add('occupied'); // Aggiungi la classe per segnare la cella come occupata
                }

                // Resetta il valore dell'input file per consentire più upload
                imageUploadInput.value = '';
            };
        }
    });

    gridContainer.appendChild(cell);
}
