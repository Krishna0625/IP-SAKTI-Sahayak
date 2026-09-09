from __future__ import annotations

import hashlib
import html
import logging
import re
from pathlib import Path
from typing import Any

from pypdf import PdfReader

from app.rag.retriever import DocumentRetriever

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {'.pdf', '.html', '.htm', '.txt'}
DOMAIN_KEYWORDS = {
    'patents': {'patent', 'patents'},
    'biodiversity': {'biodiversity', 'bio', 'biological'},
    'ayush': {'ayush', 'ayurveda', 'ayurvedic', 'aahara'},
    'fssai': {'fssai', 'food'},
    'tk': {'traditional', 'tkdl', 'knowledge'},
    'abs': {'abs', 'access and benefit sharing'},
    'trademarks': {'trademark', 'trademarks'},
    'gi': {'geographical', 'gi'},
    'designs': {'design', 'designs'},
    'copyright': {'copyright'},
    'cbd': {'cbd', 'convention on biological diversity'},
    'nagoya': {'nagoya', 'protocol'},
    'wipo': {'wipo', 'international'},
    'trips': {'trips', 'wto'},
}


def normalize_whitespace(text: str) -> str:
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'\n +', '\n', text)
    return text.strip()


def infer_jurisdiction(path: Path) -> str:
    relative = path.as_posix().lower()
    if '/international/' in relative or relative.startswith('international') or 'international' in relative:
        return 'international'
    return 'india'


def infer_domain(path: Path) -> str:
    relative = path.as_posix().lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(keyword in relative for keyword in keywords):
            return domain
    return 'other'


def infer_document_type(filename: str) -> str:
    name = filename.lower()
    if 'act' in name:
        return 'act'
    if 'rule' in name:
        return 'rules'
    if 'regulation' in name:
        return 'regulation'
    if 'convention' in name or 'protocol' in name or 'treaty' in name:
        return 'treaty'
    if 'official' in name or 'home ' in name or 'source' in name or 'information' in name:
        return 'official_document'
    return 'other'


def infer_authority(path: Path, jurisdiction: str) -> str:
    relative = path.as_posix().lower()
    if 'national biodiversity authority' in relative:
        return 'National Biodiversity Authority'
    if 'patent' in relative:
        return 'Government of India'
    if 'drugs and cosmetics' in relative:
        return 'Government of India'
    if 'cbd' in relative or 'biodiversity' in relative:
        return 'Convention on Biological Diversity'
    if 'nagoya' in relative:
        return 'Nagoya Protocol on Access to Genetic Resources and the Fair and Equitable Sharing of Benefits Arising from their Utilization'
    if 'wipo' in relative:
        return 'World Intellectual Property Organization (WIPO)'
    if 'trips' in relative:
        return 'World Trade Organization (WTO) - TRIPS Agreement'
    if 'tkdl' in relative or 'traditional' in relative:
        return 'Traditional Knowledge Digital Library'
    if 'ayush' in relative:
        return 'Ministry of AYUSH'
    if jurisdiction == 'international':
        return 'Official international source'
    return 'Official source'


def infer_year(filename: str) -> str:
    match = re.search(r'(19\d{2}|20\d{2})', filename)
    return match.group(1) if match else ''


def to_title(filename: str) -> str:
    stem = Path(filename).stem.replace('_', ' ').replace('-', ' ')
    stem = re.sub(r'\s+', ' ', stem).strip()
    return stem.title() if stem else 'Official Document'


def build_source_id(relative_path: str, jurisdiction: str, domain: str, source_counter: dict[tuple[str, str], int]) -> str:
    key = (jurisdiction, domain)
    source_counter[key] = source_counter.get(key, 0) + 1
    slug = domain[:3].upper() if domain and domain != 'other' else 'GEN'
    return f'SRC-{jurisdiction[:3].upper()}-{slug}-{source_counter[key]:03d}'


