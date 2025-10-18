from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class BlogPost(BaseModel):
    id: Optional[str] = None
    title: str
    slug: str
    content: dict
    meta_description: str
    keywords: List[str]
    published_at: Optional[str] = None
    updated_at: str
    published: bool = False
    
    def __init__(self, **data):
        if 'id' not in data or not data['id']:
            data['id'] = str(uuid.uuid4())
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        super().__init__(**data)