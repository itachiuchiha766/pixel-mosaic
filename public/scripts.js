const gridContainer = document.getElementById("grid-container");
const imageUploadInput = document.getElementById("image-upload");
const modal = document.getElementById("cell-occupied-modal");
const closeModalButton = document.querySelector(".close-btn");
const chooseDifferentCellButton = document.getElementById(
  "choose-different-cell-btn"
);
const removeImageButton = document.getElementById("remove-image-btn");

const totalCells = 400;
let selectedCell = null;

// Inizializzazione delle celle con immagini esistenti
async function initializeCells() {
  try {
    const response = await fetch("/current-images");
    const currentImages = await response.json();

    Object.entries(currentImages).forEach(([cellId, imageUrl]) => {
      const cell = document.querySelector(
        `.grid-cell[data-cell-id="${cellId}"]`
      );
      if (cell) {
        cell.style.backgroundImage = `url(${imageUrl})`;
        cell.style.backgroundSize = "cover";
        cell.style.backgroundPosition = "center";
        cell.classList.add("occupied");
      }
    });
  } catch (error) {
    console.error("Errore nell'inizializzazione delle celle:", error);
  }
}

function showModal() {
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

closeModalButton.addEventListener("click", closeModal);
chooseDifferentCellButton.addEventListener("click", closeModal);

removeImageButton.addEventListener("click", async () => {
  const occupiedCell = document.querySelector(".grid-cell.occupied");
  if (occupiedCell) {
    const cellId = occupiedCell.dataset.cellId;

    try {
      const response = await fetch(`/delete/${cellId}`, { method: "DELETE" });

      if (response.ok) {
        occupiedCell.style.backgroundImage = "";
        occupiedCell.classList.remove("occupied");
        closeModal();
      } else {
        throw new Error("Errore durante la rimozione");
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("Non è stato possibile rimuovere l'immagine");
    }
  }
});

// Genera le celle della griglia
for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement("div");
  cell.classList.add("grid-cell");
  cell.dataset.cellId = i;

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

// Caricamento immagine
// Updated image upload handling in scripts.js
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

  // Create a temporary image to preload and calculate dimensions
  const tempImg = new Image();
  tempImg.onload = async () => {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.classList.add("loading-overlay");
    loadingOverlay.innerHTML = `
      <div class="spinner"></div>
      <p>Uploading...</p>
    `;
    selectedCell.appendChild(loadingOverlay);

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

        // Update cell with new image
        selectedCell.style.backgroundImage = `url(${data.imageUrl})`;
        selectedCell.style.backgroundSize = "cover"; // Mantieni cover per adattamento
        selectedCell.style.backgroundPosition = "center"; // Centra l'immagine
        selectedCell.classList.add("occupied");

        loadingOverlay.remove();
      } else {
        throw new Error("Caricamento fallito");
      }
    } catch (error) {
      loadingOverlay.remove();
      alert(`Errore: ${error.message}`);
    } finally {
      imageUploadInput.value = "";
      selectedCell = null;
    }
  };

  // Read the file as a data URL to preload
  const reader = new FileReader();
  reader.onload = (e) => {
    tempImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Carica immagini esistenti all'avvio
initializeCells();
