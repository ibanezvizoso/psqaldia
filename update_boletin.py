import os
import requests
import google.generativeai as genai
import json
import re
from datetime import datetime, timedelta

# 1. CONFIGURACIÓN DE BÚSQUEDA REAL (PubMed)
PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

# Buscamos en las revistas que te interesan específicamente
QUERY = "(JAMA Psychiatry[Journal] OR Lancet Psychiatry[Journal] OR American Journal of Psychiatry[Journal]) AND (last 7 days[dp])"

def get_recent_pubmed_articles():
    params = {
        "db": "pubmed",
        "term": QUERY,
        "retmax": 3,
        "sort": "pub date",
        "retmode": "json"
    }
    r = requests.get(PUBMED_SEARCH_URL, params=params)
    data = r.json()
    return data.get("esearchresult", {}).get("idlist", [])

def get_article_details(id_list):
    if not id_list: return []
    params = {
        "db": "pubmed",
        "id": ",".join(id_list),
        "retmode": "json"
    }
    r = requests.get(PUBMED_FETCH_URL, params=params)
    data = r.json()
    articles = []
    for id in id_list:
        item = data.get("result", {}).get(id, {})
        articles.append({
            "title": item.get("title", "Sin título"),
            "journal": item.get("fulljournalname", "Revista desconocida"),
            "date": item.get("pubdate", "")
        })
    return articles

def main():
    try:
        # Recuperar datos reales de PubMed
        ids = get_recent_pubmed_articles()
        if not ids:
            # Si no hay nada en las top, ampliamos búsqueda
            print("Ampliando búsqueda...")
            global QUERY
            QUERY = "psychiatry[Journal] AND (last 7 days[dp])"
            ids = get_recent_pubmed_articles()

        articles = get_article_details(ids)
        
        # Preparar texto para Gemini
        articles_text = ""
        for i, art in enumerate(articles, 1):
            articles_text += f"\nARTÍCULO {i}\nTítulo: {art['title']}\nRevista: {art['journal']}\n"

        # 2. CONFIGURAR GEMINI (Uso de 1.5-flash para evitar Error 429)
        api_key = os.environ.get("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        Actúa como un psiquiatra académico. Resume estos artículos REALES de PubMed para un boletín profesional.
        
        ARTÍCULOS:
        {articles_text}

        REQUISITOS:
        - Tono serio y técnico (n, p-valor, hallazgos principales).
        - Traduce los títulos al español.
        - Estructura el 'resumen' con puntos numerados.

        Responde ÚNICAMENTE con este JSON:
        {{
          "fecha": "AUTO",
          "titulo": "Boletín semanal experimental",
          "resumen": "Comienza con 'Boletín experimental no supervisado. Selección de artículos reales de PubMed:' seguido de los resúmenes.",
          "categoria": "BOLETINES",
          "link": "https://pubmed.ncbi.nlm.nih.gov/"
        }}
        """

        response = model.generate_content(prompt)
        
        # Limpieza de JSON
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        data = json.loads(json_match.group(0))
        data["fecha"] = datetime.now().strftime("%d/%m/%Y")

        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("✅ Boletín generado con artículos reales.")

    except Exception as e:
        # Fallback por si PubMed o Gemini fallan
        error_msg = str(e)
        fallback = {
            "fecha": datetime.now().strftime("%d/%m/%Y"),
            "titulo": "Boletín semanal experimental",
            "resumen": f"Error técnico: {error_msg}. Por favor, intente actualizar manualmente.",
            "categoria": "BOLETINES",
            "link": "#"
        }
        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(fallback, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
