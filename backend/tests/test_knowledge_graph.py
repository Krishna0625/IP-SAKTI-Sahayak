from app.knowledge_graph.service import KnowledgeGraphService


def test_graph_loads_expected_entities():
    service = KnowledgeGraphService()

    assert service.get_entity("traditional_knowledge")["name"] == "Traditional Knowledge"
    assert service.get_entity("tkdl")["name"] == "TKDL"


def test_search_and_relationship_lookup():
    service = KnowledgeGraphService()

    matches = service.search_entities("patent traditional knowledge")
    match_ids = {entity["id"] for entity in matches}

    assert "patent" in match_ids
    assert "traditional_knowledge" in match_ids
    assert any(
        relationship["relation"] == "documented_by"
        for relationship in service.get_relationships("traditional_knowledge")
    )


def test_query_context_is_bounded_and_relevant():
    service = KnowledgeGraphService()

    context = service.get_context_for_query(
        "Can an Ayurvedic formulation containing traditional knowledge be patented?"
    )

    assert len(context["entities"]) <= 4
    assert len(context["relationships"]) <= 6
    assert context["relationships"]
    assert all(
        relationship["source"] in {
            entity["id"] for entity in context["entities"]
        }
        or relationship["target"] in {
            entity["id"] for entity in context["entities"]
        }
        for relationship in context["relationships"]
    )


def test_unrelated_query_does_not_dump_graph():
    service = KnowledgeGraphService()

    context = service.get_context_for_query("What is the weather today?")

    assert context == {"entities": [], "relationships": []}
