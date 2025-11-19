# Intelligentconvo Platform - Visual Flows & Diagrams

## 1. USER ONBOARDING FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEW USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

START: intelligentconvo.ai homepage
    │
    ↓
┌─────────────────────┐
│   Landing Page      │
│  - Value props      │
│  - Get Started CTA  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Sign Up/Login     │
│  ○ Google           │
│  ○ GitHub           │
│  ○ Microsoft        │
└──────────┬──────────┘
           ↓
    OAuth Flow
           ↓
┌─────────────────────┐
│  Step 1: Site URL   │
│                     │
│  [example.com____]  │
│                     │
│  [Continue]         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Step 2: Analyzing   │
│                     │
│  [⌛ Crawling...]   │
│  https://site.com   │
│                     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Step 3: Site Map    │
│                     │
│ ✓ 22+ pages found   │
│                     │
│ [URL list preview]  │
│                     │
│ [Back] [Continue]   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│Step 4: Plan & Bill  │
│                     │
│ ○ Monthly $49.99    │
│ ● Annual  $41.67/mo │
│                     │
│ [Get Started]       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Step 5: Payment     │
│                     │
│ 14 days free trial  │
│                     │
│ [Pay with Link]     │
│ or                  │
│ [Card details form] │
│                     │
│ $0.00 due today     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Dashboard         │
│                     │
│ Connected Sites     │
│ [mojo.com.lb] Trial │
│                     │
│ [+ Add Site]        │
└─────────────────────┘
```

---

## 2. SITE CONFIGURATION FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│                SITE MANAGEMENT NAVIGATION                         │
└──────────────────────────────────────────────────────────────────┘

Dashboard → Select Site → mojo.com.lb
                              │
         ┌────────────────────┼─────────────────────────┐
         │                    │                          │
         ↓                    ↓                          ↓
   ┌─────────┐         ┌──────────┐              ┌──────────┐
   │Overview │         │ Sitemap  │              │ PDFs &   │
   └────┬────┘         │  & URLs  │              │Knowledge │
        │              └────┬─────┘              └────┬─────┘
        │                   │                         │
        │                   ↓                         ↓
        │          ┌─────────────────┐      ┌─────────────────┐
        │          │ URL Management  │      │  Upload PDFs    │
        │          │                 │      │                 │
        │          │ • Add URLs      │      │ • Drag & Drop   │
        │          │ • Recrawl       │      │ • Search Files  │
        │          │ • Exclude       │      │ • Delete Files  │
        │          │ • Bulk Add      │      └─────────────────┘
        │          └─────────────────┘
        │
        ↓
   ┌──────────────────┐
   │  Conversations   │────→ View Chat History
   └──────────────────┘
        │
        ↓
   ┌──────────────────────────────────────┐
   │      Site Preferences                │
   ├──────────────────────────────────────┤
   │ ○ Site Info                          │
   │   - Name, Description, Industry      │
   │   - Special Instructions             │
   │                                      │
   │ ○ Conversation Starters              │
   │   - Welcome Message                  │
   │   - Starter Prompts (up to 10)       │
   │                                      │
   │ ○ Active Host Names                  │
   │   - Enable/Disable Domains           │
   │                                      │
   │ ○ Danger Zone                        │
   │   - Delete Site                      │
   └──────────────────────────────────────┘
        │
        ↓
   ┌──────────────────┐
   │ Widget & Button  │────→ Installation Code
   └──────────────────┘       • Button Mode
        │                     • Widget Mode
        │                     • Preview
        ↓
   ┌──────────────────┐
   │   Playground     │────→ Test Chat Before Deploy
   └──────────────────┘
```

---

## 3. CONVERSATION FLOW (End User on Website)

