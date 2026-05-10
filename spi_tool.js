// Estado global de la herramienta
let allSymptoms = [];
let selectedItems = new Set();
let currentLang = 'ES'; // Toggle para ES/EN

/**
 * 1. CARGA Y FILTRADO DE DATOS
 * Lee del Worker y limpia las cabeceras
 */
async function initSPITool() {
    try {
        // Llamada a tu Worker pasando el nombre de la hoja
        const response = await fetch('TU_WORKER_URL?sheet=SPI_A');
        const rawData = await response.json();

        // IMPORTANTE: Saltamos la fila 0 (cabeceras)
        // Mapeamos los índices según tu captura de pantalla
        allSymptoms = rawData.slice(1).map((row, index) => ({
            id: `symp-${index}`,
            cat: { ES: row[0], EN: row[3] },
            name: { ES: row[1], EN: row[4] },
            desc: { ES: row[2], EN: row[5] },
            color: row[6] || '#f0f0f0' // Fallback si el color falla
        }));

        renderFilters();
        renderGrid();
    } catch (error) {
        console.error("Error cargando SPI-A:", error);
    }
}

/**
 * 2. RENDERIZADO DE FILTROS (Botones superiores)
 * Crea un botón por categoría única para filtrar visualmente
 */
function renderFilters() {
    const categories = [...new Set(allSymptoms.map(s => s.cat[currentLang]))];
    const filterContainer = document.getElementById('filter-bar');
    
    filterContainer.innerHTML = `<button class="filter-btn active" onclick="filterByCat('all')">Todos</button>`;
    
    categories.forEach(cat => {
        const color = allSymptoms.find(s => s.cat[currentLang] === cat).color;
        filterContainer.innerHTML += `
            <button class="filter-btn" 
                    style="border-bottom: 4px solid ${color}" 
                    onclick="filterByCat('${cat}')">
                ${cat}
            </button>`;
    });
}

/**
 * 3. RENDERIZADO DEL GRID (Las Tarjetas)
 */
function renderGrid(filter = 'all') {
    const grid = document.getElementById('symptom-grid');
    grid.innerHTML = '';

    const itemsToDisplay = filter === 'all' 
        ? allSymptoms 
        : allSymptoms.filter(s => s.cat[currentLang] === filter);

    itemsToDisplay.forEach(item => {
        const isSelected = selectedItems.has(item.id);
        const card = document.createElement('div');
        card.className = `symptom-card ${isSelected ? 'active' : ''}`;
        card.style.borderColor = item.color;
        
        // Si está activa, le ponemos el fondo del color pastel del Sheet
        if (isSelected) card.style.backgroundColor = item.color;

        card.innerHTML = `
            <div class="card-content" onclick="toggleSymptom('${item.id}')">
                <span class="cat-label">${item.cat[currentLang]}</span>
                <h3>${item.name[currentLang]}</h3>
                <p class="desc-text">${item.desc[currentLang]}</p>
            </div>
            <div class="info-icon" title="${item.desc[currentLang]}">ⓘ</div>
        `;
        grid.appendChild(card);
    });
}

/**
 * 4. LÓGICA DE INTERACCIÓN
 */
function toggleSymptom(id) {
    if (selectedItems.has(id)) {
        selectedItems.delete(id);
    } else {
        selectedItems.add(id);
    }
    renderGrid(); // Re-renderizamos para aplicar colores
    updateSummary();
}

/**
 * 5. RESUMEN PARA HISTORIA CLÍNICA (Utilidad real)
 * Genera un texto limpio para copiar y pegar
 */
function updateSummary() {
    const summaryBox = document.getElementById('summary-output');
    if (selectedItems.size === 0) {
        summaryBox.innerHTML = "No hay síntomas seleccionados.";
        return;
    }

    const selectedData = allSymptoms.filter(s => selectedItems.has(s.id));
    
    // Agrupamos por categoría para el texto final
    const grouped = selectedData.reduce((acc, curr) => {
        const cat = curr.cat[currentLang];
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr.name[currentLang]);
        return acc;
    }, {});

    let text = "SÍNTOMAS BÁSICOS DETECTADOS (SPI-A):\n";
    for (const cat in grouped) {
        text += `- ${cat}: ${grouped[cat].join(', ')}.\n`;
    }
    
    summaryBox.innerText = text;
}