def extract_pdf_text(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    pages: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ''
        pages.append(normalize_whitespace(page_text))
    return '\n\n'.join(text for text in pages if text).strip()


def extract_html_text(file_path: Path) -> str:
    try:
        content = file_path.read_text(encoding='utf-8', errors='replace')
    except UnicodeDecodeError:
        content = file_path.read_text(encoding='latin-1', errors='replace')

    content = re.sub(r'<script.*?</script>', ' ', content, flags=re.I | re.S)
    content = re.sub(r'<style.*?</style>', ' ', content, flags=re.I | re.S)
    content = re.sub(r'<[^>]+>', ' ', content)
    content = html.unescape(content)
    return normalize_whitespace(content)


def extract_text_for_file(file_path: Path) -> dict[str, Any]:
    if file_path.suffix.lower() == '.pdf':
        pages = []
        reader = PdfReader(str(file_path))
        for index, page in enumerate(reader.pages, start=1):
            text = normalize_whitespace(page.extract_text() or '')
            if text:
                pages.append({'page': index, 'text': text})
        return {'pages': pages, 'content': '\n\n'.join(page['text'] for page in pages)}

    if file_path.suffix.lower() in {'.html', '.htm', '.txt'}:
        if file_path.suffix.lower() in {'.html', '.htm'}:
            text = extract_html_text(file_path)
        else:
            text = normalize_whitespace(file_path.read_text(encoding='utf-8', errors='replace'))
        return {'pages': [{'page': 1, 'text': text}], 'content': text}

    return {'pages': [], 'content': ''}


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    if not text:
        return []

    paragraphs = [part.strip() for part in re.split(r'\n{2,}', text) if part.strip()]
    if not paragraphs:
        return [text[:chunk_size]]

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for paragraph in paragraphs:
        if current and current_len + len(paragraph) > chunk_size:
            combined = ' '.join(current).strip()
            if combined:
                chunks.append(combined)
            current = [paragraph]
            current_len = len(paragraph)
            continue
        current.append(paragraph)
        current_len += len(paragraph)

    if current:
        combined = ' '.join(current).strip()
        if combined:
            chunks.append(combined)

    final_chunks: list[str] = []
    for chunk in chunks:
        if len(chunk) <= chunk_size:
            final_chunks.append(chunk)
            continue
        sentences = re.split(r'(?<=[.!?])\s+', chunk)
        buffer = ''
        for sentence in sentences:
            if len(buffer) + len(sentence) <= chunk_size:
                buffer = f'{buffer} {sentence}'.strip()
            else:
                if buffer:
                    final_chunks.append(buffer)
                buffer = sentence.strip()
        if buffer:
            final_chunks.append(buffer)

    if not final_chunks:
        final_chunks = [chunks[0][:chunk_size]]

    return final_chunks


def discover_documents(data_root: Path | None = None) -> list[dict[str, Any]]:
    root = data_root or Path(__file__).resolve().parents[3] / 'data'
    if not root.exists():
        return []

    documents: list[dict[str, Any]] = []
    source_counter: dict[tuple[str, str], int] = {}

    for file_path in sorted(root.rglob('*')):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        relative_path = file_path.relative_to(root).as_posix()
        jurisdiction = infer_jurisdiction(file_path)
        domain = infer_domain(file_path)
        title = to_title(file_path.name)
        source_id = build_source_id(relative_path, jurisdiction, domain, source_counter)

        documents.append({
            'source_id': source_id,
            'title': title,
            'authority': infer_authority(file_path, jurisdiction),
            'jurisdiction': jurisdiction,
            'domain': domain,
            'document_type': infer_document_type(file_path.name),
            'year': infer_year(file_path.name),
            'file_path': str(file_path),
            'relative_path': relative_path,
            'official_url': '',
            'status': 'official',
            'original_name': file_path.name,
        })

    return documents


def index_documents(documents: list[dict[str, Any]]) -> dict[str, int]:
    retriever = DocumentRetriever()
    chunks: list[dict[str, Any]] = []
    total_pages = 0

    for document in documents:
        file_path = Path(document['file_path'])
        try:
            extracted = extract_text_for_file(file_path)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception('Failed to parse %s: %s', file_path, exc)
            continue

        pages = extracted.get('pages') or [{'page': 1, 'text': extracted.get('content', '')}]
        total_pages += len(pages)
        page_chunk_count = 0
        for page_entry in pages:
            page_number = int(page_entry.get('page', 1))
            page_text = page_entry.get('text', '')
            split_chunks = chunk_text(page_text)
            for index, chunk_text_value in enumerate(split_chunks):
                if not chunk_text_value.strip():
                    continue
                chunk_id = f"{document['source_id']}-p{page_number}-c{index}"
                chunk_meta = {
                    'source_id': document['source_id'],
                    'title': document['title'],
                    'authority': document['authority'],
                    'jurisdiction': document['jurisdiction'],
                    'domain': document['domain'],
                    'document_type': document['document_type'],
                    'year': document['year'],
                    'page': page_number,
                    'file_path': document['file_path'],
                    'official_url': document['official_url'],
                    'status': document['status'],
                }
                chunks.append({
                    'chunk_id': chunk_id,
                    'text': chunk_text_value,
                    'metadata': chunk_meta,
                })
            page_chunk_count += len(split_chunks)

        logger.info('Document %s | source_id=%s | pages=%s | chunks=%s', file_path.name, document['source_id'], len(pages), page_chunk_count)

    indexed = retriever.index_documents(chunks)
    return {
        'documents_found': len(documents),
        'documents_indexed': len({chunk['metadata']['source_id'] for chunk in chunks}),
        'chunks_indexed': indexed,
        'pages_processed': total_pages,
    }


def ingest_documents(data_root: Path | None = None) -> dict[str, int]:
    documents = discover_documents(data_root)
    logger.info('Discovered %s documents under data/', len(documents))
    for document in documents:
        logger.info('Source %s | file=%s | jurisdiction=%s | domain=%s', document['source_id'], document['original_name'], document['jurisdiction'], document['domain'])
    summary = index_documents(documents)
    logger.info('Ingestion complete: %s', summary)
    return summary


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
    summary = ingest_documents()
    print(f'Documents found: {summary["documents_found"]}')
    print(f'Documents indexed: {summary["documents_indexed"]}')
    print(f'Chunks indexed: {summary["chunks_indexed"]}')