```
┌────────────────────────────────────────────────────────────────┐
│                 END USER CHAT EXPERIENCE                        │
└────────────────────────────────────────────────────────────────┘

User visits website
    │
    ↓
┌─────────────────────┐
│ Widget Loads        │
│                     │
│ [💬 Chat Button]    │
│ (bottom-right)      │
└──────────┬──────────┘
           │ Click
           ↓
┌───────────────────────────────────────────┐
│     Chat Window Opens                     │
│  ┌─────────────────────────────────────┐  │
│  │ ☰    Speak | Chat ✓                │  │
│  ├─────────────────────────────────────┤  │
│  │                                     │  │
│  │ Welcome to Mojo, how can I help    │  │
│  │ you today?                          │  │
│  │                                     │  │
│  │ [How do I sign up?]                │  │
│  │ [Can I send money abroad?]         │  │
│  │ [Where can I use Mojo?]            │  │
│  │                                     │  │
│  ├─────────────────────────────────────┤  │
│  │ [Message________________]    [🎤]  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
           │
           ↓
┌───────────────────────┐
│ User Action:          │
│ ○ Clicks starter      │
│ ○ Types question      │
│ ○ Uses voice (🎤)     │
└──────────┬────────────┘
           │
           ↓
┌───────────────────────────────────────────┐
│          Message Processing               │
│                                           │
│  Client → WebSocket → Server              │
│                                           │
│  1. Receive message                       │
│  2. Retrieve conversation context         │
│  3. Query knowledge base (vector search)  │
│  4. Build LLM prompt                      │
│  5. Generate response                     │
│  6. Stream back to client                 │
└──────────┬────────────────────────────────┘
           │
           ↓
┌───────────────────────────────────────────┐
│     Response Display                      │
│  ┌─────────────────────────────────────┐  │
│  │ User: "Where can I use Mojo?"       │  │
│  │                                     │  │
│  │ AI: You can use Mojo to perform    │  │
│  │ various transactions within        │  │
│  │ Lebanon. It allows you to add      │  │
│  │ funds, make payments...            │  │
│  │                                     │  │
│  │ [View Details]                      │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
           │
           ↓
┌───────────────────────┐
│ Conversation Saved    │
│ - Message stored      │
│ - Admin can review    │
│ - Analytics tracked   │
└───────────────────────┘
```

---

## 4. BACKEND PROCESSING FLOW

```
┌────────────────────────────────────────────────────────────────┐
│           WEBSITE CRAWLING & KNOWLEDGE BASE CREATION           │
└────────────────────────────────────────────────────────────────┘

User submits URL
    │
    ↓
┌─────────────────────┐
│  Queue Crawl Job    │
│  - Site ID          │
│  - URL              │
│  - Priority         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│         Crawler Worker                  │
│                                         │
│  1. Fetch robots.txt                    │
│  2. Parse sitemap.xml                   │
│  3. Crawl homepage                      │
│  4. Discover links                      │
│                                         │
│  For each URL:                          │
│    - Fetch page                         │
│    - Extract content                    │
│    - Clean HTML                         │
│    - Store raw content                  │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      Content Processing                 │
│                                         │
│  1. Remove boilerplate (nav, footer)   │
│  2. Extract main content                │
│  3. Chunk into segments (~500 tokens)  │
│  4. Add metadata                        │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      Generate Embeddings                │
│                                         │
│  For each chunk:                        │
│    - Call OpenAI embeddings API         │
│    - Vector: [0.234, 0.456, ...]       │
│    - Store in Vector DB                 │
│    - Link to source URL                 │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────┐
│  Knowledge Base     │
│  Ready for Queries  │
│  ✓ Searchable       │
│  ✓ Semantic         │
└─────────────────────┘

─────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────────────┐
│              QUERY PROCESSING & RESPONSE GENERATION            │
└────────────────────────────────────────────────────────────────┘

User asks question
    │
    ↓
┌─────────────────────────────────────────┐
│     Query Understanding                 │
│                                         │
│  1. Receive message                     │
│  2. Generate query embedding            │
│  3. Detect intent (optional)            │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      Retrieve Context                   │
│                                         │
│  Vector DB Query:                       │
│    - Search by embedding similarity     │
│    - Filter by site_id                  │
│    - Top K=5 results                    │
│                                         │
│  Results:                               │
│    [Chunk 1: 0.89 similarity]          │
│    [Chunk 2: 0.85 similarity]          │
│    [Chunk 3: 0.82 similarity]          │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      Build LLM Prompt                   │
│                                         │
│  System: "You are an AI for [site]"    │
│  Context: [Top 3 chunks]                │
│  History: [Previous 5 messages]         │
│  User: [Current question]               │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      LLM Generation                     │
│                                         │
│  OpenAI API Call:                       │
│    - model: gpt-4-turbo                 │
│    - stream: true                       │
│    - max_tokens: 500                    │
│                                         │
│  Streaming Response:                    │
│    chunk1: "You can"                    │
│    chunk2: " use Mojo"                  │
│    chunk3: " to perform..."             │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────┐
│      Stream to Client                   │
│                                         │
│  WebSocket.send():                      │
│    - { type: 'stream', chunk: '...' }  │
│    - Update UI in real-time             │
│    - Complete message displayed         │
└──────────┬──────────────────────────────┘
           │
           ↓
┌─────────────────────┐
│  Store Message      │
│  - conversation_id  │
│  - role: assistant  │
│  - content          │
│  - timestamp        │
└─────────────────────┘
```

