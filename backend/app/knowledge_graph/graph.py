from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_GRAPH_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "knowledge_graph"
    / "graph.json"
)


class KnowledgeGraph:
    """Loads the small, read-only graph used for contextual query hints."""

    def __init__(self, path: str | Path | None = None) -> None:
        graph_path = Path(path) if path else DEFAULT_GRAPH_PATH
        with graph_path.open("r", encoding="utf-8") as graph_file:
            payload = json.load(graph_file)

        self.entities: list[dict[str, Any]] = payload.get("entities", [])
        self.relationships: list[dict[str, str]] = payload.get(
            "relationships",
            [],
        )
        self._entities_by_id = {
            entity["id"]: entity
            for entity in self.entities
            if entity.get("id")
        }

    def get_entity(self, entity_id: str) -> dict[str, Any] | None:
        return self._entities_by_id.get(entity_id)

    def get_related_entities(self, entity_id: str) -> list[dict[str, Any]]:
        related_ids = {
            relationship["target"]
            for relationship in self.relationships
            if relationship.get("source") == entity_id
        }
        related_ids.update(
            relationship["source"]
            for relationship in self.relationships
            if relationship.get("target") == entity_id
        )
        return [
            self._entities_by_id[related_id]
            for related_id in related_ids
            if related_id in self._entities_by_id
        ]

    def get_relationships(self, entity_id: str) -> list[dict[str, str]]:
        return [
            relationship
            for relationship in self.relationships
            if entity_id
            in {
                relationship.get("source"),
                relationship.get("target"),
            }
        ]

    def search_entities(self, query: str) -> list[dict[str, Any]]:
        terms = {
            term
            for term in query.lower().split()
            if len(term) > 2
        }
        if not terms:
            return []

        matches: list[tuple[int, dict[str, Any]]] = []
        for entity in self.entities:
            searchable = " ".join(
                [
                    str(entity.get("name", "")),
                    str(entity.get("type", "")),
                    " ".join(entity.get("aliases", [])),
                ]
            ).lower()
            score = sum(term in searchable for term in terms)
            if score:
                matches.append((score, entity))

        matches.sort(key=lambda item: item[0], reverse=True)
        return [entity for _, entity in matches]
