import os
import google.generativeai as genai
import json
from datetime import datetime

# Configuración
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

# El encargo con tus textos específicos
prompt = """
Eres un experto en psiquiatría clínica y medicina basada en la evidencia. 
Tu tarea es generar un boletín de actualidad de la última semana para profesionales.

INSTRUCCIONES DE CALIDAD:
1. PRIORIDAD: Selecciona hitos de revistas de alto impacto (The Lancet Psychiatry, JAMA Psychiatry, AJPsychiatry, World Psychiatry, NEJM).
2. VERACIDAD: Los hallazgos deben ser reales y de los últimos 7 días. 
3. REFERENCIA: Menciona brevemente la fuente en cada noticia.

Devuelve ÚNICAMENTE un objeto JSON con este formato exacto:
{
  "fecha": "FECHA_HOY (DD/MM/YYYY)",
  "titulo": "Boletín semanal experimental",
  "resumen": "Boletín experimental no supervisado. Gemini ha seleccionado los artículos y noticias de interés y actualidad, y se ha automatizado la creación de la tarjeta. NOTICIAS SELECCIONADAS: [Aquí resume las 3 noticias con sus fuentes]",
  "link": "URL_PUBMED_O_FUENTE_PRINCIPAL",
  "categoria": "BOLETÍN"
}
"""

try:
    response = model.generate_content(prompt)
    limpio = response.text.replace('```json', '').replace('```', '').strip()
    data = json.loads(limpio)

    with open('boletin.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Boletín experimental generado.")
except Exception as e:
    print(f"Error: {e}")
