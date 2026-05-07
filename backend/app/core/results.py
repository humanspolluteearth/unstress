from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")
E = TypeVar("E")

class Result(BaseModel, Generic[T, E]):
    success: bool
    data: Optional[T] = None
    error: Optional[E] = None

    @classmethod
    def ok(cls, data: T) -> "Result[T, E]":
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: E) -> "Result[T, E]":
        return cls(success=False, error=error)
