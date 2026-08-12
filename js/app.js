const STORAGE_KEY = "fitshare_outfits";
const USERS_KEY = "fitshare_users";
const CURRENT_USER_KEY = "fitshare_current_user";

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

  // Auth Elements
  userNavGuest: document.getElementById("userNavGuest"),
  userNavAuth: document.getElementById("userNavAuth"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  loginNavBtn: document.getElementById("loginNavBtn"),
  signupNavBtn: document.getElementById("signupNavBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  authModal: document.getElementById("authModal"),
  authModalBackdrop: document.getElementById("authModalBackdrop"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  loginTabBtn: document.getElementById("loginTabBtn"),
  signupTabBtn: document.getElementById("signupTabBtn"),
  authBanner: document.getElementById("authBanner"),
  authAlert: document.getElementById("authAlert"),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  dbStatusBanner: document.getElementById("dbStatusBanner"),
};

let selectedImageData = null;
const MAX_LINKS = 5;

// ===== Demo Seed Data =====
const DEMO_FITS = [
  {
    id: "demo-fit-1",
    name: "Minimalist Summer Linen Fit",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    links: [
      { url: "https://www.uniqlo.com", description: "Linen Open Collar Shirt" },
      { url: "https://www.zara.com", description: "Pleated Trousers" },
    ],
    likes: 14,
    liked: false,
    authorId: "demo-user-1",
    authorName: "Maya Lin",
    createdAt: Date.now() - 3600000 * 24 * 2,
  },
  {
    id: "demo-fit-2",
    name: "Urban Oversized Denim & Kicks",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80",
    links: [
      { url: "https://www.nike.com", description: "Air Jordan 1 Retro Low" },
      { url: "https://www.levis.com", description: "Vintage Fit Denim Jacket" },
    ],
    likes: 29,
    liked: true,
    authorId: "demo-user-2",
    authorName: "Jordan Vance",
    createdAt: Date.now() - 3600000 * 24 * 5,
  },
  {
    id: "demo-fit-3",
    name: "Monochrome Coffee Shop Vibe",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    links: [
      { url: "https://www.cos.com", description: "Oversized Wool Trench" },
      { url: "https://www.dr-martens.com", description: "1461 Smooth Leather Shoes" },
    ],
    likes: 42,
    liked: false,
    authorId: "demo-user-3",
    authorName: "Elena Rostova",
    createdAt: Date.now() - 3600000 * 24 * 7,
  },
];

// ===== Storage Helpers =====
function loadFits() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Seed with demo fits on first load
      saveFits(DEMO_FITS);
      return DEMO_FITS;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveFits(fits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fits));
}

function getUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  updateUserUI();
  renderFits();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ===== Navbar User State UI =====
function updateUserUI() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    elements.userNavGuest.hidden = true;
    elements.userNavGuest.style.display = "none";
    elements.userNavAuth.hidden = false;
    elements.userNavAuth.style.display = "flex";
    const displayName = currentUser.name || `@${currentUser.username}`;
    elements.userName.textContent = displayName;
    elements.userAvatar.textContent = (currentUser.name || currentUser.username)[0].toUpperCase();
  } else {
    elements.userNavGuest.hidden = false;
    elements.userNavGuest.style.display = "flex";
    elements.userNavAuth.hidden = true;
    elements.userNavAuth.style.display = "none";
  }
}

// ===== Auth Modal Controls =====
function openAuthModal(mode = "login", showBanner = false) {
  elements.authBanner.hidden = !showBanner;
  hideAuthAlert();
  switchAuthTab(mode);
  elements.authModal.classList.add("open");
  elements.authModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  elements.authModal.classList.remove("open");
  elements.authModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  elements.loginForm.reset();
  elements.signupForm.reset();
  hideAuthAlert();
}

function switchAuthTab(mode) {
  hideAuthAlert();
  if (mode === "login") {
    elements.loginTabBtn.classList.add("active");
    elements.signupTabBtn.classList.remove("active");
    elements.loginForm.hidden = false;
    elements.signupForm.hidden = true;
  } else {
    elements.loginTabBtn.classList.remove("active");
    elements.signupTabBtn.classList.add("active");
    elements.loginForm.hidden = true;
    elements.signupForm.hidden = false;
  }
}

