let spiaData = [];
let spiaSelected = new Set();

async function initSPIA() {
  // 1. Fetch de datos usando tu Worker habitual
  const data = await fetchData('SPI_A'); // Asumiendo que fetchData es tu función global
  
  // 2. Limpieza y mapeo (Saltamos fila 0 de cabeceras)
  spiaData = data.slice(1).map((row, i) => ({
    id: i,
    cat: row[0],     // Categoría (ES)
    sintoma: row[1],  // Síntoma (ES)
    desc: row[2],     // Descripción (ES)
    color: row[6]     // Color (G)
  }));

  renderSPIAFilters();
  renderSPIAGrid();
}

function renderSPIAFilters() {
  const container = document.getElementById('spia-categories');
  const cats = [...new Set(spiaData.map(d => d.cat))];
  
  container.innerHTML = `<button class="filter-btn active" onclick="filterSPIA('all', this)">Todos</button>`;
  
  cats.forEach(cat => {
    const color = spiaData.find(d => d.cat === cat).color;
    container.innerHTML += `<button class="filter-btn" style="border-color: ${color}" onclick="filterSPIA('${cat}', this)">${cat}</button>`;
  });
}

function renderSPIAGrid(filter = 'all') {
  const grid = document.getElementById('spia-grid');
  grid.innerHTML = '';

  const filtered = filter === 'all' ? spiaData : spiaData.filter(d => d.cat === filter);

  filtered.forEach(item => {
    const isSelected = spiaSelected.has(item.id);
    const card = document.createElement('div');
    card.className = `spia-card ${isSelected ? 'selected' : ''}`;
    card.style.borderTop = `6px solid ${item.color}`;
    if(isSelected) card.style.backgroundColor = item.color + '20'; // Color muy suave de fondo

    card.innerHTML = `
      <div onclick="toggleSPIA(${item.id})">
        <div class="card-cat">${item.cat}</div>
        <div class="card-title">${item.sintoma}</div>
        <div class="card-desc">${item.desc}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function toggleSPIA(id) {
  if(spiaSelected.has(id)) spiaSelected.delete(id);
  else spiaSelected.add(id);
  
  renderSPIAGrid(document.querySelector('.filter-btn.active').innerText === 'Todos' ? 'all' : document.querySelector('.filter-btn.active').innerText);
  updateSPIAReport();
}

function filterSPIA(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSPIAGrid(cat);
}

function updateSPIAReport() {
  const output = document.getElementById('spia-report');
  if(spiaSelected.size === 0) {
    output.innerText = "No hay síntomas seleccionados.";
    return;
  }

  const selectedItems = spiaData.filter(d => spiaSelected.has(d.id));
  const grouped = selectedItems.reduce((acc, curr) => {
    if(!acc[curr.cat]) acc[curr.cat] = [];
    acc[curr.cat].push(curr.sintoma);
    return acc;
  }, {});

  let report = "EXPLORACIÓN SPI-A (SÍNTOMAS BÁSICOS):\n";
  for (const [cat, symptoms] of Object.entries(grouped)) {
    report += `\n• ${cat.toUpperCase()}: ${symptoms.join(', ')}.`;
  }
  output.innerText = report;
}

function copySPIAReport() {
  const text = document.getElementById('spia-report').innerText;
  navigator.clipboard.writeText(text);
  // Aquí podrías disparar tu notificación de "Copiado" que uses en el proyecto
}