---

## 5. SUBSCRIPTION & BILLING FLOW

```
┌────────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION LIFECYCLE                        │
└────────────────────────────────────────────────────────────────┘

User completes onboarding
    │
    ↓
┌─────────────────────┐
│  Create Stripe      │
│  Customer           │
│  - Email            │
│  - Name             │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Create Stripe Subscription         │
│  - plan: premium_annual              │
│  - trial_period_days: 14             │
│  - payment_method: card/link         │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Subscription Created                │
│  Status: trialing                    │
│  Trial ends: Nov 27, 2025            │
│  First charge: $499.99               │
└──────────┬──────────────────────────┘
           │
           │ ─── Days 1-14: Trial Period ────
           │
           │     User has full access
           │     Widget active
           │     No charges
           │
           ↓
┌─────────────────────────────────────┐
│  Day 14: Trial Ends                 │
│                                     │
│  Stripe Webhook:                    │
│    trial_will_end (2 days before)   │
│    ↓ Send reminder email            │
│                                     │
│  Stripe automatically charges       │
│    ↓ charge.succeeded webhook       │
│    ↓ Update status: active          │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Active Subscription                │
│  - Auto-renews monthly/annually     │
│  - Widget remains active            │
│  - All features enabled             │
└──────────┬──────────────────────────┘
           │
           │
           ├──→ User clicks "Cancel"
           │         │
           │         ↓
           │    ┌──────────────────────┐
           │    │  Cancel at Period    │
           │    │  End                 │
           │    │  - Widget active     │
           │    │    until period ends │
           │    │  - No refund         │
           │    │  - No renewal        │
           │    └──────────────────────┘
           │
           │
           └──→ Payment fails
                    │
                    ↓
               ┌──────────────────────┐
               │  Dunning Process     │
               │  - Retry payment 3x  │
               │  - Email reminders   │
               │  - Grace period      │
               └────────┬─────────────┘
                        │
                        ├──→ Success: Continue
                        │
                        └──→ Failed: Suspend
                                │
                                ↓
                           ┌────────────┐
                           │  Expired   │
                           │  - Widget  │
                           │    disabled│
                           │  - Can     │
                           │    resubsc.│
                           └────────────┘
```

---

## 6. DATA FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│                      SYSTEM DATA FLOW                           │
└────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐
│  Admin   │         │ End User │         │ External │
│Dashboard │         │ (Widget) │         │   APIs   │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Configure site  │                     │
     ├────────────────────┼─────────────────────┤
     │                    │                     │
     │                    │                     │
     ↓                    ↓                     ↓
┌────────────────────────────────────────────────────┐
│                  API Gateway                        │
│  - Authentication                                   │
│  - Rate Limiting                                    │
│  - Request Routing                                  │
└────────────┬───────────────────────┬────────────────┘
             │                       │
             ↓                       ↓
┌────────────────────┐   ┌──────────────────────┐
│  Auth Service      │   │  Site Service        │
│  - JWT tokens      │   │  - CRUD operations   │
│  - OAuth flow      │   │  - Site config       │
└────────────────────┘   └──────────┬───────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │  Crawler Service     │
                         │  - Queue jobs        │
                         │  - Fetch pages       │
                         │  - Extract content   │
                         └──────────┬───────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │  Embedding Service   │
                         │  - OpenAI API        │
                         │  - Generate vectors  │
                         │  - Store in Vector DB│
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼────────────────────┐
             │                      │                    │
             ↓                      ↓                    ↓
