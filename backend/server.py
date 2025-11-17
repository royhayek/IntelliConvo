from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# LLM Configuration
LLM_API_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Models
class Assistant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    website_url: str
    description: Optional[str] = ""
    system_prompt: Optional[str] = ""
    industry: Optional[str] = ""
    welcome_message: Optional[str] = "Hello! How can I help you today?"
    conversation_starters: List[str] = []
    crawl_status: str = "pending"  # pending, crawling, completed, failed
    urls_count: int = 0
    last_crawled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssistantCreate(BaseModel):
    name: str
    website_url: str
    description: Optional[str] = ""

class AssistantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    industry: Optional[str] = None
    welcome_message: Optional[str] = None
    conversation_starters: Optional[List[str]] = None

class KnowledgeBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assistant_id: str
    url: str
    title: Optional[str] = ""
    content: str
    is_active: bool = True
    scraped_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assistant_id: str
    session_id: str
    visitor_id: str = "anonymous"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_message_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_count: int = 0

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: str  # user, assistant
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class AnalyticsResponse(BaseModel):
    total_conversations: int
    total_messages: int
    urls_crawled: int
    last_activity: Optional[datetime] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_message(self, message: str, session_id: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)

manager = ConnectionManager()

# Helper functions
async def crawl_website(url: str, assistant_id: str):
    """Simple website crawler"""
    try:
        urls_to_crawl = [url]
        crawled_urls = set()
        
        async with aiohttp.ClientSession() as session:
            while urls_to_crawl and len(crawled_urls) < 20:  # Limit to 20 pages
                current_url = urls_to_crawl.pop(0)
                
                if current_url in crawled_urls:
                    continue
                
                try:
                    async with session.get(current_url, timeout=10) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Extract text content
                            for script in soup(["script", "style"]):
                                script.decompose()
                            text = soup.get_text()
                            lines = (line.strip() for line in text.splitlines())
                            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                            text = ' '.join(chunk for chunk in chunks if chunk)
                            
                            # Get title
                            title = soup.find('title')
                            title_text = title.string if title else current_url
                            
                            # Save to knowledge base
                            kb = KnowledgeBase(
                                assistant_id=assistant_id,
                                url=current_url,
                                title=str(title_text),
                                content=text[:5000]  # Limit content length
                            )
                            kb_dict = kb.model_dump()
                            kb_dict['scraped_at'] = kb_dict['scraped_at'].isoformat()
                            await db.knowledge_base.insert_one(kb_dict)
                            
                            crawled_urls.add(current_url)
                            
                            # Find more links (only from same domain)
                            base_domain = urlparse(url).netloc
                            for link in soup.find_all('a', href=True):
                                full_url = urljoin(current_url, link['href'])
                                link_domain = urlparse(full_url).netloc
                                if link_domain == base_domain and full_url not in crawled_urls:
                                    urls_to_crawl.append(full_url)
                except Exception as e:
                    logging.error(f"Error crawling {current_url}: {str(e)}")
                    continue
        
        # Update assistant
        await db.assistants.update_one(
            {"id": assistant_id},
            {"$set": {
                "crawl_status": "completed",
                "urls_count": len(crawled_urls),
                "last_crawled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
    except Exception as e:
        logging.error(f"Crawl failed: {str(e)}")
        await db.assistants.update_one(
            {"id": assistant_id},
            {"$set": {"crawl_status": "failed"}}
        )

async def get_context_from_kb(assistant_id: str, query: str) -> str:
    """Retrieve relevant context from knowledge base"""
    kb_items = await db.knowledge_base.find(
        {"assistant_id": assistant_id, "is_active": True}
    ).to_list(100)
    
    # Simple keyword matching (in production, use vector embeddings)
    query_lower = query.lower()
    relevant_content = []
    
    for item in kb_items:
        content = item.get('content', '')
        if any(word in content.lower() for word in query_lower.split()):
            relevant_content.append(content[:500])
    
    return "\n\n".join(relevant_content[:3]) if relevant_content else "No specific information found."

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Sideconvo API"}

@api_router.post("/assistants", response_model=Assistant)
async def create_assistant(assistant_data: AssistantCreate):
    assistant = Assistant(
        name=assistant_data.name,
        website_url=assistant_data.website_url,
        description=assistant_data.description or "",
        system_prompt=f"You are a helpful AI assistant for {assistant_data.name}. Answer questions based on the website content."
    )
    
    assistant_dict = assistant.model_dump()
    assistant_dict['created_at'] = assistant_dict['created_at'].isoformat()
    assistant_dict['updated_at'] = assistant_dict['updated_at'].isoformat()
    if assistant_dict.get('last_crawled_at'):
        assistant_dict['last_crawled_at'] = assistant_dict['last_crawled_at'].isoformat()
    
    await db.assistants.insert_one(assistant_dict)
    
    # Start crawling in background
    asyncio.create_task(crawl_website(assistant_data.website_url, assistant.id))
    
    return assistant

@api_router.get("/assistants", response_model=List[Assistant])
async def get_assistants():
    assistants = await db.assistants.find({}, {"_id": 0}).to_list(1000)
    for assistant in assistants:
        if isinstance(assistant.get('created_at'), str):
            assistant['created_at'] = datetime.fromisoformat(assistant['created_at'])
        if isinstance(assistant.get('updated_at'), str):
            assistant['updated_at'] = datetime.fromisoformat(assistant['updated_at'])
        if assistant.get('last_crawled_at') and isinstance(assistant['last_crawled_at'], str):
            assistant['last_crawled_at'] = datetime.fromisoformat(assistant['last_crawled_at'])
    return assistants

@api_router.get("/assistants/{assistant_id}", response_model=Assistant)
async def get_assistant(assistant_id: str):
    assistant = await db.assistants.find_one({"id": assistant_id}, {"_id": 0})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    if isinstance(assistant.get('created_at'), str):
        assistant['created_at'] = datetime.fromisoformat(assistant['created_at'])
    if isinstance(assistant.get('updated_at'), str):
        assistant['updated_at'] = datetime.fromisoformat(assistant['updated_at'])
    if assistant.get('last_crawled_at') and isinstance(assistant['last_crawled_at'], str):
        assistant['last_crawled_at'] = datetime.fromisoformat(assistant['last_crawled_at'])
    
    return assistant

@api_router.patch("/assistants/{assistant_id}", response_model=Assistant)
async def update_assistant(assistant_id: str, update_data: AssistantUpdate):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.assistants.update_one({"id": assistant_id}, {"$set": update_dict})
    
    return await get_assistant(assistant_id)

@api_router.delete("/assistants/{assistant_id}")
async def delete_assistant(assistant_id: str):
    await db.assistants.delete_one({"id": assistant_id})
    await db.knowledge_base.delete_many({"assistant_id": assistant_id})
    await db.conversations.delete_many({"assistant_id": assistant_id})
    return {"message": "Assistant deleted"}

@api_router.post("/assistants/{assistant_id}/crawl")
async def trigger_crawl(assistant_id: str):
    assistant = await db.assistants.find_one({"id": assistant_id}, {"_id": 0})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    await db.assistants.update_one(
        {"id": assistant_id},
        {"$set": {"crawl_status": "crawling"}}
    )
    
    asyncio.create_task(crawl_website(assistant['website_url'], assistant_id))
    return {"message": "Crawl started"}

@api_router.get("/assistants/{assistant_id}/embed-code")
async def get_embed_code(assistant_id: str):
    code = f'''<!-- Sideconvo Widget -->
<script>
  (function(w,d,s,a){{w.Sideconvo=a;w[a]=w[a]||function(){{(w[a].q=w[a].q||[]).push(arguments)}};var sc=d.createElement(s);sc.async=1;sc.src='https://cdn.sideconvo.ai/widget.js';d.head.appendChild(sc);}})(window,document,'script','sideconvo');
  sideconvo('init', {{
    assistantId: '{assistant_id}',
    mode: 'button'
  }});
</script>'''
    return {"code": code}

@api_router.post("/assistants/{assistant_id}/chat")
async def chat(assistant_id: str, chat_message: ChatMessage):
    assistant = await db.assistants.find_one({"id": assistant_id}, {"_id": 0})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    # Get or create conversation
    session_id = chat_message.session_id or str(uuid.uuid4())
    conversation = await db.conversations.find_one({"session_id": session_id}, {"_id": 0})
    
    if not conversation:
        conv = Conversation(
            assistant_id=assistant_id,
            session_id=session_id
        )
        conv_dict = conv.model_dump()
        conv_dict['started_at'] = conv_dict['started_at'].isoformat()
        conv_dict['last_message_at'] = conv_dict['last_message_at'].isoformat()
        await db.conversations.insert_one(conv_dict)
        conversation = conv_dict
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation['id'],
        role="user",
        content=chat_message.message
    )
    user_msg_dict = user_msg.model_dump()
    user_msg_dict['timestamp'] = user_msg_dict['timestamp'].isoformat()
    await db.messages.insert_one(user_msg_dict)
    
    # Get context from knowledge base
    context = await get_context_from_kb(assistant_id, chat_message.message)
    
    # Generate AI response
    try:
        system_message = assistant.get('system_prompt', '') + f"\n\nContext from website:\n{context}"
        
        chat = LlmChat(
            api_key=LLM_API_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5")
        
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation['id'],
            role="assistant",
            content=response
        )
        assistant_msg_dict = assistant_msg.model_dump()
        assistant_msg_dict['timestamp'] = assistant_msg_dict['timestamp'].isoformat()
        await db.messages.insert_one(assistant_msg_dict)
        
        # Update conversation
        await db.conversations.update_one(
            {"id": conversation['id']},
            {"$set": {
                "last_message_at": datetime.now(timezone.utc).isoformat(),
                "message_count": conversation.get('message_count', 0) + 2
            }}
        )
        
        return {
            "response": response,
            "session_id": session_id
        }
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@api_router.get("/assistants/{assistant_id}/conversations")
async def get_conversations(assistant_id: str):
    conversations = await db.conversations.find(
        {"assistant_id": assistant_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(1000)
    
    for conv in conversations:
        if isinstance(conv.get('started_at'), str):
            conv['started_at'] = datetime.fromisoformat(conv['started_at'])
        if isinstance(conv.get('last_message_at'), str):
            conv['last_message_at'] = datetime.fromisoformat(conv['last_message_at'])
    
    return conversations

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return messages

@api_router.get("/assistants/{assistant_id}/knowledge")
async def get_knowledge_base(assistant_id: str):
    kb_items = await db.knowledge_base.find(
        {"assistant_id": assistant_id},
        {"_id": 0}
    ).to_list(1000)
    
    for item in kb_items:
        if isinstance(item.get('scraped_at'), str):
            item['scraped_at'] = datetime.fromisoformat(item['scraped_at'])
    
    return kb_items

@api_router.get("/assistants/{assistant_id}/analytics", response_model=AnalyticsResponse)
async def get_analytics(assistant_id: str):
    conversations = await db.conversations.count_documents({"assistant_id": assistant_id})
    messages = await db.messages.count_documents({})
    kb_count = await db.knowledge_base.count_documents({"assistant_id": assistant_id})
    
    last_conv = await db.conversations.find_one(
        {"assistant_id": assistant_id},
        {"_id": 0},
        sort=[("last_message_at", -1)]
    )
    
    last_activity = None
    if last_conv and last_conv.get('last_message_at'):
        last_activity = datetime.fromisoformat(last_conv['last_message_at']) if isinstance(last_conv['last_message_at'], str) else last_conv['last_message_at']
    
    return AnalyticsResponse(
        total_conversations=conversations,
        total_messages=messages,
        urls_crawled=kb_count,
        last_activity=last_activity
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()