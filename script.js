
const bookmarksGrid = document.getElementById('bookmarksGrid');
const folderList = document.getElementById('folderList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const currentFolder = document.getElementById('currentFolder');
const bookmarksCount = document.getElementById('bookmarksCount');
const pagination = document.getElementById('pagination');

let currentBookmarks = [];
let allBookmarks = [];
let currentPage = 1;
const bookmarksPerPage = 12;
let currentFolderId = 'root';

document.addEventListener('DOMContentLoaded', () => {
  loadBookmarks();
  setupEventListeners();
  initDarkMode();
  renderFolderList();
  filterAndRenderBookmarks();
});

async function loadBookmarks() {
  showLoadingState();
  
  try {
    const jsonFile = await findBookmarkFile();
    if (!jsonFile) {
      throw new Error('No bookmark JSON file found');
    }
    
    const response = await fetch(jsonFile);
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonFile}`);
    }
    
    const data = await response.json();
    allBookmarks = extractBookmarks(data);
    currentBookmarks = [...allBookmarks];
    
    hideLoadingState();
    renderFolderList();
    filterAndRenderBookmarks();
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    hideLoadingState();
    showErrorState(error.message);
    
    // Fallback to sample data
    const sampleData = {
      "guid": "root________",
      "title": "",
      "index": 0,
      "dateAdded": 1607471488288000,
      "lastModified": 1753567213487000,
      "id": 1,
      "typeCode": 2,
      "type": "text/x-moz-place-container",
      "root": "placesRoot",
      "children": [
        {
          "guid": "menu________",
          "title": "menu",
          "index": 0,
          "dateAdded": 1607471488288000,
          "lastModified": 1607471488520000,
          "id": 2,
          "typeCode": 2,
          "type": "text/x-moz-place-container",
          "root": "bookmarksMenuFolder",
          "children": [
            {
              "guid": "uJ0-MNLUcspR",
              "title": "Mozilla Firefox",
              "index": 0,
              "dateAdded": 1607471488520000,
              "lastModified": 1607471488520000,
              "id": 7,
              "typeCode": 2,
              "type": "text/x-moz-place-container",
              "children": [
                {
                  "guid": "L6X2bw8335Oy",
                  "title": "Hilfe und Anleitungen",
                  "index": 0,
                  "dateAdded": 1607471488520000,
                  "lastModified": 1607471488520000,
                  "id": 8,
                  "typeCode": 1,
                  "iconUri": "fake-favicon-uri:https://support.mozilla.org/de/products/firefox",
                  "type": "text/x-moz-place",
                  "uri": "https://support.mozilla.org/de/products/firefox"
                }
              ]
            }
          ]
        }
      ]
    };
    allBookmarks = extractBookmarks(sampleData);
    currentBookmarks = [...allBookmarks];
    renderFolderList();
    filterAndRenderBookmarks();
  }
}

async function findBookmarkFile() {
  const commonNames = [
    'bookmarks.json',
    'bookmarks-export.json',
    'firefox-bookmarks.json',
    'chrome-bookmarks.json',
    'bookmarks-2025-07-27.json'
  ];
  
  for (const filename of commonNames) {
    try {
      const response = await fetch(filename, { method: 'HEAD' });
      if (response.ok) {
        return filename;
      }
    } catch (e) {
    }
  }
  
  try {
    const response = await fetch('bookmarks-2025-07-27.json', { method: 'HEAD' });
    if (response.ok) {
      return 'bookmarks-2025-07-27.json';
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

function extractBookmarks(node, path = []) {
  let bookmarks = [];
  
  if (node.children) {
    const folderPath = [...path, node.title];
    
    node.children.forEach(child => {
      if (child.typeCode === 1) {
        bookmarks.push({
          id: child.id,
          title: child.title,
          url: child.uri,
          favicon: child.iconUri || getDefaultFavicon(child.uri),
          dateAdded: child.dateAdded,
          folder: folderPath.join(' > ')
        });
      } else if (child.typeCode === 2) {
        bookmarks = bookmarks.concat(extractBookmarks(child, folderPath));
      }
    });
  }
  
  return bookmarks;
}

function getDefaultFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return 'https://via.placeholder.com/64x64?text=?';
  }
}

function setupEventListeners() {
  searchInput.addEventListener('input', filterAndRenderBookmarks);
  sortSelect.addEventListener('change', filterAndRenderBookmarks);
  darkModeToggle.addEventListener('click', toggleDarkMode);
}

function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  darkModeToggle.innerHTML = newTheme === 'dark' 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
}

function renderFolderList() {
  const folders = [...new Set(allBookmarks.map(b => b.folder))];
  
  folderList.innerHTML = `
    <li class="folder-item active" data-folder="root">
      <i class="fas fa-bookmark"></i> All Bookmarks
    </li>
  `;
  
  folders.forEach(folder => {
    if (folder) {
      const folderItem = document.createElement('li');
      folderItem.className = 'folder-item';
      folderItem.dataset.folder = folder;
      folderItem.innerHTML = `
        <i class="fas fa-folder"></i> ${folder}
      `;
      folderItem.addEventListener('click', () => {
        selectFolder(folder);
      });
      folderList.appendChild(folderItem);
    }
  });
  
  document.querySelectorAll('.folder-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.folder-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function selectFolder(folderId) {
  currentFolderId = folderId;
  currentFolder.textContent = folderId === 'root' ? 'All Bookmarks' : folderId;
  currentPage = 1;
  filterAndRenderBookmarks();
}

function filterAndRenderBookmarks() {
  const searchTerm = searchInput.value.toLowerCase();
  const sortBy = sortSelect.value;
  
  let filtered = allBookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm) || 
                          bookmark.url.toLowerCase().includes(searchTerm);
    
    const matchesFolder = currentFolderId === 'root' || 
                          bookmark.folder === currentFolderId;
    
    return matchesSearch && matchesFolder;
  });
  
  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else {
      return b.dateAdded - a.dateAdded;
    }
  });
  
  currentBookmarks = filtered;
  bookmarksCount.textContent = filtered.length;
  
  renderBookmarks();
  renderPagination();
}

function renderBookmarks() {
  const startIndex = (currentPage - 1) * bookmarksPerPage;
  const endIndex = startIndex + bookmarksPerPage;
  const bookmarksToShow = currentBookmarks.slice(startIndex, endIndex);
  
  bookmarksGrid.innerHTML = '';
  
  if (bookmarksToShow.length === 0) {
    bookmarksGrid.innerHTML = `
      <div class="no-bookmarks">
        <h3>No bookmarks found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    `;
    return;
  }
  
  bookmarksToShow.forEach(bookmark => {
    const bookmarkCard = document.createElement('div');
    bookmarkCard.className = 'bookmark-card';
    
    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'bookmark-favicon';
    
    const faviconImg = document.createElement('img');
    faviconImg.alt = bookmark.title;
    faviconImg.className = 'favicon-loading';
    
    preloadFavicon(bookmark.favicon)
      .then(validUrl => {
        faviconImg.src = validUrl;
        faviconImg.className = 'favicon-loaded';
      })
      .catch(() => {
        faviconImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI2Y1ZjVmNSIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjEiLz4KPHBhdGggZD0iTTMyIDIwTDM2IDI4TDMyIDM2TDI4IDI4TDMyIDIwWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K';
        faviconImg.className = 'favicon-fallback';
      });
    
    faviconContainer.appendChild(faviconImg);
    
    bookmarkCard.innerHTML = `
      <div class="bookmark-info">
        <h3 class="bookmark-title">${bookmark.title}</h3>
        <p class="bookmark-url">${formatUrl(bookmark.url)}</p>
        <div class="bookmark-meta">
          <span>${formatDate(bookmark.dateAdded)}</span>
          <div class="bookmark-actions">
            <button class="action-button" title="Open in new tab" onclick="window.open('${bookmark.url}', '_blank')">
              <i class="fas fa-external-link-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    bookmarkCard.insertBefore(faviconContainer, bookmarkCard.firstChild);
    bookmarksGrid.appendChild(bookmarkCard);
  });
}

function formatUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch (e) {
    return url;
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp / 1000);
  return date.toLocaleDateString();
}

function preloadFavicon(url) {
  return new Promise((resolve, reject) => {
    if (!url || url.includes('fake-favicon-uri') || url.includes('placeholder.com')) {
      reject(new Error('Invalid favicon URL'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Favicon failed to load'));
    img.src = url;
  });
}

function showLoadingState() {
  const bookmarksGrid = document.getElementById('bookmarksGrid');
  bookmarksGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading bookmarks...</p>
    </div>
  `;
}

function hideLoadingState() {
}

function showErrorState(message) {
  const bookmarksGrid = document.getElementById('bookmarksGrid');
  bookmarksGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Error Loading Bookmarks</h3>
      <p>${message}</p>
      <p>Using sample data instead.</p>
    </div>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(currentBookmarks.length / bookmarksPerPage);
  
  pagination.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  const prevButton = document.createElement('button');
  prevButton.className = `page-button ${currentPage === 1 ? 'disabled' : ''}`;
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderBookmarks();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  pagination.appendChild(prevButton);
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.className = `page-button ${i === currentPage ? 'active' : ''}`;
    pageButton.textContent = i;
    pageButton.addEventListener('click', () => {
      currentPage = i;
      renderBookmarks();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(pageButton);
  }
  
  const nextButton = document.createElement('button');
  nextButton.className = `page-button ${currentPage === totalPages ? 'disabled' : ''}`;
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderBookmarks();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  pagination.appendChild(nextButton);
}