function showAuthAlert(message, type = "error") {
  elements.authAlert.textContent = message;
  elements.authAlert.className = `auth-alert ${type}`;
  elements.authAlert.hidden = false;
}

function hideAuthAlert() {
  elements.authAlert.hidden = true;
  elements.authAlert.textContent = "";
}

// ===== Add Fit Modal Controls =====
function handleAddFitClick() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    openAuthModal("login", true);
  } else {
    openModal();
  }
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

// ===== Rendering Feed =====
async function renderFits() {
  const currentUser = getCurrentUser();
  let fits = loadFits();

  try {
    const userIdParam = currentUser ? `?userId=${currentUser.id}` : "";
    const res = await fetch(`/api/fits${userIdParam}`);
    if (res.ok) {
      fits = await res.json();
      saveFits(fits);
      if (elements.dbStatusBanner) elements.dbStatusBanner.hidden = true;
    } else if (res.status === 503) {
      if (elements.dbStatusBanner) elements.dbStatusBanner.hidden = false;
    }
  } catch (err) {
    if (elements.dbStatusBanner) elements.dbStatusBanner.hidden = false;
  }

  elements.fitsGrid.innerHTML = "";

  fits.forEach((fit) => {
    const card = elements.fitCardTemplate.content.cloneNode(true);
    const article = card.querySelector(".fit-card");

    const img = card.querySelector(".fit-card__image");
    img.src = fit.image;
    img.alt = fit.name;

    card.querySelector(".fit-card__title").textContent = fit.name;

    // Display Author
    const authorSpan = card.querySelector(".fit-card__author-name");
    if (authorSpan) {
      authorSpan.textContent = fit.authorName || "Community Member";
    }

    // Permission check for Deleting fit:
    const isOwner = currentUser && fit.authorId && currentUser.id === fit.authorId;
    if (isOwner) {
      article.classList.add("is-owner");
    }

    const deleteBtn = card.querySelector(".fit-card__delete");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      if (!currentUser) {
        openAuthModal("login", true);
        return;
      }

      if (currentUser.id !== fit.authorId) {
        alert("You can only remove fits that you added.");
        return;
      }

      if (confirm(`Are you sure you want to delete "${fit.name}"?`)) {
        deleteFit(fit.id);
      }
    });

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

    // Click to toggle expand
    article.addEventListener("click", (e) => {
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

async function toggleLike(id) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    openAuthModal("login", true);
    return;
  }

  const fits = loadFits();
  const fit = fits.find((f) => f.id === id);
  if (!fit) return;

  fit.liked = !fit.liked;
  fit.likes = (fit.likes || 0) + (fit.liked ? 1 : -1);
  if (fit.likes < 0) fit.likes = 0;
  saveFits(fits);

  try {
    await fetch("/api/fits?action=like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fitId: id, userId: currentUser.id }),
    });
  } catch (err) {
    console.warn("Could not sync like to server:", err);
  }

  renderFits();
}

