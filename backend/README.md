# IP-SAKTI Sahayak Backend

This backend provides the Stage 3 official knowledge-base and retrieval pipeline for the IP-SAKTI Sahayak prototype.

## 1) Activate the environment

PowerShell:

```powershell
cd C:\Users\HANUSHA\Downloads\Devops\IP-SAKTI-Sahayak
.\.venv\Scripts\Activate.ps1
```

## 2) Install requirements

From the backend directory:

```bash
cd backend
python -m pip install -r requirements.txt
```

## 3) Index the official data

```bash
cd backend
python -m app.rag.ingestion
```

This discovers the official files under data/, extracts text where possible, chunks the material, and stores the evidence in the persistent ChromaDB directory.

## 4) Start FastAPI

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The app serves the API at http://127.0.0.1:8000.

## 5) Test /api/health

```bash
curl http://127.0.0.1:8000/api/health
```

## 6) Test /api/chat

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Can I patent my Ashwagandha formulation?","jurisdiction":"india","language":"en"}'
```

Additional sample prompts:

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What is ABS and why could it matter for an Ayurvedic product?","jurisdiction":"india","language":"en"}'
```

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What does Ayurveda Aahara mean?","jurisdiction":"india","language":"en"}'
```

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What international framework addresses genetic resources and traditional knowledge?","jurisdiction":"international","language":"en"}'
```

## Notes

- No LLM API key is required for the basic retrieval/evidence workflow.
- The knowledge base reflects the files physically present under data/.
- If the evidence is insufficient, the API returns a grounded fallback message rather than inventing legal claims.
