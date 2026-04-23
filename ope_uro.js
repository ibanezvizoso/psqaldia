/**
 * ope_uro.js - Gestión unificada de exámenes OPE Urología
 * Soporta múltiples convocatorias (2022, 2020) y Modo Snack combinado.
 * Estructura compatible con Worker v6.1 y CSS global de PSQ al día.
 */

let preguntasUro = [];
let respuestasUro = {};
let preguntasVisiblesUro = 20;
let añoUroActual = "";

/**
 * Pantalla inicial: Selector de convocatoria y modo Snack
 */
function openUroSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa- hospital-user fa-3x" style="color: #0ea5e9; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Urología</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenUro('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: #0ea5e9;"></i>
                </button>

                <button onclick="iniciarExamenUro('20')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2020</b>
                    <i class="fas fa-chevron-right" style="color: #0ea5e9;"></i>
                </button>

                <button onclick="iniciarExamenUro('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid #0ea5e9; background: rgba(14, 165, 233, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: #0ea5e9; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(Aleatorio 2020 + 2022)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: #0ea5e9;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/**
 * Persistencia: Guardar estado en LocalStorage
 */
function guardarEstadoUro() {
    const estado = {
        año: añoUroActual,
        preguntas: preguntasUro,
        respuestas: respuestasUro,
        visibles: preguntasVisiblesUro
    };
    localStorage.setItem('psq_save_uro', JSON.stringify(estado));
}

/**
 * Carga de datos desde el Worker
 */
async function iniciarExamenUro(año, esContinuacion = false) {
    if (!esContinuacion && localStorage.getItem('psq_save_uro')) {
        const data = JSON.parse(localStorage.getItem('psq_save_uro'));
        if (confirm(`Tienes un examen de Urología a medias. ¿Quieres continuarlo?`)) {
            añoUroActual = data.año;
            preguntasUro = data.preguntas;
            respuestasUro = data.respuestas;
            preguntasVisiblesUro = data.visibles;
            renderizarExamenUro();
            return;
        }
    }

    añoUroActual = año;
    preguntasVisiblesUro = 20;
    respuestasUro = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#0ea5e9;"></i><br><br><b>Cargando Urología...</b></div>`;

    try {
        let rows = [];

        if (año === 'snack') {
            // Carga paralela de ambas hojas para el Modo Snack
            const [res22, res20] = await Promise.all([
                fetch(`/?sheet=Ope_Uro22`),
                fetch(`/?sheet=Ope_Uro20`)
            ]);
            const data22 = await res22.json();
            const data20 = await res20.json();
            rows = [...(data22.values || []), ...(data20.values || [])];
        } else {
            // Carga individual
            const response = await fetch(`/?sheet=Ope_Uro${año}`);
            const data = await response.json();
            rows = data.values || [];
        }

        preguntasUro = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasUro = preguntasUro.sort(() => Math.random() - 0.5).slice(0, 10);
            preguntasVisiblesUro = 10;
        }

        renderizarExamenUro();
        guardarEstadoUro();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error al cargar datos: ${error.message}</div>`;
    }
}

function renderizarExamenUro() {
    const container = document.getElementById('modalData');
    let titulo = "";
    if (añoUroActual === 'snack') titulo = 'Snack Urología';
    else titulo = `OPE UROLOGÍA 20${añoUroActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#0ea5e9; font-size:1.6rem;">${titulo}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg-uro">${Math.min(preguntasVisiblesUro, preguntasUro.length)}</span> de ${preguntasUro.length}
                    </p>
                </div>
                <button onclick="openUroSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-uro">${generarBloqueUro(0, preguntasVisiblesUro)}</div>`;

    if (preguntasVisiblesUro < preguntasUro.length) {
        html += `<button id="btn-mas-uro" onclick="cargarMasUro()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS...</button>`;
    }

    html += `
            <div id="footer-uro" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenUro()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:#0ea5e9; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(14, 165, 233, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloqueUro(inicio, fin) {
    let bloqueHtml = '';
    preguntasUro.slice(inicio, fin).forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasUro[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-uro-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-uro-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasUro[${realIndex}] = '${letra}'; guardarEstadoUro();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualUro(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-uro-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #0ea5e9; border-radius:12px;">
                    <strong style="color:#0ea5e9; display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasUro() {
    const inicio = preguntasVisiblesUro;
    preguntasVisiblesUro = Math.min(preguntasVisiblesUro + 20, preguntasUro.length);
    document.getElementById('contenedor-preguntas-uro').insertAdjacentHTML('beforeend', generarBloqueUro(inicio, preguntasVisiblesUro));
    document.getElementById('cont-preg-uro').innerText = preguntasVisiblesUro;
    if (preguntasVisiblesUro >= preguntasUro.length) document.getElementById('btn-mas-uro').style.display = 'none';
    guardarEstadoUro();
}

function revelarIndividualUro(idx) {
    const fb = document.getElementById(`feedback-uro-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenUro() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasUro.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-uro-${idx}`);
        const feedback = document.getElementById(`feedback-uro-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasUro[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
            } else {
                fallosIndices.push(idx);
                bloque.style.borderColor = '#ef4444';
            }
        }
    });

    localStorage.removeItem('psq_save_uro');

    const footer = document.getElementById('footer-uro');
    if (fallosIndices.length > 0) {
        footer.innerHTML = `
            <button onclick="repasarFallosUro([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                REPASAR ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openUroSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                SALIR
            </button>`;
    } else {
        footer.innerHTML = `
            <button onclick="openUroSelector()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900;">
                ¡EXAMEN PERFECTO! VOLVER
            </button>`;
    }

    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasUro.length}`);
    // Scroll al inicio del modal para ver resultados
    const modalContent = document.querySelector('.modal-content');
    if(modalContent) modalContent.scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosUro(indices) {
    preguntasUro = indices.map(idx => preguntasUro[idx]);
    respuestasUro = {};
    preguntasVisiblesUro = preguntasUro.length;
    renderizarExamenUro();
}
