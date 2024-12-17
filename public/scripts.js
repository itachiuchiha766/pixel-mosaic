// Defer and optimize image loading and grid creation
document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById("grid-container");
  const imageUploadInput = document.getElementById("image-upload");
  const modal = document.getElementById("cell-occupied-modal");
  const closeModalButton = document.querySelector(".close-btn");
  const chooseDifferentCellButton = document.getElementById("choose-different-cell-btn");
  const removeImageButton = document.getElementById("remove-image-btn");

  const totalCells = 400;
  let selectedCell = null;

  // Lazy load grid cells
  function lazyLoadGridCells() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.dataset.cellId = i;
      cell.setAttribute('loading', 'lazy'); // Native lazy loading

      cell.addEventListener("click", () => {
        if (cell.classList.contains("occupied")) {
          showModal();
        } else {
          selectedCell = cell;
          imageUploadInput.click();
        }
      });

      fragment.appendChild(cell);
    }
    gridContainer.appendChild(fragment);
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

  // Caricamento immagine
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

    // Mostra un overlay di caricamento nella cella selezionata
    const loadingOverlay = document.createElement("div");
    loadingOverlay.classList.add("loading-overlay");
    loadingOverlay.innerHTML = `
      <div class="spinner"></div>
    `;
    selectedCell.style.position = "relative";
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
        selectedCell.style.backgroundSize = "cover";
        selectedCell.style.backgroundPosition = "center";
        selectedCell.classList.add("occupied");
      } else {
        throw new Error("Caricamento fallito");
      }
    } catch (error) {
      alert(`Errore: ${error.message}`);
    } finally {
      loadingOverlay.remove();
      imageUploadInput.value = "";
      selectedCell = null;
    }
  };

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

  // Lazy load grid and initialize
  lazyLoadGridCells();
  initializeCells();
});