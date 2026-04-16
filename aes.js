/**
 * aes.js - Motor de Antiepilépticos PSQALDÍA
 */
let aesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('startDate').valueAsDate = new Date();
    
    try {
        // Buscamos en la pestaña "AES" a través de tu Worker
        const res = await fetch('https://psqaldia.com/?sheet=AES');
        const json = await res.json();
        aesData = json.values;
        
        const select = document.getElementById('drugSelect');
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        
        aesData.forEach((row, i) => {
            if(row[0]) {
                let opt = document.createElement('option');
                opt.value = i;
                opt.textContent = row[0];
                select.appendChild(opt);
            }
        });
    } catch (e) {
        console.error("Error cargando Sheets", e);
    }
});

document.getElementById('drugSelect').addEventListener('change', (e) => {
    const row = aesData[e.target.value];
    const targetSelect = document.getElementById('targetDose');
    targetSelect.innerHTML = '';
    
    if(!row) return;

    // Cadencia: Pauta (i), Target (i+1), Intervalo (i+2)
    // Saltos de 3 en 3 desde columna B (índice 1)
    for (let i = 1; i < row.length; i += 3) {
        const targetValue = row[i+1];
        if (targetValue && targetValue.trim() !== "") {
            let opt = document.createElement('option');
            opt.value = i; 
            opt.textContent = `${targetValue} mg/día`;
            targetSelect.appendChild(opt);
        }
    }
    targetSelect.disabled = false;
    document.getElementById('btnGenerate').disabled = false;
});

function formatDoseText(pauta) {
    // Formato esperado en Sheets: "Mañana-Mediodía-Noche" (ej: "25-0-50")
    const doses = pauta.split('-').map(d => d.trim());
    let parts = [];
    if(doses[0] && doses[0] !== '0') parts.push(`Mañana: ${doses[0]} mg`);
    if(doses[1] && doses[1] !== '0') parts.push(`Mediodía: ${doses[1]} mg`);
    if(doses[2] && doses[2] !== '0') parts.push(`Noche: ${doses[2]} mg`);
    return parts.length > 0 ? parts.join(', ') : "0 mg";
}

document.getElementById('btnGenerate').addEventListener('click', () => {
    const drugRow = aesData[document.getElementById('drugSelect').value];
    const targetIdx = parseInt(document.getElementById('targetDose').value);
    const startDate = new Date(document.getElementById('startDate').value);
    const results = document.getElementById('results');
    
    results.innerHTML = `<h2 style="font-size: 1.2rem; margin-bottom: 1rem;">Plan: ${drugRow[0]}</h2>`;
    
    let daysDiff = 0;
    
    // Iteramos por los escalones hasta llegar al seleccionado
    for (let i = 1; i <= targetIdx; i += 3) {
        const pauta = drugRow[i];
        const intervalo = parseInt(drugRow[i+2]) || 0;
        
        const currentLineDate = new Date(startDate);
        currentLineDate.setDate(startDate.getDate() + daysDiff);
        
        const dateString = currentLineDate.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        results.innerHTML += `
            <div class="step-card">
                <div class="step-date">A partir del ${dateString}</div>
                <div class="step-doses">${formatDoseText(pauta)}</div>
            </div>
        `;
        
        daysDiff += intervalo;
    }
});
