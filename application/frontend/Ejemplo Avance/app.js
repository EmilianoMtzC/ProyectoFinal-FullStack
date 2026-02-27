// ========= CONFIGURACIÓN =========
const API_BASE = 'http://localhost:3000/api';

console.log('🎬 Iniciando Media Tracker...');
console.log('API BASE:', API_BASE);


// ========= NAVEGACIÓN =========
const moviesBtn = document.getElementById('movies');
const seriesBtn = document.getElementById('series');
const gamesBtn = document.getElementById('games');

const viewMovies = document.getElementById('view-movies');
const viewSeries = document.getElementById('view-series');
const viewGames = document.getElementById('view-games');

const navButtons = [moviesBtn, seriesBtn, gamesBtn];
const views = [viewMovies, viewSeries, viewGames];

function changeView(activeBtn, activeView) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));
    activeBtn.classList.add('active');
    activeView.classList.add('active');
}

moviesBtn.addEventListener('click', () => changeView(moviesBtn, viewMovies));
seriesBtn.addEventListener('click', () => changeView(seriesBtn, viewSeries));
gamesBtn.addEventListener('click', () => changeView(gamesBtn, viewGames));


// ========= MODAL AÑADIR =========
const modal = document.getElementById('add-movie-modal');
const addButtons = document.querySelectorAll('.add-btn');
const cancelBtn = document.getElementById('cancel');
const addBtn = document.getElementById('add');
const input = document.getElementById('item-input');
const dynamicFields = document.getElementById('dynamic-fields');
const modalTitle = document.getElementById('modal-title');

let context = { type: "", section: "" };

addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        modal.style.display = 'flex';
        input.focus();
        const sectionEl = e.target.closest('.section').id;
        const viewEl = e.target.closest('.view').id;
        context.type = viewEl.split('-')[1];
        context.section = sectionEl.includes('watchlist') ? 'watchlist' : 'seen';
        renderModalContent();
    });
});

function closeModal() {
    modal.style.display = 'none';
    input.value = '';
    dynamicFields.innerHTML = '';
}

cancelBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});


function renderModalContent() {
    const labels = { movies: "Película", series: "Serie", games: "Juego" };
    dynamicFields.innerHTML = '';

    if (context.section === 'watchlist') {
        modalTitle.textContent = `Agregar ${labels[context.type]} a por ver`;
        const reasonInput = document.createElement('input');
        reasonInput.id = 'reason-input';
        reasonInput.placeholder = 'Razón por ver';
        reasonInput.className = 'dynamic-input';
        dynamicFields.appendChild(reasonInput);
    }

    if (context.section === 'seen') {
        modalTitle.textContent = `Agregar ${labels[context.type]} a vistas`;
        const ratingWrapper = document.createElement('div');
        ratingWrapper.className = 'rating-wrapper';
        ratingWrapper.innerHTML = `
            <p>Calificación:</p>
            <label><input type="radio" name="rating" value="loved"> Me encantó</label>
            <label><input type="radio" name="rating" value="liked"> Me gustó</label>
            <label><input type="radio" name="rating" value="disliked"> No me gustó</label>
        `;
        dynamicFields.appendChild(ratingWrapper);
    }
}


// ========= MODAL MARCAR COMO VISTO =========
const markSeenModal = document.getElementById('mark-seen-modal');
const markSeenTitle = document.getElementById('mark-seen-title');
const markSeenAddBtn = document.getElementById('mark-seen-add');
const markSeenCancelBtn = document.getElementById('mark-seen-cancel');

let markSeenContext = { id: null, title: '', media_type: '' };

// Abrir modal marcar como visto
function openMarkSeenModal(item) {
    markSeenContext = { id: item.id, title: item.title, media_type: item.media_type };
    markSeenTitle.textContent = item.title;
    // Limpiar selección anterior
    document.querySelectorAll('input[name="mark-rating"]').forEach(r => r.checked = false);
    markSeenModal.style.display = 'flex';
}

markSeenCancelBtn.addEventListener('click', () => {
    markSeenModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === markSeenModal) markSeenModal.style.display = 'none';
});

