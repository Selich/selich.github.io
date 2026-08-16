import asyncio
import json
from importlib import import_module
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "static" / "data" / "hybrid-retrieval-documents.json"
TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0"
async_playwright = import_module("playwright.async_api").async_playwright


async def generate_embeddings(data):
    texts = [f"{document['title']}. {document['text']}" for document in data["documents"]]
    model = data["embeddingModel"]
    script = f"""
      import {{ pipeline }} from "{TRANSFORMERS_URL}";
      window.generateEmbeddings = async (texts) => {{
        const extractor = await pipeline("feature-extraction", "{model["id"]}", {{
          dtype: "{model["dtype"]}",
          revision: "{model["revision"]}"
        }});
        const output = await extractor(texts, {{ pooling: "mean", normalize: true }});
        return output.tolist();
      }};
    """

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page()
        await page.set_content(f'<script type="module">{script}</script>')
        await page.wait_for_function("window.generateEmbeddings !== undefined", timeout=30000)
        embeddings = await page.evaluate("texts => window.generateEmbeddings(texts)", texts)
        await browser.close()
        return embeddings


async def main():
    data = json.loads(DATA_PATH.read_text())
    embeddings = await generate_embeddings(data)
    for document, embedding in zip(data["documents"], embeddings, strict=True):
        document["embedding"] = embedding
    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")


asyncio.run(main())