async function deleteFit(id) {
  const currentUser = getCurrentUser();
  const fits = loadFits().filter((f) => f.id !== id);
  saveFits(fits);

  if (currentUser) {
    try {
      await fetch(`/api/fits?id=${id}&userId=${currentUser.id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not delete fit from server:", err);
    }
  }

  renderFits();
}

async function handleSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    closeModal();
    openAuthModal("login", true);
    return;
  }

  if (!selectedImageData) {
    alert("Please upload an outfit photo.");
    return;
  }

  const { name, links } = getFormData();

  if (links.length === 0) {
    alert("Please add at least one shopping link.");
    return;
  }

  const newFit = {
    id: generateId(),
    name,
    image: selectedImageData,
    links,
    likes: 0,
    liked: false,
    authorId: currentUser.id,
    authorName: currentUser.name || `@${currentUser.username}`,
    createdAt: Date.now(),
  };

  const fits = loadFits();
  fits.unshift(newFit);
  saveFits(fits);

  try {
    const res = await fetch("/api/fits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFit),
    });
    if (res.ok) {
      const serverFit = await res.json();
      console.log("Saved fit to database:", serverFit);
    }
  } catch (err) {
    console.warn("Could not save fit to database API:", err);
  }

  renderFits();
  closeModal();
}

// ===== Auth Form Handlers =====
async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value.trim();

  if (!usernameOrEmail || !password) {
    showAuthAlert("Please fill out all fields.");
    return;
  }

  try {
    const res = await fetch("/api/auth?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameOrEmail, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setCurrentUser(data);
      closeAuthModal();
      return;
    } else if (res.status === 401) {
      showAuthAlert(data.error || "Invalid username or password.");
      return;
    } else if (res.status === 503) {
      showAuthAlert(data.error || "Database not connected. Please set DATABASE_URL in Vercel.");
      return;
    } else if (data.error) {
      showAuthAlert(data.error);
      return;
    }
  } catch (err) {
    console.warn("API login failed, falling back to local storage:", err);
  }

  const users = getUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail ||
      (u.email && u.email.toLowerCase() === usernameOrEmail)
  );

  if (!user || user.password !== password) {
    showAuthAlert("Invalid username/email or password.");
    return;
  }

  setCurrentUser(user);
  closeAuthModal();
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const username = document.getElementById("signupUsername").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value.trim();

  if (!name || !username || !password) {
    showAuthAlert("Please fill out all fields.");
    return;
  }

  if (username.length < 3) {
    showAuthAlert("Username must be at least 3 characters long.");
    return;
  }

  if (password.length < 4) {
    showAuthAlert("Password must be at least 4 characters long.");
    return;
  }

  try {
    const res = await fetch("/api/auth?action=signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setCurrentUser(data);
      closeAuthModal();
      return;
    } else if (res.status === 409) {
      showAuthAlert(data.error || "That username is already taken. Please try another.");
      return;
    } else if (res.status === 503) {
      showAuthAlert(data.error || "Database not connected. Please set DATABASE_URL in Vercel.");
      return;
    } else if (data.error) {
      showAuthAlert(data.error);
      return;
    }
  } catch (err) {
    console.warn("API signup failed, falling back to local storage:", err);
  }

  const users = getUsers();
  const existing = users.find((u) => u.username.toLowerCase() === username);

  if (existing) {
    showAuthAlert("That username is already taken. Please try another.");
    return;
  }

  const newUser = {
    id: generateId(),
    name,
    username,
    password,
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  closeAuthModal();
}

function handleLogout() {
  setCurrentUser(null);
}

// ===== Event Listeners =====
elements.addFitBtn.addEventListener("click", handleAddFitClick);
elements.emptyAddBtn.addEventListener("click", handleAddFitClick);
elements.closeModalBtn.addEventListener("click", closeModal);
elements.cancelFormBtn.addEventListener("click", closeModal);
elements.modalBackdrop.addEventListener("click", closeModal);
elements.fitForm.addEventListener("submit", handleSubmit);
elements.addLinkBtn.addEventListener("click", addLinkRow);

// Auth listeners
elements.loginNavBtn.addEventListener("click", () => openAuthModal("login"));
elements.signupNavBtn.addEventListener("click", () => openAuthModal("signup"));
elements.logoutBtn.addEventListener("click", handleLogout);
elements.closeAuthModalBtn.addEventListener("click", closeAuthModal);
elements.authModalBackdrop.addEventListener("click", closeAuthModal);

elements.loginTabBtn.addEventListener("click", () => switchAuthTab("login"));
elements.signupTabBtn.addEventListener("click", () => switchAuthTab("signup"));

elements.loginForm.addEventListener("submit", handleLoginSubmit);
elements.signupForm.addEventListener("submit", handleSignupSubmit);

// Image Upload Zone listeners
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
  if (e.key === "Escape") {
    if (elements.fitModal.classList.contains("open")) closeModal();
    if (elements.authModal.classList.contains("open")) closeAuthModal();
  }
});

// ===== Dark Mode Toggle =====
function initTheme() {
  const savedTheme = localStorage.getItem("fitshare_theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
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

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("fitshare_theme")) {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  }
});

// Init
initTheme();
updateUserUI();
addLinkRow();
renderFits();
