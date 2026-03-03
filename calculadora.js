/**
 * CALCULADORA APS - VERSIÓN "BABY STEPS"
 * Objetivo: Leer Haloperidol en A2 y hacer conversión simple.
 */

window.iniciarInterfazCalculadora = async function() {
    const container = document.getElementById('modalData');

    // Estilos mínimos
    if (!document.getElementById('calc-simple-styles')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'calc-simple-styles';
        styleTag.innerHTML = `
            .calc-ui { padding: 1.5rem; font-family: sans-serif; }
            .calc-ui label { display: block; margin-top: 10px; font-weight: bold; font-size: 0.8rem; }
            .calc-ui select, .calc-ui input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 8px; border: 1px solid #ccc; }
            .btn-calc { width: 100%; margin-top: 20px; padding: 15px; background: #007bff; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
            .res-simple { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; display: none; text-align: center; border: 1px solid #ddd; }
        `;
        document.head.appendChild(styleTag);
    }

    try {
        const response = await fetch(`${window.WORKER_URL}?sheet=Data_APS`);
        const data = await response.json();
        
        if (data.values) {
            window.dbSimple = [];
            
            // LEER DESDE i = 1 (Fila 2 del Excel)
            // No filtramos nada, lo que haya en la columna A va a la lista.
            for (let i = 1; i < data.values.length; i++) {
                const fila = data.values[i];
                if (fila && fila[0]) {
                    window.dbSimple.push({
                        nombre: fila[0].toString().trim(),
                        factor: parseFloat(fila[1]) || 1
                    });
                }
            }

            // Crear las opciones para los selectores
            const options = window.dbSimple.map(f => `<option value="${f.nombre}">${f.nombre}</option>`).join('');

            container.innerHTML = `
                <div class="calc-ui">
                    <h2>Conversión Simple</h2>
                    
                    <label>Fármaco Origen (De Fila A2 en adelante)</label>
                    <select id="s_orig">${options}</select>
                    
                    <label>Dosis Actual (mg)</label>
                    <input type="number" id="s_dosis" placeholder="Ej: 5">
                    
                    <label>Fármaco Destino</label>
                    <select id="s_dest">${options}</select>
                    
                    <button class="btn-calc" onclick="calcularSoloDosis()">CALCULAR DOSIS</button>
                    
                    <div id="s_res" class="res-simple">
                        <div style="font-size: 0.8rem; color: #666;">Dosis Equivalente</div>
                        <div id="s_val" style="font-size: 2rem; font-weight: bold; color: #333;"></div>
                    </div>
                </div>`;
        }
    } catch (e) {
        container.innerHTML = "Error cargando datos: " + e.message;
    }
};

window.calcularSoloDosis = function() {
    const fOrig = document.getElementById('s_orig').value;
    const fDest = document.getElementById('s_dest').value;
    const dosis = parseFloat(document.getElementById('s_dosis').value);
    
    const o = window.dbSimple.find(x => x.nombre === fOrig);
    const d = window.dbSimple.find(x => x.nombre === fDest);
    
    if (o && d && !isNaN(dosis)) {
        const resultado = (dosis / o.factor) * d.factor;
        document.getElementById('s_res').style.display = 'block';
        document.getElementById('s_val').innerHTML = resultado.toFixed(2) + " mg/día";
    } else {
        alert("Introduce una dosis válida.");
    }
};