// Marcar como visto
markSeenAddBtn.addEventListener('click', async () => {
    const ratingInput = document.querySelector('input[name="mark-rating"]:checked');
    if (!ratingInput) {
        alert('Por favor selecciona una calificación');
        return;
    }

    const rating = ratingInput.value;

    try {
        const res = await fetch(API_BASE + '/media/' + markSeenContext.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'seen',
                rating: rating
            })
        });

        if (res.ok) {
            markSeenModal.style.display = 'none';
            loadMediaItems();
        } else {
            alert('Error al actualizar');
        }
    } catch (err) {
        console.error('Error actualizando:', err);
        alert('Error conectando con el servidor');
    }
});


// ========= GUARDAR NUEVO =========
addBtn.addEventListener('click', async () => {
    const title = input.value.trim();
    if (!title) return;

    let status = context.section === 'watchlist' ? 'watchlist' : 'seen';
    let rating = null;
    let reason = null;

    if (context.section === 'watchlist') {
        const reasonInput = document.getElementById('reason-input');
        reason = reasonInput ? reasonInput.value.trim() : '';
    }

    if (context.section === 'seen') {
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        if (!ratingInput) { alert('Por favor selecciona una calificación'); return; }
        rating = ratingInput.value;
    }

    try {
        const res = await fetch(API_BASE + '/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, media_type: context.type, status, rating, reason })
        });

        if (res.ok) { closeModal(); loadMediaItems(); }
        else { alert('Error al guardar'); }
    } catch (err) {
        console.error('Error guardando:', err);
        alert('Error conectando con el servidor');
    }
});


// ========= ELIMINAR =========
async function deleteItem(id, title) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    
    try {
        const res = await fetch(API_BASE + '/media/' + id, { method: 'DELETE' });
        if (res.ok) { loadMediaItems(); }
        else { alert('Error al eliminar'); }
    } catch (err) {
        console.error('Error eliminando:', err);
        alert('Error conectando con el servidor');
    }
}


// ========= CARGAR Y RENDERIZAR =========
async function loadMediaItems() {
    console.log('📥 Cargando items...');
    
    try {
        const response = await fetch(API_BASE + '/media');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const items = await response.json();
        console.log('📦 Items recibidos:', items.length);
        
        document.querySelectorAll('.media-table tbody').forEach(tbody => {
            while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        });
        
        items.forEach((item, index) => {
            const success = renderItem(item, index);
            console.log(`  [${index + 1}] "${item.title}" -> ${success ? 'OK' : 'FALLO'}`);
        });
        
        const totalRows = document.querySelectorAll('.media-table tbody tr').length;
        console.log('✅ Total filas en DOM:', totalRows);
        
    } catch (err) {
        console.error('❌ Error cargando:', err);
    }
}

function renderItem(item, index) {
    const typeMap = { 'movie': 'movies', 'game': 'games', 'series': 'series' };
    const type = typeMap[item.media_type] || item.media_type;
    let tableId;

    if (item.status === 'watchlist') tableId = type + '-watchlist';
    else if (item.rating === 'loved') tableId = type + '-loved';
    else if (item.rating === 'liked') tableId = type + '-liked';
    else if (item.rating === 'disliked') tableId = type + '-disliked';
    else { return false; }

    const table = document.getElementById(tableId);
    if (!table) { console.warn(`[${index}] Tabla no encontrada: ${tableId}`); return false; }

    let tbody = table.querySelector('tbody');
    if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }

    const tr = document.createElement('tr');
    
    if (item.status === 'watchlist') {
        const td1 = document.createElement('td'); td1.textContent = item.title;
        const td2 = document.createElement('td'); td2.textContent = item.reason || '-';
        const td3 = document.createElement('td');
        
        // Botón marcar como visto
        const seenBtn = document.createElement('button');
        seenBtn.textContent = 'Visto';
        seenBtn.className = 'watch-btn';
        seenBtn.title = 'Marcar como visto';
        seenBtn.onclick = () => openMarkSeenModal(item);
        
        // Botón eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar️';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Eliminar';
        deleteBtn.onclick = () => deleteItem(item.id, item.title);
        
        td3.appendChild(seenBtn);
        td3.appendChild(deleteBtn);
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    } else {
        const td1 = document.createElement('td'); td1.textContent = item.title;
        const td2 = document.createElement('td');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar️️';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Eliminar';
        deleteBtn.onclick = () => deleteItem(item.id, item.title);
        
        td2.appendChild(deleteBtn);
        tr.appendChild(td1); tr.appendChild(td2);
    }

    tbody.appendChild(tr);
    return true;
}


// ========= INICIALIZAR =========
function init() {
    console.log('✅ DOM listo');
    loadMediaItems();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
