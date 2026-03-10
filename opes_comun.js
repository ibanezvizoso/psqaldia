// opes_comun.js - Gestión de OPE Común con Selector, Persistencia y Modo Snack
// Variables renombradas para evitar conflictos con otros scripts (PSQ)
let preguntasComun = []; 
let respuestasComun = {}; 
let añoComunActual = ""; 

/**
 * Pantalla inicial: Selector de año y Modo Snack
 */
function openExamenComunSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-book fa-3x" style="color: var(--primary); margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Común</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria (Galicia)</p>
            </div>
            
            <div style="display: grid; gap: 12px;">
                <button onclick="iniciarExamenComun('2022')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamenComun('2020')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: var(--primary);"></i>
                </button>

                <button onclick="iniciarExamenComun('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--primary); background: rgba(var(--primary-rgb), 0.1); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: var(--primary); font-size: 1.1rem;">Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(Pequeño repaso de 5 preguntas aleatorias)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: var(--primary);"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Persistencia: Guardar y Cargar estado local
 */
function guardarEstadoComun() {
    const estado = {
        año: añoComunActual,
        preguntas: preguntasComun,
        respuestas: respuestasComun
    };
    localStorage.setItem('psq_save_comun', JSON.stringify(estado));
}

/**
 * Carga de datos unificada (Filtra por Columna H)
 */
async function iniciarExamenComun(año, esContinuacion = false) {
    // Verificar si hay algo guardado antes de empezar de cero
    if (!esContinuacion && localStorage.getItem('psq_save_comun')) {
        const data = JSON.parse(localStorage.getItem('psq_save_comun'));
        const nombreModo = data.año === 'snack' ? 'Snack' : `Común ${data.año}`;
        if (confirm(`Tienes un examen (${nombreModo}) a medias. ¿Quieres continuarlo?`)) {
            const save = JSON.parse(localStorage.getItem('psq_save_comun'));
            añoComunActual = save.año;
            preguntasComun = save.preguntas;
            respuestasComun = save.respuestas;
            renderizarExamenComun();
            return;
        }
    }

    añoComunActual = año;
    respuestasComun = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Cargando OPE Común...</b></div>`;

    try {
        const url = `${window.WORKER_URL}?sheet=Ope_Comun`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error || !data.values) throw new Error("No se pudo acceder a la hoja Ope_Comun");

        // Mapeo (Columna H es row[7])
        let todasLasPreguntas = data.values
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim(),
                añoRow: (row[7] || "").trim() // Columna H (Año)
            }));

        if (año === 'snack') {
            // Modo Snack: 5 aleatorias de toda la hoja
            preguntasComun = todasLasPreguntas.sort(() => Math.random() - 0.5).slice(0, 5);
        } else {
            // Modo Convocatoria: Filtrar por año exacto
            preguntasComun = todasLasPreguntas.filter(p => p.añoRow === año);
        }

        if (preguntasComun.length === 0) throw new Error(`No se encontraron preguntas para: ${año}`);

        renderizarExamenComun();
        guardarEstadoComun();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-main);">
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
            Error al cargar examen.<br><small style="color:var(--text-muted);">${error.message}</small>
        </div>`;
    }
}

function renderizarExamenComun() {
    const container = document.getElementById('modalData');
    const titulo = añoComunActual === 'snack' ? 'Modo Snack Común' : `OPE COMÚN ${añoComunActual}`;

    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1rem;">
                <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.4rem;">${titulo}</h2>
                <button onclick="openExamenComunSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-times"></i> SALIR
                </button>
            </div>
            <div id="contenedor-preguntas-comun">`;

    preguntasComun.forEach((p, index) => {
        const resPrevia = respuestasComun[index] || "";
        html += `
            <div id="bloque-comun-${index}" style="margin-bottom:2rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border); transition: 0.3s;">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, i) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-comun-${index}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} 
                                onclick="respuestasComun[${index}] = '${letra}'; guardarEstadoComun();">
                            <span style="font-size:0.95rem;">${p.opciones[i]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualComun(${index})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:5px;">
                    <i class="fas fa-lightbulb"></i> Ver explicación
                </button>
                <div id="feedback-comun-${index}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem; color:var(--text-main);">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px; font-weight:900;">CORRECTA: ${p.correcta}</strong>
                    <div style="opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });

    html += `
            <div id="footer-comun" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenComun()" class="btn btn-primary" style="flex:1; height:60px; border-radius:18px; font-size:1.1rem; font-weight:900; box-shadow: 0 10px 15px -3px rgba(67, 56, 202, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function revelarIndividualComun(idx) {
    const fb = document.getElementById(`feedback-comun-${idx}`);
    fb.style.display = (fb.style.display === 'none') ? 'block' : 'none';
}

function corregirExamenComun() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasComun.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-comun-${idx}`);
        const feedback = document.getElementById(`feedback-comun-${idx}`);
        feedback.style.display = 'block';

        if (respuestasComun[idx] === p.correcta) {
            aciertos++;
            bloque.style.borderColor = '#22c55e';
            bloque.style.background = 'rgba(34, 197, 94, 0.05)';
        } else {
            fallosIndices.push(idx);
            bloque.style.borderColor = '#ef4444';
            bloque.style.background = 'rgba(239, 68, 68, 0.05)';
        }
    });

    // Limpiar persistencia ya que el examen ha sido corregido
    localStorage.removeItem('psq_save_comun');

    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-comun');
        footer.innerHTML = `
            <button onclick="repasarFallosComun([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:60px; border-radius:18px; font-weight:900;">
                REPASAR LOS ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openExamenComunSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:60px; border-radius:18px; font-weight:900;">
                SALIR
            </button>`;
    }
    
    alert(`Has completado el examen común.\n\nAciertos: ${aciertos} de ${preguntasComun.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosComun(indices) {
    const nuevasPreguntas = indices.map(idx => preguntasComun[idx]);
    preguntasComun = nuevasPreguntas;
    respuestasComun = {};
    añoComunActual = `${añoComunActual} (Fallos)`;
    renderizarExamenComun();
}