┌────────────────────┐   ┌──────────────────┐   ┌──────────────┐
│  PostgreSQL        │   │   Vector DB      │   │    Redis     │
│  - Users           │   │   - Embeddings   │   │  - Cache     │
│  - Sites           │   │   - Similarity   │   │  - Sessions  │
│  - Conversations   │   │   - Fast search  │   │  - Queue     │
│  - Billing         │   └──────────────────┘   └──────────────┘
└────────────────────┘
             │
             │
             ↓
┌────────────────────────────────────────────────────┐
│           Conversation Service                      │
│  - Receive user messages                           │
│  - Retrieve context from Vector DB                 │
│  - Call LLM API                                    │
│  - Stream responses                                │
└────────────┬───────────────────────────────────────┘
             │
             ↓
┌────────────────────┐
│  LLM Service       │
│  (OpenAI API)      │
│  - Context + Query │
│  - Generate answer │
└────────────────────┘
             │
             ↓
        Response to user
             │
             ↓
┌────────────────────────────────────────────────────┐
│           WebSocket Gateway                         │
│  - Real-time bi-directional                        │
│  - Streaming responses                             │
└────────────┬───────────────────────────────────────┘
             │
             ↓
        Widget (End User)
```

---

## 7. WIDGET INTEGRATION DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│              WIDGET INSTALLATION & OPERATION                    │
└────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│         Customer's Website                │
│  ┌─────────────────────────────────────┐  │
│  │  <html>                             │  │
│  │    <head>                           │  │
│  │      <!-- Intelligentconvo Widget -->     │  │
│  │      <script>                       │  │
│  │        (function(s,i,d,e,c,o,n,v){  │  │
│  │          ...                        │  │
│  │          s[c]('init',{              │  │
│  │            siteId:'abc123',         │  │
│  │            mode:'button'            │  │
│  │          });                        │  │
│  │        })(...);                     │  │
│  │      </script>                      │  │
│  │    </head>                          │  │
│  │    <body>                           │  │
│  │      <!-- Customer content -->      │  │
│  │    </body>                          │  │
│  │  </html>                            │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
                    │
                    │ 1. Page loads
                    ↓
┌───────────────────────────────────────────┐
│  Widget.js loads from CDN                 │
│  https://cdn.intelligentconvo.ai/widget.js       │
└───────────────────────────────────────────┘
                    │
                    │ 2. Initialize
                    ↓
┌───────────────────────────────────────────┐
│  Widget renders on page                   │
│                                           │
│  [💬] ← Chat button (bottom-right)       │
│                                           │
│  - Isolated in Shadow DOM                 │
│  - No CSS conflicts                       │
│  - Responsive positioning                 │
└───────────────────────────────────────────┘
                    │
                    │ 3. User clicks
                    ↓
┌───────────────────────────────────────────┐
│  Establish WebSocket connection           │
│                                           │
│  wss://api.intelligentconvo.ai/ws?               │
│    siteId=abc123&                         │
│    sessionId=xyz789                       │
└───────────────────────────────────────────┘
                    │
                    │ 4. Fetch config
                    ↓
┌───────────────────────────────────────────┐
│  GET /api/sites/abc123/starters           │
│                                           │
│  Response:                                │
│  {                                        │
│    "welcome": "Welcome to Mojo...",      │
│    "starters": [                         │
│      "How do I sign up?",                │
│      "Can I send money abroad?"          │
│    ]                                     │
│  }                                       │
└───────────────────────────────────────────┘
                    │
                    │ 5. Display UI
                    ↓
┌───────────────────────────────────────────┐
│          Chat Interface                   │
│  ┌─────────────────────────────────────┐  │
│  │ Welcome message                     │  │
│  │ [Starter buttons]                   │  │
│  │                                     │  │
│  │ [Input field]           [🎤]       │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
                    │
                    │ 6. User sends message
                    ↓
┌───────────────────────────────────────────┐
│  WebSocket.send({                         │
│    type: 'message',                       │
│    content: 'Where can I use Mojo?'       │
│  })                                       │
└───────────────────────────────────────────┘
                    │
                    ↓
            Backend processes
                    │
                    ↓
┌───────────────────────────────────────────┐
│  WebSocket receives response              │
│                                           │
│  {                                        │
│    type: 'stream',                        │
│    chunk: 'You can use...'                │
│  }                                        │
└───────────────────────────────────────────┘
                    │
                    │ 7. Display response
                    ↓
┌───────────────────────────────────────────┐
│  Append to chat UI                        │
│  - Typing animation                       │
│  - Streaming text                         │
│  - Auto-scroll                            │
└───────────────────────────────────────────┘
```

