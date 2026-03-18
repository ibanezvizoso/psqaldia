/**
 * ope_ped.js - Gestión de exámenes OPE Pediatría
 */
let preguntasPed = [];
let respuestasPed = {};
let preguntasVisiblesPed = 20;
let añoPedActual = "";

function openPedSelector() {
    const modalData = document.getElementById('modalData');
    if (document.getElementById('modal')) document.getElementById('modal').style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-baby fa-3x" style="color: #ef4444; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Pediatría</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenPed('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: #ef4444;"></i>
                </button>

                <button onclick="iniciarExamenPed('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: #ef4444; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: #ef4444;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

async function iniciarExamenPed(año) {
    añoPedActual = año;
    preguntasVisiblesPed = 20;
    respuestasPed = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#ef4444;"></i><br><br><b>Cargando Pediatría...</b></div>`;

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=Ope_Ped${año === 'snack' ? '22' : año}`);
        const data = await response.json();
        const rows = data.values || [];

        preguntasPed = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "Sin explicación.").trim()
            }));

        if (año === 'snack') preguntasPed = preguntasPed.sort(() => Math.random() - 0.5).slice(0, 10);

        renderizarExamenPed();
    } catch (e) { modalData.innerHTML = `Error: ${e.message}`; }
}

function renderizarExamenPed() {
    const container = document.getElementById('modalData');
    container.innerHTML = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <h2 style="margin:0; font-weight:900; color:#ef4444;">OPE PEDIATRÍA</h2>
                <button onclick="openPedSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>
            <div id="contenedor-preguntas-ped">${generarBloquePed(0, preguntasPed.length)}</div>
            <button onclick="corregirExamenPed()" class="btn btn-primary" style="width:100%; height:55px; border-radius:15px; background:#ef4444;">FINALIZAR</button>
        </div>`;
}

function generarBloquePed(inicio, fin) {
    return preguntasPed.slice(inicio, fin).map((p, i) => `
        <div id="bloque-ped-${i}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
            <p style="font-weight:700;">${p.pregunta}</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${['A','B','C','D'].map((l, idx) => `
                    <label style="padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; display:block;">
                        <input type="radio" name="preg-ped-${i}" value="${l}" onclick="respuestasPed[${i}] = '${l}'"> ${p.opciones[idx]}
                    </label>`).join('')}
            </div>
            <div id="fb-ped-${i}" style="display:none; margin-top:1rem; padding:1rem; border-radius:12px; background:var(--card); border-left:4px solid #ef4444;">
                <b>Correcta: ${p.correcta}</b><br>${p.explicacion}
            </div>
        </div>`).join('');
}

function corregirExamenPed() {
    preguntasPed.forEach((p, i) => {
        const fb = document.getElementById(`fb-ped-${i}`);
        if (fb) fb.style.display = 'block';
    });
    alert("Examen corregido. Revisa las respuestas.");
}
