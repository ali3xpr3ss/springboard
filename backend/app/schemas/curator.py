from pydantic import BaseModel, Field


class CuratorCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=6)


class CuratorOut(BaseModel):
    id: int
    email: str
    display_name: str
    is_admin: bool