---

## 8. ADMIN INTERFACE SITEMAP

```
intelligentconvo.ai
│
├─ Landing Page
│  ├─ Features
│  ├─ Pricing
│  ├─ Login/Sign Up
│  └─ Documentation
│
├─ Authentication
│  ├─ OAuth Selection
│  └─ Callback Handler
│
└─ Dashboard (Authenticated)
   │
   ├─ My Dashboard
   │  ├─ Connected Sites List
   │  │  └─ Site Card
   │  │     ├─ Site icon & name
   │  │     ├─ URL count
   │  │     ├─ Trial/Active status
   │  │     └─ Manage link
   │  └─ + Add Site button
   │
   ├─ Site Management
   │  │
   │  ├─ Overview Tab
   │  │  ├─ What Does Intelligentconvo Know?
   │  │  ├─ How Does Intelligentconvo Represent You?
   │  │  ├─ Who is Intelligentconvo Talking to?
   │  │  └─ How can I try Intelligentconvo?
   │  │
   │  ├─ Sitemap & URLs Tab
   │  │  ├─ Search URLs
   │  │  ├─ Filter (All/Active/Excluded)
   │  │  ├─ URL List Table
   │  │  │  └─ Per URL actions:
   │  │  │     ├─ Recrawl
   │  │  │     ├─ Exclude/Include
   │  │  │     ├─ Save to links
   │  │  │     └─ View details
   │  │  └─ + New URL button
   │  │     ├─ Add One URL
   │  │     └─ Bulk Add URLs
   │  │
   │  ├─ PDFs & Knowledge Tab
   │  │  ├─ Search files
   │  │  ├─ File list
   │  │  └─ + Add File
   │  │     ├─ Drag & Drop
   │  │     └─ Click to browse
   │  │
   │  ├─ Conversations Tab
   │  │  ├─ Users list (left panel)
   │  │  ├─ Conversation list (middle panel)
   │  │  └─ Chat view (right panel)
   │  │     ├─ Message thread
   │  │     └─ View Details expansion
   │  │
   │  ├─ Site Preferences Tab
   │  │  │
   │  │  ├─ Site Info
   │  │  │  ├─ Site Name
   │  │  │  ├─ Site Description
   │  │  │  ├─ Special Instructions
   │  │  │  └─ Industry
   │  │  │
   │  │  ├─ Conversation Starters
   │  │  │  ├─ Welcome Message
   │  │  │  ├─ Starters List
   │  │  │  ├─ + Add button
   │  │  │  └─ Preview
   │  │  │
   │  │  ├─ Active Host Names
   │  │  │  └─ Domains table
   │  │  │     └─ Enable/Disable toggle
   │  │  │
   │  │  └─ Danger Zone
   │  │     └─ Delete Site
   │  │        └─ (blocked if active subscription)
   │  │
   │  ├─ Widget & Button Tab
   │  │  ├─ Install Code
   │  │  │  ├─ Button Mode preview
   │  │  │  ├─ Widget Mode preview
   │  │  │  └─ Installation code snippet
   │  │  │
   │  │  └─ Preview Widget
   │  │
   │  └─ Playground Tab
   │     └─ Test chat interface
   │
   └─ Account Settings
      │
      ├─ Subscriptions
      │  └─ Active subscriptions list
      │     ├─ Trial/Active status
      │     ├─ Renewal date
      │     └─ Cancel button
      │
      ├─ Account (Billing Info)
      │  ├─ Billing information form
      │  │  ├─ Full Name
      │  │  ├─ Email
      │  │  ├─ Address
      │  │  ├─ City, State
      │  │  ├─ Country
      │  │  └─ Postal Code
      │  │
      │  └─ Delete Account
      │     └─ (blocked if active subscription)
      │
      └─ Billing History
         └─ Transactions table
            ├─ Invoice ID
            ├─ Date
            ├─ Site
            ├─ Amount
            └─ Status
```

