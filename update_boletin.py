import os
import google.generativeai as genai
import json
from datetime import datetime

# ==========================================
# 1. CONFIGURACIÓN TÉCNICA (El motor)
# ==========================================
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # ==========================================
    # 2. INSTRUCCIONES DE CONTENIDO (El encargo)
    # ==========================================
    # Aquí es donde le damos las órdenes clínicas que tú querías:
    instrucciones_clinicas = """
    Eres un experto en psiquiatría clínica y medicina basada en la evidencia.
    Genera un boletín de actualidad científica de la última semana.
    
    REGLAS DE ORO:
    1. PRIORIDAD: Selecciona noticias de revistas de ALTO IMPACTO (The Lancet Psychiatry, JAMA Psychiatry, World Psychiatry, AJPsychiatry).
    2. VERACIDAD: Los datos deben ser reales, actuales y comprobables.
    3. REFERENCIAS: Cada noticia debe citar la fuente o el autor principal.
    
    FORMATO DE SALIDA:
    Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
    {
      "fecha": "DD/MM/YYYY",
      "titulo": "Boletín semanal experimental",
      "resumen": "Aquí el texto que te pedí: 'Boletín experimental no supervisado. Gemini ha seleccionado los artículos y noticias de interés y actualidad, y se ha automatizado la creación de la tarjeta.' Añade después las 3 noticias con sus fuentes.",
      "link": "https://pubmed.ncbi.nlm.nih.gov/",
      "categoria": "BOLETÍN"
    }
    """

    # Llamada a la IA
    response = model.generate_content(instrucciones_clinicas)
    
    # Limpiamos la respuesta (por si la IA pone texto extra)
    texto_sucio = response.text.strip()
    # Buscamos donde empieza y termina el JSON para ignorar cualquier otro texto
    inicio = texto_sucio.find("{")
    fin = texto_sucio.rfind("}") + 1
    texto_limpio = texto_sucio[inicio:fin]
    
    data = json.loads(texto_limpio)

    # ==========================================
    # 3. CREACIÓN DEL ARCHIVO (La solución a la X)
    # ==========================================
    # Guardamos el archivo boletin.json. Al hacerlo así, GitHub siempre lo encontrará.
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ Archivo boletin.json generado correctamente.")

except Exception as e:
    # Si algo falla, creamos un archivo de emergencia para que la acción NO de error
    print(f"❌ Error detectado: {e}")
    error_fallback = {
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "titulo": "Boletín semanal experimental",
        "resumen": "Error técnico al generar las noticias. Se intentará de nuevo en la próxima ejecución automática.",
        "link": "#",
        "categoria": "AVISO"
    }
    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(error_fallback, f, ensure_ascii=False, indent=2)
