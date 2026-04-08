/**
 * ope_cardio.js - Gestión unificada de exámenes OPE Cardiología
 * Incluye: Selector, Modo Snack, Ver explicación, Persistencia y Fallos.
 */
let preguntasCar = [];
let respuestasCar = {};
let preguntasVisiblesCar = 20;
let añoCarActual = "";

/**
 * Pantalla inicial: Selector de convocatoria y modo Snack
 */
function openCarSelector() {
    const modalData = document.getElementById('modalData');
    const modal = document.getElementById('modal');
    
    if (modal) modal.style.display = 'flex';

    modalData.innerHTML = `
        <div style="padding: 2.5rem 1.5rem; text-align: center; max-width: 500px; margin: auto;">
            <div style="margin-bottom: 2.5rem;">
                <i class="fas fa-heartbeat fa-3x" style="color: #b91c1c; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); font-weight: 900; margin: 0; font-size: 1.8rem;">OPE Cardiología</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Selecciona la convocatoria para comenzar</p>
            </div>
            
            <div style="display: grid; gap: 12px; margin-bottom: 2rem;">
                <button onclick="iniciarExamenCar('22')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <b style="color: var(--text-main); font-size: 1.1rem;">Convocatoria 2022</b>
                    <i class="fas fa-chevron-right" style="color: #b91c1c;"></i>
                </button>

                <button onclick="iniciarExamenCar('snack')" style="padding: 1.2rem; border-radius: 20px; border: 2px solid #b91c1c; background: rgba(185, 28, 28, 0.1); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; text-align: left; width: 100%;">
                    <div>
                        <b style="color: #b91c1c; font-size: 1.1rem;">Modo Snack</b>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">(10 preguntas aleatorias)</small>
                    </div>
                    <i class="fas fa-bolt" style="color: #b91c1c;"></i>
                </button>
            </div>

            <button onclick="abrirPortalExamenes()" style="background: none; border: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.8rem; letter-spacing: 1px;">
                <i class="fas fa-arrow-left"></i> VOLVER AL PORTAL
            </button>
        </div>
    `;
}

/**
 * Persistencia: Guardar estado
 */
function guardarEstadoCar() {
    const estado = {
        año: añoCarActual,
        preguntas: preguntasCar,
        respuestas: respuestasCar,
        visibles: preguntasVisiblesCar
    };
    localStorage.setItem('psq_save_car', JSON.stringify(estado));
}

/**
 * Carga de datos
 */
async function iniciarExamenCar(año, esContinuacion = false) {
    if (!esContinuacion && localStorage.getItem('psq_save_car')) {
        const data = JSON.parse(localStorage.getItem('psq_save_car'));
        if (confirm(`Tienes un examen de Cardiología a medias. ¿Quieres continuarlo?`)) {
            añoCarActual = data.año;
            preguntasCar = data.preguntas;
            respuestasCar = data.respuestas;
            preguntasVisiblesCar = data.visibles;
            renderizarExamenCar();
            return;
        }
    }

    añoCarActual = año;
    preguntasVisiblesCar = 20;
    respuestasCar = {};
    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#b91c1c;"></i><br><br><b>Cargando Cardiología...</b></div>`;

    try {
        // Carga la hoja Ope_Car22 (si es snack usa la misma como base)
        const response = await fetch(`/?sheet=Ope_Car${año === 'snack' ? '22' : año}`);
        const data = await response.json();
        const rows = data.values || [];

        preguntasCar = rows
            .filter(row => row[0] && row[0].trim() !== "")
            .map(row => ({
                pregunta: (row[0] || "").trim(),
                opciones: [(row[1] || "").trim(), (row[2] || "").trim(), (row[3] || "").trim(), (row[4] || "").trim()],
                correcta: (row[5] || "").trim().toUpperCase(),
                explicacion: (row[6] || "No hay explicación disponible.").trim()
            }));

        if (año === 'snack') {
            preguntasCar = preguntasCar.sort(() => Math.random() - 0.5).slice(0, 10);
            preguntasVisiblesCar = 10;
        }

        renderizarExamenCar();
        guardarEstadoCar();
    } catch (error) {
        modalData.innerHTML = `<div style="padding:2rem; text-align:center;">Error: ${error.message}</div>`;
    }
}

