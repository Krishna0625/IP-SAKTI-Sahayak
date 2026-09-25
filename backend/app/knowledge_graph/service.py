from __future__ import annotations

from typing import Any

from app.knowledge_graph.graph import KnowledgeGraph


class KnowledgeGraphService:
    """Provides bounded graph context without making legal determinations."""

    def __init__(self, graph: KnowledgeGraph | None = None) -> None:
        self.graph = graph or KnowledgeGraph()

    def get_entity(self, entity_id: str) -> dict[str, Any] | None:
        return self.graph.get_entity(entity_id)

    def get_related_entities(self, entity_id: str) -> list[dict[str, Any]]:
        return self.graph.get_related_entities(entity_id)

    def get_relationships(self, entity_id: str) -> list[dict[str, str]]:
        return self.graph.get_relationships(entity_id)

    def search_entities(self, query: str) -> list[dict[str, Any]]:
        return self.graph.search_entities(query)

    def get_context_for_query(
        self,
        query: str,
        max_entities: int = 4,
        max_relationships: int = 6,
    ) -> dict[str, list[dict[str, Any]]]:
        """Return only bounded, query-relevant graph context."""
        entities = self.search_entities(query)[:max_entities]
        entity_ids = {entity["id"] for entity in entities}
        relationships = [
            relationship
            for relationship in self.graph.relationships
            if relationship.get("source") in entity_ids
            or relationship.get("target") in entity_ids
        ][:max_relationships]

        related_ids = {
            relationship["source"]
            for relationship in relationships
        } | {
            relationship["target"]
            for relationship in relationships
        }
        context_entities = [
            entity
            for entity in self.graph.entities
            if entity.get("id") in related_ids
        ][:max_entities]

        return {
            "entities": context_entities,
            "relationships": relationships,
        }