---

## 9. DECISION TREE: When to Recrawl

```
┌────────────────────────────────────────────────────────────────┐
│              RECRAWL DECISION LOGIC                            │
└────────────────────────────────────────────────────────────────┘

                    Site created or URL added
                              │
                              ↓
                    ┌─────────────────┐
                    │ Immediate crawl │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │  Content stored │
                    │  Embeddings     │
                    │  generated      │
                    └────────┬────────┘
                             │
                             ↓
              ┌──────────────┴───────────────┐
              │                              │
              ↓                              ↓
    User triggers manual           Scheduled auto-crawl
         recrawl                         (daily)
              │                              │
              ↓                              ↓
    ┌──────────────────┐         ┌──────────────────┐
    │ Recrawl URL      │         │ Check all URLs   │
    │ immediately      │         │ last_crawled_at  │
    └──────────────────┘         └────────┬─────────┘
                                          │
                                          ↓
                              ┌──────────────────────┐
                              │ If > 24 hours old:   │
                              │ - Fetch page         │
                              │ - Compare content    │
                              │                      │
                              │ If changed:          │
                              │ - Update DB          │
                              │ - Regenerate         │
                              │   embeddings         │
                              │                      │
                              │ If unchanged:        │
                              │ - Update timestamp   │
                              │ - Skip embeddings    │
                              └──────────────────────┘

Recrawl Triggers:
✓ New site added → Crawl all discovered pages
✓ Manual recrawl button → Crawl specific URL immediately
✓ User adds new URL → Crawl new URL immediately
✓ Scheduled job (daily) → Recrawl all URLs older than 24 hours
✓ User uploads new PDF → Process PDF immediately
✓ Content hash mismatch → Regenerate embeddings
```

---

## 10. ERROR HANDLING FLOW

```
┌────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                      │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   User Action        │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│  Try Operation       │
└──────────┬───────────┘
           │
           ↓
     ┌─────────┐
     │ Success?│
     └────┬────┘
          │
    ┌─────┴─────┐
    │           │
   YES          NO
    │           │
    ↓           ↓
Return      Categorize
Result        Error
              │
              ├─→ Network Error
              │   └─→ Retry with exponential backoff
              │       └─→ Max 3 retries
              │           ├─→ Success: Continue
              │           └─→ Fail: Show error to user
              │
              ├─→ Authentication Error
              │   └─→ Redirect to login
              │
              ├─→ Rate Limit Error
              │   └─→ Show "Too many requests" message
              │       └─→ Suggest waiting 1 minute
              │
              ├─→ Validation Error
              │   └─→ Show field-specific error
              │       └─→ Allow user to correct
              │
              ├─→ Payment Error
              │   └─→ Show payment failure message
              │       └─→ Allow retry or update payment method
              │
              ├─→ Crawl Error (404, 500, etc.)
              │   └─→ Mark URL as failed
              │       └─→ Log error
              │           └─→ Show in admin panel
              │
              ├─→ LLM API Error
              │   └─→ Fallback response:
              │       "I'm having trouble right now. 
              │        Please try again in a moment."
              │
              └─→ Unknown Error
                  └─→ Log to error tracking (Sentry)
                      └─→ Show generic error message
                          └─→ "Something went wrong. 
                               We've been notified."

All errors:
- Logged to monitoring system
- User-friendly message displayed
- No technical details exposed to end users
- Admin notified if critical
```

---

This completes the visual flow documentation. These diagrams complement the comprehensive analysis document and provide clear visual representations of:

1. User onboarding journey
2. Site configuration workflows
3. End-user chat experience
4. Backend processing
5. Subscription lifecycle
6. System data flow
7. Widget integration
8. Admin interface structure
9. Recrawl decision logic
10. Error handling strategy

These can be used as reference for development, onboarding new team members, or explaining the system to stakeholders.
