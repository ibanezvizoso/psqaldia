// ope22_comun.js
let preguntasExamen = [];
let respuestasUsuario = {};

async function openExamenUI() {
    // Rango ampliado para que no se corte si añades preguntas
    const RANGO = 'Ope_Comun22!A2:G100'; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGO}?key=${API_KEY}`;

    const modalData = document.getElementById('modalData');
    modalData.innerHTML = `<div style="padding:3rem; text-align:center;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--primary);"></i><br><br><b style="color:var(--text-main);">Cargando OPE 22...</b></div>`;
    document.getElementById('modal').style.display = 'flex';

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) throw new Error("No hay datos");

        // Mapeo con protección contra celdas vacías
        preguntasExamen = data.values.map(row => ({
            pregunta: row[0] || "Pregunta sin texto",
            opciones: [row[1] || "", row[2] || "", row[3] || "", row[4] || ""],
            correcta: (row[5] || "").trim().toUpperCase(), 
            explicacion: row[6] || "No hay explicación disponible para esta pregunta."
        }));

        renderizarExamen();
    } catch (error) {
        console.error("Error Guardián:", error);
        modalData.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-main);">
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444; margin-bottom:1rem;"></i><br>
            No se pudo cargar el examen.<br><small style="color:var(--text-muted);">Revisa que la pestaña se llame <b>Ope_Comun22</b></small>
        </div>`;
    }
}

function renderizarExamen() {
    const container = document.getElementById('modalData');
    let html = `
        <div style="padding:1.5rem; max-width:800px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom: 2px solid var(--border); padding-bottom:1rem;">
                <h2 style="margin:0; font-weight:900; color:var(--primary); font-size:1.4rem;">OPE COMÚN 2022</h2>
                <span style="background:var(--primary); color:white; padding:5px 12px; border-radius:50px; font-size:0.75rem; font-weight:800; letter-spacing:1px;">GALICIA</span>
            </div>
            <div id="contenedor-preguntas">`;

    preguntasExamen.forEach((p, index) => {
        html += `
            <div id="bloque-${index}" style="margin-bottom:2rem; padding:1.5rem; background:var(--bg); border-radius:1.5rem; border:1px solid var(--border); transition: 0.3s;">
                <p style="font-weight:700; font-size:1.05rem; line-height:1.4; margin-bottom:1.5rem; color:var(--text-main);">${p.pregunta}</p>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${['A', 'B', 'C', 'D'].map((letra, i) => `
                        <label style="display:flex; align-items:center; gap:12px; padding:15px; background:var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; transition:0.2s; color:var(--text-main);">
                            <input type="radio" name="preg-${index}" value="${letra}" style="accent-color:var(--primary); width:18px; height:18px;" onclick="respuestasUsuario[${index}] = '${letra}'">
                            <span style="font-size:0.95rem;">${p.opciones[i]}</span>
                        </label>
                    `).join('')}
                </div>
                
                <button onclick="revelarIndividual(${index})" style="margin-top:1.5rem; background:none; border:none; color:var(--text-muted); font-weight:800; font-size:0.7rem; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:5px; padding:5px;">
                    <i class="fas fa-lightbulb"></i> Ver explicación
                </button>

                <div id="feedback-${index}" style="display:none; margin-top:1.2rem; padding:1.2rem; background:var(--card); border-left:4px solid var(--primary); border-radius:12px; font-size:0.9rem; line-height:1.6; color:var(--text-main); box-shadow: inset 0 0 10px rgba(0,0,0,0.02);">
                    <strong style="color:var(--primary); display:block; margin-bottom:8px; font-weight:900;">RESPUESTA CORRECTA: ${p.correcta}</strong>
                    <div style="opacity:0.9;">${p.explicacion}</div>
                </div>
            </div>`;
    });

    html += `
            <button onclick="corregirExamen()" class="btn btn-primary" style="width:100%; height:60px; border-radius:18px; font-size:1.1rem; margin-top:1rem; box-shadow: 0 10px 15px -3px rgba(67, 56, 202, 0.3);">
                FINALIZAR Y CORREGIR
            </button>
        </div>`;
    
    container.innerHTML = html;
}

// Las funciones revelarIndividual y corregirExamen se mantienen igual porque funcionan perfecto.
function revelarIndividual(idx) {
    const fb = document.getElementById(`feedback-${idx}`);
    fb.style.display = (fb.style.display === 'none') ? 'block' : 'none';
}

function corregirExamen() {
    let aciertos = 0;
    preguntasExamen.forEach((p, idx) => {
        const bloque = document.getElementById(`bloque-${idx}`);
        const feedback = document.getElementById(`feedback-${idx}`);
        feedback.style.display = 'block';

        if (respuestasUsuario[idx] === p.correcta) {
            aciertos++;
            bloque.style.borderColor = '#22c55e';
            bloque.style.background = 'rgba(34, 197, 94, 0.05)';
        } else {
            bloque.style.borderColor = '#ef4444';
            bloque.style.background = 'rgba(239, 68, 68, 0.05)';
        }
    });
    
    alert(`Has completado el examen.\n\nAciertos: ${aciertos} de ${preguntasExamen.length}`);
    document.querySelector('.modal-content').scrollTo({top: 0, behavior: 'smooth'});
}
