import os
import requests
import google.generativeai as genai
import json
import re
from datetime import datetime, timedelta

# CONFIG
PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

QUERY = "psychiatry OR depression OR schizophrenia OR bipolar disorder"
MAX_ARTICLES = 5


def get_recent_pubmed_articles():
    """Obtiene IDs de artículos recientes"""
    
    today = datetime.now()
    last_week = today - timedelta(days=7)

    params = {
        "db": "pubmed",
        "term": QUERY,
        "retmax": MAX_ARTICLES,
        "sort": "pub date",
        "retmode": "json",
        "mindate": last_week.strftime("%Y/%m/%d"),
        "maxdate": today.strftime("%Y/%m/%d")
    }

    r = requests.get(PUBMED_SEARCH_URL, params=params)
    data = r.json()

    return data["esearchresult"]["idlist"]


def get_article_details(id_list):
    """Obtiene detalles de artículos"""
    
    if not id_list:
        return []

    params = {
        "db": "pubmed",
        "id": ",".join(id_list),
        "retmode": "json"
    }

    r = requests.get(PUBMED_FETCH_URL, params=params)
    data = r.json()

    articles = []

    for id in id_list:
        item = data["result"][id]

        articles.append({
            "title": item.get("title", ""),
            "journal": item.get("fulljournalname", ""),
            "date": item.get("pubdate", ""),
            "authors": item.get("authors", [])
        })

    return articles


def generate_summary_with_gemini(articles):

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Falta GEMINI_API_KEY")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.0-flash")

    articles_text = ""

    for i, art in enumerate(articles, 1):
        articles_text += f"""
ARTÍCULO {i}
Título: {art['title']}
Revista: {art['journal']}
Fecha: {art['date']}
"""

    prompt = f"""
Eres un psiquiatra académico.

Resume estos artículos reales de PubMed en formato boletín clínico.

{articles_text}

Formato JSON exacto:

{{
  "fecha": "AUTO",
  "titulo": "Boletín semanal experimental",
  "resumen": "Texto académico detallado",
  "categoria": "BOLETINES",
  "link": "https://pubmed.ncbi.nlm.nih.gov/"
}}
"""

    response = model.generate_content(prompt)

    if not response.text:
        raise ValueError("Gemini devolvió respuesta vacía")

    return response.text


def main():

    try:

        ids = get_recent_pubmed_articles()

        if not ids:
            raise ValueError("No se encontraron artículos recientes")

        articles = get_article_details(ids)

        summary_text = generate_summary_with_gemini(articles)

        json_match = re.search(r'\{.*\}', summary_text, re.DOTALL)

        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(summary_text)

        data["fecha"] = datetime.now().strftime("%d/%m/%Y")

        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print("Boletín generado correctamente con artículos reales.")

    except Exception as e:

        fallback = {
            "fecha": datetime.now().strftime("%d/%m/%Y"),
            "titulo": "Boletín semanal experimental",
            "resumen": f"Error: {str(e)}",
            "categoria": "BOLETINES",
            "link": "#"
        }

        with open("boletin.json", "w", encoding="utf-8") as f:
            json.dump(fallback, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
