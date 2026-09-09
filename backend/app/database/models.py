from __future__ import annotations


class InnovationRecord:
    """Placeholder persistence model for Stage 2.

    Stage 3 will replace this with the real database model layer.
    """

    __tablename__ = 'innovation_records'

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
