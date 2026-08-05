const STORAGE_KEY = "fitshare_outfits";

const elements = {
  addFitBtn: document.getElementById("addFitBtn"),
  emptyAddBtn: document.getElementById("emptyAddBtn"),
  fitModal: document.getElementById("fitModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelFormBtn: document.getElementById("cancelFormBtn"),
  fitForm: document.getElementById("fitForm"),
  fitsGrid: document.getElementById("fitsGrid"),
  emptyState: document.getElementById("emptyState"),
  fitCount: document.getElementById("fitCount"),
  uploadZone: document.getElementById("uploadZone"),
  imageInput: document.getElementById("imageInput"),
  uploadPlaceholder: document.getElementById("uploadPlaceholder"),
  uploadPreview: document.getElementById("uploadPreview"),
  previewImage: document.getElementById("previewImage"),
  removeImageBtn: document.getElementById("removeImageBtn"),
  linksList: document.getElementById("linksList"),
  addLinkBtn: document.getElementById("addLinkBtn"),
  fitCardTemplate: document.getElementById("fitCardTemplate"),
  themeToggle: document.getElementById("themeToggle"),
};

let selectedImageData = null;
const MAX_LINKS = 5;

function loadFits() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveFits(fits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fits));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function openModal() {
  elements.fitModal.classList.add("open");
  elements.fitModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  elements.fitModal.classList.remove("open");
  elements.fitModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetForm();
}

function resetForm() {
  elements.fitForm.reset();
  selectedImageData = null;
  elements.uploadPlaceholder.hidden = false;
  elements.uploadPreview.hidden = true;
  elements.previewImage.src = "";

  elements.linksList.innerHTML = "";
  addLinkRow();
}

function addLinkRow() {
  const rows = elements.linksList.querySelectorAll(".link-row");
  if (rows.length >= MAX_LINKS) return;

  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <input type="text" class="link-row__desc" placeholder="Item name (optional)" maxlength="60">
    <input type="url" class="link-row__url" placeholder="https://shop-link.com" required>
    <button type="button" class="link-row__remove" aria-label="Remove link">&times;</button>
  `;

  const removeBtn = row.querySelector(".link-row__remove");
  removeBtn.addEventListener("click", () => {
    if (elements.linksList.children.length > 1) {
      row.remove();
      updateRemoveButtons();
    }
  });

  elements.linksList.appendChild(row);
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = elements.linksList.querySelectorAll(".link-row");
  rows.forEach((row) => {
    const btn = row.querySelector(".link-row__remove");
    btn.hidden = rows.length <= 1;
  });
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImageData = e.target.result;
    elements.previewImage.src = selectedImageData;
    elements.uploadPlaceholder.hidden = true;
    elements.uploadPreview.hidden = false;
  };
  reader.readAsDataURL(file);
}

function getFormData() {
  const name = document.getElementById("outfitName").value.trim();
  const linkRows = elements.linksList.querySelectorAll(".link-row");
  const links = [];

  linkRows.forEach((row) => {
    const url = row.querySelector(".link-row__url").value.trim();
    const description = row.querySelector(".link-row__desc").value.trim();
    if (url) {
      links.push({ url, description: description || "Shop this item" });
    }
  });

  return { name, links };
}

function renderFits() {
  const fits = loadFits();
  elements.fitsGrid.innerHTML = "";

  fits.forEach((fit) => {
    const card = elements.fitCardTemplate.content.cloneNode(true);
    const article = card.querySelector(".fit-card");

    const img = card.querySelector(".fit-card__image");
    img.src = fit.image;
    img.alt = fit.name;

    // Title is now inside the overlay on the image
    card.querySelector(".fit-card__title").textContent = fit.name;

    const linksList = card.querySelector(".fit-card__links");
    fit.links.forEach((link) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = link.description;
      li.appendChild(a);
      linksList.appendChild(li);
    });

    const likeBtn = card.querySelector(".fit-card__like");
    const likeCount = card.querySelector(".fit-card__like-count");
    likeCount.textContent = fit.likes || 0;
    if (fit.liked) likeBtn.classList.add("liked");

    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(fit.id);
    });

    card.querySelector(".fit-card__delete").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${fit.name}"?`)) {
        deleteFit(fit.id);
      }
    });

    // Click to toggle expand (for mobile / touch)
    article.addEventListener("click", (e) => {
      // Don't toggle if user clicked a link inside the body
      if (e.target.closest("a") || e.target.closest("button")) return;
      article.classList.toggle("fit-card--expanded");
    });

    article.dataset.id = fit.id;
    elements.fitsGrid.appendChild(card);
  });

  const count = fits.length;
  elements.fitCount.textContent = `${count} outfit${count !== 1 ? "s" : ""}`;
  elements.emptyState.classList.toggle("hidden", count > 0);
}

function toggleLike(id) {
  const fits = loadFits();
  const fit = fits.find((f) => f.id === id);
  if (!fit) return;

  fit.liked = !fit.liked;
  fit.likes = (fit.likes || 0) + (fit.liked ? 1 : -1);
  if (fit.likes < 0) fit.likes = 0;

  saveFits(fits);
  renderFits();
}

function deleteFit(id) {
  const fits = loadFits().filter((f) => f.id !== id);
  saveFits(fits);
  renderFits();
}

function handleSubmit(e) {
  e.preventDefault();

  if (!selectedImageData) {
    alert("Please upload an outfit photo.");
    return;
  }

  const { name, links } = getFormData();

  if (links.length === 0) {
    alert("Please add at least one shopping link.");
    return;
  }

  const fits = loadFits();
  fits.unshift({
    id: generateId(),
    name,
    image: selectedImageData,
    links,
    likes: 0,
    liked: false,
    createdAt: Date.now(),
  });

  saveFits(fits);
  renderFits();
  closeModal();
}

// Event listeners
elements.addFitBtn.addEventListener("click", openModal);
elements.emptyAddBtn.addEventListener("click", openModal);
elements.closeModalBtn.addEventListener("click", closeModal);
elements.cancelFormBtn.addEventListener("click", closeModal);
elements.modalBackdrop.addEventListener("click", closeModal);
elements.fitForm.addEventListener("submit", handleSubmit);
elements.addLinkBtn.addEventListener("click", addLinkRow);

elements.uploadZone.addEventListener("click", (e) => {
  if (e.target.closest(".upload-zone__remove")) return;
  elements.imageInput.click();
});

elements.imageInput.addEventListener("change", (e) => {
  if (e.target.files[0]) handleImageFile(e.target.files[0]);
});

elements.removeImageBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedImageData = null;
  elements.imageInput.value = "";
  elements.uploadPlaceholder.hidden = false;
  elements.uploadPreview.hidden = true;
});

elements.uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  elements.uploadZone.classList.add("dragover");
});

elements.uploadZone.addEventListener("dragleave", () => {
  elements.uploadZone.classList.remove("dragover");
});

elements.uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  elements.uploadZone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && elements.fitModal.classList.contains("open")) {
    closeModal();
  }
});

// ===== Dark Mode Toggle =====
function initTheme() {
  const savedTheme = localStorage.getItem("fitshare_theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    // Respect system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("fitshare_theme", next);
}

elements.themeToggle.addEventListener("click", toggleTheme);

// Listen for system theme changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("fitshare_theme")) {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  }
});

// Init
initTheme();
addLinkRow();
renderFits();
