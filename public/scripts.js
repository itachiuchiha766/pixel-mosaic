// Seleziona il contenitore della griglia, l'input file, e la modale
const gridContainer = document.getElementById("grid-container");
const imageUploadInput = document.getElementById("image-upload");
const modal = document.getElementById("cell-occupied-modal");
const closeModalButton = document.querySelector(".close-btn");
const chooseDifferentCellButton = document.getElementById(
  "choose-different-cell-btn"
);
const removeImageButton = document.getElementById("remove-image-btn");

// Numero totale di celle
const totalCells = 400; // Cambia questo valore per il numero desiderato di pixel

// Variabile globale per tracciare la cella selezionata
let selectedCell = null;

// Funzione per mostrare la modale
function showModal() {
  modal.style.display = "flex"; // Mostra la modale
}

// Funzione per chiudere la modale
function closeModal() {
  modal.style.display = "none"; // Chiudi la modale
}

// Aggiungi l'evento per chiudere la modale cliccando fuori dalla modale
modal.addEventListener("click", (event) => {
  // Se l'utente clicca fuori dal contenuto della modale, la chiudiamo
  if (event.target === modal) {
    closeModal();
  }
});

// Aggiungi l'evento per chiudere la modale cliccando sul tasto di chiusura
closeModalButton.addEventListener("click", closeModal);

// Aggiungi l'evento per scegliere una cella diversa
chooseDifferentCellButton.addEventListener("click", () => {
  closeModal(); // Chiudi la modale quando si clicca su "Choose a different cell"
});

// Aggiungi l'evento per rimuovere l'immagine
removeImageButton.addEventListener("click", () => {
  const occupiedCell = document.querySelector(".grid-cell.occupied");
  if (occupiedCell) {
    console.log(
      "Rimuovendo immagine dalla cella:",
      occupiedCell.dataset.cellId
    );
    occupiedCell.style.backgroundImage = ""; // Rimuovi l'immagine
    occupiedCell.classList.remove("occupied"); // Rimuovi la classe "occupied"
    closeModal(); // Chiudi la modale
  } else {
    console.warn("Nessuna cella occupata trovata.");
  }
});

// Genera le celle della griglia
for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement("div");
  cell.classList.add("grid-cell");
  cell.dataset.cellId = i; // Salva l'ID della cella

  // Aggiungi un evento click per caricare un'immagine
  cell.addEventListener("click", () => {
    if (cell.classList.contains("occupied")) {
      // Se la cella è già occupata, mostra la modale
      console.log("La cella è già occupata:", cell.dataset.cellId);
      showModal();
    } else {
      console.log("Cella vuota selezionata:", cell.dataset.cellId);
      selectedCell = cell; // Salva la cella selezionata
      imageUploadInput.click(); // Simula un click sull'input file nascosto
    }
  });

  gridContainer.appendChild(cell); // Aggiungi la cella alla griglia
}

// Gestisci il caricamento dell'immagine
imageUploadInput.onchange = async (event) => {
  if (!selectedCell) return; // Assicurati che una cella sia selezionata
  console.log("Evento onchange attivato");
  const file = event.target.files[0];
  console.log("File selezionato:", file);

  if (!file || !file.type.startsWith("image/")) {
    alert("Per favore seleziona un file immagine valido.");
    return;
  }

  console.log("File valido", file.name);
  const formData = new FormData();
  formData.append("image", file);

  if (!selectedCell.dataset.cellId) {
    console.error("Errore: cellId mancante");
    alert("Errore: cellId mancante");
    return;
  }
  console.log("cellId:", selectedCell.dataset.cellId);
  formData.append("cellId", selectedCell.dataset.cellId);

  // Debug: Verifica i dati nel FormData
  console.log("Dati inviati nel FormData:");
  formData.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      selectedCell.style.backgroundImage = `url(${data.imageUrl})`;
      selectedCell.style.backgroundSize = "cover";
      selectedCell.style.backgroundPosition = "center";
      selectedCell.classList.add("occupied");
    } else {
      const errorMessage = await response.text();
      console.error("Errore nel caricamento dell immagine:", errorMessage);
      alert(`Errore nel caricamento dell'immagine: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Errore durante la richiesta al server:", error);
    alert("Errore durante la richiesta al server.");
  } finally {
    imageUploadInput.disabled = false;
    imageUploadInput.value = "";
    selectedCell = null;
  }
};
