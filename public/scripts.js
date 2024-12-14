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
const totalCells = 400;

// Variabile globale per tracciare la cella selezionata
let selectedCell = null;

// Funzione per mostrare la modale
function showModal() {
  modal.style.display = "flex";
}

// Funzione per chiudere la modale
function closeModal() {
  modal.style.display = "none";
}

// Eventi per la modale
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

closeModalButton.addEventListener("click", closeModal);
chooseDifferentCellButton.addEventListener("click", closeModal);

// Rimuovi immagine dalla cella occupata
removeImageButton.addEventListener("click", () => {
  const occupiedCell = document.querySelector(".grid-cell.occupied");
  if (occupiedCell) {
    occupiedCell.style.backgroundImage = "";
    occupiedCell.classList.remove("occupied");
    closeModal();
  } else {
    console.warn("Nessuna cella occupata trovata.");
  }
});

// Genera le celle della griglia
for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement("div");
  cell.classList.add("grid-cell");
  cell.dataset.cellId = i;

  // Aggiungi evento click alle celle
  cell.addEventListener("click", () => {
    if (cell.classList.contains("occupied")) {
      showModal();
    } else {
      selectedCell = cell;
      imageUploadInput.click();
    }
  });

  gridContainer.appendChild(cell);
}

// Gestione caricamento immagine
imageUploadInput.onchange = async (event) => {
  if (!selectedCell) {
    console.error("Errore: nessuna cella selezionata.");
    return;
  }

  const file = event.target.files[0];
  if (!file || !file.type.startsWith("image/")) {
    alert("Per favore seleziona un file immagine valido.");
    imageUploadInput.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("cellId", selectedCell.dataset.cellId);

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
      alert(`Errore nel caricamento dell'immagine: ${errorMessage}`);
    }
  } catch (error) {
    alert("Errore durante la richiesta al server.");
    console.error("Errore:", error);
  } finally {
    imageUploadInput.value = "";
    selectedCell = null;
  }
};
