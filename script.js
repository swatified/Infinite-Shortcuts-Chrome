loadShortcuts();

    // Delete zone functionality
    const deleteZone = document.getElementById('deleteZone');

    deleteZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        deleteZone.classList.add('dragover');
    });

    deleteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        deleteZone.classList.add('dragover');
    });

    deleteZone.addEventListener('dragleave', () => {
        deleteZone.classList.remove('dragover');
    });

    deleteZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            draggingElement.remove();
            saveShortcuts();
        }
        deleteZone.classList.remove('dragover');
    });

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
        const shortcutElement = document.createElement('div');
        shortcutElement.className = 'shortcut';
        shortcutElement.draggable = true;
        
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const domain = new URL(fullUrl).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
     
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = name;
        img.dataset.url = fullUrl;
        img.draggable = false; // Prevent image dragging
     
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.dataset.url = fullUrl;
        nameSpan.draggable = false; // Prevent text dragging
     
        shortcutElement.appendChild(img);
        shortcutElement.appendChild(nameSpan);
     
        shortcutElement.addEventListener('dragstart', (e) => {
            if (e.target !== shortcutElement) {
                e.preventDefault();
                return;
            }
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', name);
        });
     
        shortcutElement.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            setTimeout(saveShortcuts, 50);
        });
     
        shortcutElement.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedElement = e.target;
            const targetUrl = clickedElement.dataset.url || clickedElement.querySelector('[data-url]').dataset.url;
            window.location.href = targetUrl;
        });
     
        return shortcutElement;
    }
    
    const shortcuts = document.getElementById('shortcuts');

    function getGridPosition(container, x, y) {
        const gridItemWidth = 84; // 60px + 24px gap
        const gridItemHeight = 80; // Approximate height including gap
        
        const rect = container.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;
        
        const col = Math.floor(relativeX / gridItemWidth);
        const row = Math.floor(relativeY / gridItemHeight);
        
        return { col, row };
    }
    
    shortcuts.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
    
        const rect = shortcuts.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gridWidth = rect.width / 12;
        const gridHeight = 80; // Height of each grid cell including gap
        
        const gridCol = Math.floor(x / gridWidth);
        const gridRow = Math.floor(y / gridHeight);
        const position = gridRow * 12 + gridCol;
        
        const totalCells = Math.max(position + 1, shortcuts.children.length);
        const rowsNeeded = Math.ceil(totalCells / 12);
        
        // Ensure we have enough rows
        while (shortcuts.children.length < rowsNeeded * 12) {
            const placeholder = document.createElement('div');
            placeholder.style.visibility = 'hidden';
            shortcuts.appendChild(placeholder);
        }
        
        if (position >= 0 && position < shortcuts.children.length) {
            shortcuts.insertBefore(dragging, shortcuts.children[position]);
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
        const shortcutElements = Array.from(document.querySelectorAll('.shortcut'));
        const shortcuts = shortcutElements.map((shortcut, index) => {
            const gridInfo = calculateGridPosition(shortcut);
            return {
                name: shortcut.querySelector('span').textContent,
                url: shortcut.querySelector('[data-url]').dataset.url,
                position: index,
                gridX: gridInfo.gridX,
                gridY: gridInfo.gridY
            };
        });
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    }
    
    function calculateGridPosition(element) {
        const container = document.getElementById('shortcuts');
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const gridX = Math.floor((elementRect.left - containerRect.left) / (containerRect.width / 12));
        const gridY = Math.floor((elementRect.top - containerRect.top) / 80);
        return { gridX, gridY };
    }
    
    function loadShortcuts() {
        const saved = localStorage.getItem('shortcuts');
        if (saved) {
            const shortcuts = JSON.parse(saved);
            const container = document.getElementById('shortcuts');
            container.innerHTML = '';
    
            // Create grid with placeholders
            const maxY = Math.max(...shortcuts.map(s => s.gridY), 0) + 1;
            for (let i = 0; i < maxY * 12; i++) {
                const placeholder = document.createElement('div');
                placeholder.style.visibility = 'hidden';
                container.appendChild(placeholder);
            }
    
            // Place shortcuts in correct positions
            shortcuts.forEach(({name, url, gridX, gridY}) => {
                const position = (gridY * 12) + gridX;
                const shortcut = createShortcut(name, url);
                
                if (position >= 0 && position < container.children.length) {
                    container.insertBefore(shortcut, container.children[position]);
                    if (container.children[position + 1] && container.children[position + 1].style.visibility === 'hidden') {
                        container.children[position + 1].remove();
                    }
                } else {
                    container.appendChild(shortcut);
                }
            });
        }
    }

    shortcuts.addEventListener('dragend', saveShortcuts);