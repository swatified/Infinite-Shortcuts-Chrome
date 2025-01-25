loadShortcuts();
document.getElementById('addButton').addEventListener('click', showModal);
document.getElementById('saveButton').addEventListener('click', addShortcut);
document.getElementById('cancelButton').addEventListener('click', hideModal);

function showModal() {
   document.getElementById('shortcutModal').style.display = 'block';
}

function hideModal() {
   document.getElementById('shortcutModal').style.display = 'none';
   document.getElementById('shortcutName').value = '';
   document.getElementById('shortcutUrl').value = '';
}

function addShortcut() {
   const name = document.getElementById('shortcutName').value;
   const url = document.getElementById('shortcutUrl').value;
   
   if (!name || !url) return;

   const shortcut = createShortcut(name, url);
   document.getElementById('shortcuts').appendChild(shortcut);
   
   saveShortcuts();
   hideModal();
}

function createShortcut(name, url) {
    const shortcut = document.createElement('div');
    shortcut.className = 'shortcut';
    shortcut.draggable = true;
    
    // Add https:// if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(fullUrl).hostname;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    shortcut.innerHTML = `
        <img src="${faviconUrl}" alt="${name}" data-url="${fullUrl}">
        <span data-url="${fullUrl}">${name}</span>
    `;
    
    shortcut.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', name);
    });
 
    shortcut.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });
 
    shortcut.addEventListener('click', (e) => {
        e.preventDefault();
        const clickedElement = e.target;
        const targetUrl = clickedElement.dataset.url || clickedElement.querySelector('[data-url]').dataset.url;
        window.location.href = targetUrl;
    });
 
    return shortcut;
 }

const shortcuts = document.getElementById('shortcuts');

shortcuts.addEventListener('dragover', (e) => {
   e.preventDefault();
   const dragging = document.querySelector('.dragging');
   const afterElement = getDragAfterElement(shortcuts, e.clientY);
   
   if (afterElement) {
       shortcuts.insertBefore(dragging, afterElement);
   } else {
       shortcuts.appendChild(dragging);
   }
});

function getDragAfterElement(container, y) {
   const draggableElements = [...container.querySelectorAll('.shortcut:not(.dragging)')];
   
   return draggableElements.reduce((closest, child) => {
       const box = child.getBoundingClientRect();
       const offset = y - box.top - box.height / 2;
       
       if (offset < 0 && offset > closest.offset) {
           return { offset: offset, element: child };
       } else {
           return closest;
       }
   }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveShortcuts() {
   const shortcuts = Array.from(document.querySelectorAll('.shortcut')).map(s => ({
       name: s.querySelector('span').textContent,
       url: s.querySelector('[data-url]').dataset.url
   }));
   localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
}

function loadShortcuts() {
   const saved = localStorage.getItem('shortcuts');
   if (saved) {
       JSON.parse(saved).forEach(({name, url}) => {
           document.getElementById('shortcuts').appendChild(
               createShortcut(name, url)
           );
       });
   }
}

shortcuts.addEventListener('dragend', saveShortcuts);