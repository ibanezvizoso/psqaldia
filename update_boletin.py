import os
import google.generativeai as genai
import json
import re
from datetime import datetime

try:
    # 1. Configuración de la API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API KEY no detectada en los Secrets de GitHub")
        
    genai.configure(api_key=api_key)

    # 2. Configuración del modelo (Ruta estable para evitar el 404 v1beta)
    # Importante: No forzamos la ruta manual, dejamos que la librería actualizada decida
    model = genai.GenerativeModel('gemini-2.0-flash')

    # 3. PROMPT DE ALTO RIGOR CIENTÍFICO (EL "CEREBRO" DEL BOLETÍN)
    prompt = """
    ESTE ES UN ENCARGO PARA UN EXPERTO EN DOCUMENTACIÓN CLÍNICA Y PSIQUIATRÍA BASADA EN LA EVIDENCIA.
    
    TAREA: Elaborar el 'Boletín semanal experimental' para psiquiatras.
    
    CRITERIOS DE SELECCIÓN DE CONTENIDO:
    - Identifica los 3 hitos más relevantes de los últimos 7 días en el campo de la psiquiatría y neurociencia clínica.
    - PRIORIDAD DE FUENTES: The Lancet Psychiatry, JAMA Psychiatry, World Psychiatry, American Journal of Psychiatry y NEJM. 
    - No obstante, puedes incluir otros hallazgos de revistas de alto impacto (Nature, Science) si la relevancia clínica es mayor.
    - Temas de interés: Nuevos fármacos, cambios en guías clínicas, metaanálisis de alta potencia y estudios de neurobiología traslacional.

    INSTRUCCIONES DE REDACCIÓN (Campo 'resumen'):
    - Comienza con la frase institucional: "Boletín experimental no supervisado. Gemini ha seleccionado los artículos de interés y actualidad para la práctica clínica:"
    - Formato de cada noticia:
        1. [TÍTULO TRADUCIDO AL ESPAÑOL]: Redacta un párrafo denso y técnico. Debes incluir hallazgos específicos y métricas de validez estadística (n, p-valor, IC95%, Odds Ratio o Hazard Ratio) siempre que estén disponibles.
        2. REFERENCIA: Cita obligatoriamente la revista, el año y, si es posible, el autor principal o el grupo de estudio.
    - Tono: Puramente académico, profesional y seco. Evita el sensacionalismo.

    REQUISITO TÉCNICO: Responde exclusivamente con un objeto JSON válido.
    
    {
      "fecha": "FECHA_AUTO",
      "titulo": "Boletín semanal experimental",
      "resumen": "CONTENIDO_DETALLADO_AQUÍ",
      "categoria": "BOLETINES",
      "link": "https://pubmed.ncbi.nlm.nih.gov/"
    }
    """

    # 4. Generación con parámetros de seguridad para evitar bloqueos por palabras "sensibles"
    response = model.generate_content(
        prompt,
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
    )
    
    res_text = response.text.strip()
    
    # 5. Extracción de JSON blindada ante respuestas "charlatanas" de la IA
    json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
    if json_match:
        data = json.loads(json_match.group(0))
    else:
        # Intento de carga directa si falla el regex
        data = json.loads(res_text)

    # Forzar metadatos correctos
    data["fecha"] = datetime.now().strftime("%d/%m/%Y")
    data["categoria"] = "BOLETINES"

    # 6. Escritura del archivo físico
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ Boletín generado con éxito.")

except Exception as e:
    error_msg = str(e)
    print(f"❌ ERROR: {error_msg}")
    
    # Fallback con diagnóstico visual en la web si algo falla
    fallback = {
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "titulo": "Boletín semanal experimental",
        "resumen": f"AVISO DEL SISTEMA: La generación automática ha fallado. Motivo técnico: {error_msg}. Verifique la configuración en GitHub Actions.",
        "categoria": "BOLETINES",
        "link": "#"
    }
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(fallback, f, ensure_ascii=False, indent=2)
