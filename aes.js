const WORKER_URL = "https://psqaldia.com"; 
let aesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('startDate').valueAsDate = new Date();
    try {
        const response = await fetch(`${WORKER_URL}/?sheet=AES`);
        const json = await response.json();
        aesData = json.values;
        populateDrugs();
    } catch (e) { console.error("Error cargando AES", e); }
});

function populateDrugs() {
    const select = document.getElementById('drugSelect');
    select.innerHTML = '<option value="">-- Seleccionar Fármaco --</option>';
    aesData.forEach((row, index) => {
        if (row[0]) {
            let opt = document.createElement('option');
            opt.value = index;
            opt.textContent = row[0];
            select.appendChild(opt);
        }
    });
}

document.getElementById('drugSelect').addEventListener('change', (e) => {
    const row = aesData[e.target.value];
    const targetSelect = document.getElementById('targetDose');
    targetSelect.innerHTML = '';
    
    // Cadencia: Pauta (i), Target (i+1), Intervalo (i+2)
    // Empezamos en i=1 (Columna B)
    for (let i = 1; i < row.length; i += 3) {
        const targetValue = row[i+1]; // Columna C, F, I, L...
        if (targetValue) {
            let opt = document.createElement('option');
            opt.value = i; // Guardamos el índice de la Pauta de ese escalón
            opt.textContent = `${targetValue} mg/día`;
            targetSelect.appendChild(opt);
        }
    }
    document.getElementById('targetDose').disabled = false;
    document.getElementById('btnGenerate').disabled = false;
});

function formatPauta(pautaStr) {
    // Asumiendo formato "Mañana-Mediodía-Noche" (ej: "25-0-50")
    const doses = pautaStr.split('-').map(d => d.trim());
    let result = [];
    if (doses[0] && doses[0] !== '0') result.push(`Mañana: ${doses[0]} mg`);
    if (doses[1] && doses[1] !== '0') result.push(`Mediodía: ${doses[1]} mg`);
    if (doses[2] && doses[2] !== '0') result.push(`Noche: ${doses[2]} mg`);
    return result.join(', ');
}

document.getElementById('btnGenerate').addEventListener('click', () => {
    const drugRow = aesData[document.getElementById('drugSelect').value];
    const targetIndex = parseInt(document.getElementById('targetDose').value);
    const startDate = new Date(document.getElementById('startDate').value);
    const container = document.getElementById('pautaResult');
    
    container.innerHTML = `<h3>Plan para ${drugRow[0]}</h3><hr>`;
    
    let daysAccumulated = 0;
    
    // Recorremos desde el primer escalón (i=1) hasta el seleccionado
    for (let i = 1; i <= targetIndex; i += 3) {
        const currentPauta = drugRow[i];
        const currentInterval = parseInt(drugRow[i+2]) || 0;
        
        const stepDate = new Date(startDate);
        stepDate.setDate(startDate.getDate() + daysAccumulated);
        
        const dateStr = stepDate.toLocaleDateString('es-ES', { 
            weekday: 'long', day: 'numeric', month: 'long' 
        });

        container.innerHTML += `
            <div class="card-pauta">
                <div class="step-date">Desde el ${dateStr}:</div>
                <div class="dose-detail">${formatPauta(currentPauta)}</div>
            </div>
        `;
        
        // Sumamos el intervalo para el siguiente paso
        daysAccumulated += currentInterval;
    }
});