function renderizarExamenCar() {
    const container = document.getElementById('modalData');
    const titulo = añoCarActual === 'snack' ? 'Snack Cardiología' : `OPE CARDIOLOGÍA 20${añoCarActual}`;
    
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-weight:900; color:#b91c1c; font-size:1.6rem;">${titulo}</h2>
                    <p style="margin:5px 0 0; font-size:0.75rem; color:var(--text-muted);">
                        Cargadas <span id="cont-preg-car">${Math.min(preguntasVisiblesCar, preguntasCar.length)}</span> de ${preguntasCar.length}
                    </p>
                </div>
                <button onclick="openCarSelector()" style="background:var(--card); border:1px solid var(--border); color:var(--text-muted); padding:8px 12px; border-radius:10px; cursor:pointer; font-size:0.75rem; font-weight:800;">
                    <i class="fas fa-undo"></i> SALIR
                </button>
            </div>

            <div id="contenedor-preguntas-car">${generarBloqueCar(0, preguntasVisiblesCar)}</div>`;

    if (preguntasVisiblesCar < preguntasCar.length) {
        html += `<button id="btn-mas-car" onclick="cargarMasCar()" style="width:100%; padding:1rem; margin-bottom:2rem; border-radius:15px; border:2px dashed var(--border); background:none; color:var(--text-muted); font-weight:800; cursor:pointer;">CARGAR MÁS...</button>`;
    }

    html += `
            <div id="footer-car" style="position:sticky; bottom:10px; z-index:100; display:flex; gap:10px;">
                <button onclick="corregirExamenCar()" class="btn btn-primary" style="flex:1; height:55px; border-radius:15px; font-weight:900; background:#b91c1c; border:none; color:white; cursor:pointer; box-shadow: 0 5px 15px rgba(185, 28, 28, 0.3);">
                    FINALIZAR Y CORREGIR
                </button>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function generarBloqueCar(inicio, fin) {
    let bloqueHtml = '';
    preguntasCar.slice(inicio, fin).forEach((p, i) => {
        const realIndex = inicio + i;
        const resPrevia = respuestasCar[realIndex] || "";
        bloqueHtml += `
            <div id="bloque-car-${realIndex}" style="margin-bottom:2.5rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border);">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, idx) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text-main);">
                            <input type="radio" name="preg-car-${realIndex}" value="${letra}" ${resPrevia === letra ? 'checked' : ''} onclick="respuestasCar[${realIndex}] = '${letra}'; guardarEstadoCar();">
                            <span style="font-size:0.95rem;">${p.opciones[idx]}</span>
                        </label>
                    `).join('')}
                </div>
                <button onclick="revelarIndividualCar(${realIndex})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; cursor:pointer;"><i class="fas fa-lightbulb"></i> Ver explicación</button>
                <div id="feedback-car-${realIndex}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid #b91c1c; border-radius:12px;">
                    <strong style="color:#b91c1c; display:block; margin-bottom:8px;">CORRECTA: ${p.correcta}</strong>
                    <div style="font-size:0.9rem; opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });
    return bloqueHtml;
}

function cargarMasCar() {
    const inicio = preguntasVisiblesCar;
    preguntasVisiblesCar = Math.min(preguntasVisiblesCar + 20, preguntasCar.length);
    document.getElementById('contenedor-preguntas-car').insertAdjacentHTML('beforeend', generarBloqueCar(inicio, preguntasVisiblesCar));
    document.getElementById('cont-preg-car').innerText = preguntasVisiblesCar;
    if (preguntasVisiblesCar >= preguntasCar.length) document.getElementById('btn-mas-car').style.display = 'none';
    guardarEstadoCar();
}

function revelarIndividualCar(idx) {
    const fb = document.getElementById(`feedback-car-${idx}`);
    if (fb) fb.style.display = (fb.style.display === 'none' || fb.style.display === '') ? 'block' : 'none';
}

function corregirExamenCar() {
    let aciertos = 0;
    let fallosIndices = [];

    preguntasCar.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-car-${idx}`);
        const feedback = document.getElementById(`feedback-car-${idx}`);
        if (bloque && feedback) {
            feedback.style.display = 'block';
            if (respuestasCar[idx] === p.correcta) {
                aciertos++;
                bloque.style.borderColor = '#22c55e';
            } else {
                fallosIndices.push(idx);
                bloque.style.borderColor = '#ef4444';
            }
        }
    });

    localStorage.removeItem('psq_save_car');

    if (fallosIndices.length > 0) {
        const footer = document.getElementById('footer-car');
        footer.innerHTML = `
            <button onclick="repasarFallosCar([${fallosIndices}])" class="btn" style="flex:1; background:#ef4444; color:white; height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                REPASAR ${fallosIndices.length} FALLOS
            </button>
            <button onclick="openCarSelector()" class="btn" style="flex:1; background:var(--border); color:var(--text-main); height:55px; border-radius:15px; font-weight:900; border:none; cursor:pointer;">
                SALIR
            </button>`;
    }

    alert(`Examen finalizado.\nAciertos: ${aciertos} de ${preguntasCar.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}

function repasarFallosCar(indices) {
    preguntasCar = indices.map(idx => preguntasCar[idx]);
    respuestasCar = {};
    preguntasVisiblesCar = preguntasCar.length;
    renderizarExamenCar();
}
