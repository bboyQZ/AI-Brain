# Chat UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `AI-Brain` 对话页改造成更接近 ChatGPT 的深色聊天体验，并补齐会话自动标题与删除能力。

**Architecture:** 先补后端会话 API 和自动标题逻辑，再扩展前端会话状态层，最后重做消息区、输入区和侧边栏样式。整体保持现有组件结构，不引入新依赖，不改数据库 schema。

**Tech Stack:** FastAPI, SQLite, pytest, React, TypeScript, Vite, CSS

---

## File Map

### Backend

- Modify: `app/models/schemas.py`
  - 新增更新标题请求体，保持 `sessions` 路由的请求/响应类型集中定义。
- Modify: `app/services/session_store.py`
  - 实现自动标题、更新标题、删除会话。
- Modify: `app/routers/sessions.py`
  - 暴露 `PATCH /sessions/{id}` 与 `DELETE /sessions/{id}`。
- Modify: `tests/test_sessions.py`
  - 覆盖自动标题、更新标题、删除会话及删除后的 404 行为。

### Frontend

- Modify: `frontend/src/api/client.ts`
  - 补 `updateSessionTitle` / `deleteSession`。
- Modify: `frontend/src/hooks/useSession.ts`
  - 增加删除会话、局部同步标题、删除后的回退选择逻辑。
- Modify: `frontend/src/pages/ChatPage.tsx`
  - 连接示例问题发送、侧边栏删除、新布局容器。
- Modify: `frontend/src/pages/ChatPage.css`
  - 定义主区居中列、底部输入区容器。
- Modify: `frontend/src/components/chat/MessageList.tsx`
  - 增加示例问题、头像结构、流式状态节点。
- Modify: `frontend/src/components/chat/MessageList.css`
  - 调整消息区、气泡、空状态、引用标签、typing 动画。
- Modify: `frontend/src/components/chat/MessageInput.tsx`
  - 支持自动增高和可复用的 `initialText`/示例问题注入。
- Modify: `frontend/src/components/chat/MessageInput.css`
  - 改为悬浮卡片式输入框。
- Modify: `frontend/src/components/chat/SessionSidebar.tsx`
  - 支持删除按钮、时间次级展示。
- Modify: `frontend/src/components/chat/SessionSidebar.css`
  - 实现更克制的侧边栏视觉。
- Modify: `frontend/src/utils/markdown.ts`
  - 对 `[引自: ...]` / `[引自：...]` 做轻量标签化。
- Modify: `frontend/src/index.css`
  - 微调颜色 token、阴影变量与基础按钮表现。

---

### Task 1: Backend session behaviors

**Files:**
- Modify: `app/models/schemas.py`
- Modify: `app/services/session_store.py`
- Modify: `app/routers/sessions.py`
- Test: `tests/test_sessions.py`

- [ ] **Step 1: Write the failing backend tests**

```python
def test_first_user_message_auto_titles_new_session(client):
    session = client.post("/sessions", json={"title": "新对话"}).json()
    sid = session["id"]

    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "什么是 Transformer 的残差连接"})

    listed = client.get("/sessions").json()
    current = next(item for item in listed if item["id"] == sid)
    assert current["title"] == "什么是 Transformer 的残差连接"


def test_patch_session_title(client):
    session = client.post("/sessions", json={"title": "旧标题"}).json()
    sid = session["id"]

    resp = client.patch(f"/sessions/{sid}", json={"title": "新标题"})

    assert resp.status_code == 200
    assert resp.json()["title"] == "新标题"


def test_delete_session_removes_messages_and_session(client):
    session = client.post("/sessions", json={"title": "待删除"}).json()
    sid = session["id"]
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "hello"})

    resp = client.delete(f"/sessions/{sid}")
    assert resp.status_code == 204

    history = client.get(f"/sessions/{sid}")
    assert history.status_code == 404
    listed = client.get("/sessions").json()
    assert all(item["id"] != sid for item in listed)
```

- [ ] **Step 2: Run backend session tests to verify failure**

Run: `pytest "d:\develop\AI-Brain\tests\test_sessions.py" -v`

Expected: FAIL because `PATCH /sessions/{id}` and `DELETE /sessions/{id}` do not exist yet, and auto-title behavior is missing.

- [ ] **Step 3: Add request schema for title updates**

```python
class SessionUpdate(BaseModel):
    title: str
```

Place it in `app/models/schemas.py` next to `SessionCreate` / `SessionInfo`.

- [ ] **Step 4: Implement store-layer helpers**

```python
DEFAULT_SESSION_TITLE = "新对话"


def _derive_session_title(content: str, limit: int = 20) -> str:
    normalized = " ".join(content.split())
    if len(normalized) <= limit:
        return normalized or DEFAULT_SESSION_TITLE
    return normalized[:limit].rstrip() + "..."


def update_session_title(session_id: int, title: str) -> SessionInfo | None:
    conn = get_conn()
    conn.execute("UPDATE sessions SET title=? WHERE id=?", (title, session_id))
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return SessionInfo(id=row["id"], title=row["title"], created_at=row["created_at"])


def delete_session(session_id: int) -> bool:
    conn = get_conn()
    conn.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
    cur = conn.execute("DELETE FROM sessions WHERE id=?", (session_id,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0
```

Also update `add_message()` so that after inserting a user message it checks whether the session title is still `DEFAULT_SESSION_TITLE` and whether this is the first user message for that session; if so, update the title using `_derive_session_title(content)`.

- [ ] **Step 5: Expose patch/delete routes**

```python
@router.patch("/{session_id}", response_model=SessionInfo)
def update(session_id: int, req: SessionUpdate) -> SessionInfo:
    session = update_session_title(session_id, req.title)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    return session


@router.delete("/{session_id}", status_code=204)
def remove(session_id: int) -> None:
    ok = delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="session not found")
```

Update imports in `app/routers/sessions.py` accordingly.

- [ ] **Step 6: Run backend tests to verify pass**

Run: `pytest "d:\develop\AI-Brain\tests\test_sessions.py" -v`

Expected: PASS for create/list/history plus new auto-title / patch / delete tests.

- [ ] **Step 7: Commit backend session behavior**

```bash
git add app/models/schemas.py app/services/session_store.py app/routers/sessions.py tests/test_sessions.py
git commit -m "feat: add session title and delete behaviors"
```

---

### Task 2: Frontend session state and API integration

**Files:**
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/hooks/useSession.ts`
- Modify: `frontend/src/pages/ChatPage.tsx`

- [ ] **Step 1: Add the failing session-state behavior checks manually**

Open the app and verify these scenarios currently fail or are missing:

1. Hover a session item: there is no delete action
2. Send the first message in a `新对话`: sidebar title does not auto-refresh without reloading
3. Delete-current-session fallback does not exist

This task uses manual verification because the repo has no existing frontend test harness for React components.

- [ ] **Step 2: Extend the API client**

```ts
async updateSessionTitle(id: number, title: string): Promise<SessionInfo> {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
},

async deleteSession(id: number): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
},
```

- [ ] **Step 3: Expand `useSession()` with list synchronization and delete behavior**

Implement these public methods in `frontend/src/hooks/useSession.ts`:

```ts
const syncSession = useCallback((session: SessionInfo) => {
  setSessions((prev) => prev.map((item) => item.id === session.id ? session : item));
}, []);

const refreshSessions = useCallback(async () => {
  const list = await api.listSessions();
  setSessions(list);
  return list;
}, []);

const removeSession = useCallback(async (id: number) => {
  await api.deleteSession(id);
  const nextList = sessions.filter((s) => s.id !== id);

  if (currentId === id) {
    const next = nextList[0] ?? await api.createSession("新对话");
    const normalized = nextList[0] ? nextList : [next];
    setSessions(normalized);
    setCurrentId(next.id);
    localStorage.setItem(SESSION_KEY, String(next.id));
    setMessages(next.id === id ? [] : messages);
    return next.id;
  }

  setSessions(nextList);
  return currentId;
}, [currentId, messages, sessions]);
```

Adjust the exact implementation so that:
- deleting the current session clears stale messages before the next history load
- deleting the last session creates and selects a fresh empty session
- `createNew()` still preserves the “already on an empty new session” shortcut

- [ ] **Step 4: Refresh title after first send**

In `ChatPage.tsx`, after `api.addMessage(...)`, refresh or locally sync the current session title:

```ts
const userMsg = await api.addMessage(sessionId, "user", text);
appendMessage(userMsg);
await refreshSessions();
```

If you prefer to avoid a full refresh, fetch the current history/session metadata and call `syncSession(...)`; do not trigger refreshes during streaming.

- [ ] **Step 5: Wire sidebar callbacks**

Update the page-level props flow:

```tsx
<SessionSidebar
  sessions={sessions}
  currentId={currentId}
  onSwitch={switchTo}
  onCreate={createNew}
  onDelete={removeSession}
/>
```

Expose any additional helpers returned by `useSession()` that the page now needs.

- [ ] **Step 6: Run focused frontend build validation**

Run: `npm run build`

Working directory: `d:\develop\AI-Brain\frontend`

Expected: PASS with no TypeScript errors after the new methods and props are wired.

- [ ] **Step 7: Commit session-state integration**

```bash
git add frontend/src/api/client.ts frontend/src/hooks/useSession.ts frontend/src/pages/ChatPage.tsx
git commit -m "feat: sync chat sessions with title and delete actions"
```

---

### Task 3: Chat layout, message list, and input redesign

**Files:**
- Modify: `frontend/src/pages/ChatPage.tsx`
- Modify: `frontend/src/pages/ChatPage.css`
- Modify: `frontend/src/components/chat/MessageList.tsx`
- Modify: `frontend/src/components/chat/MessageList.css`
- Modify: `frontend/src/components/chat/MessageInput.tsx`
- Modify: `frontend/src/components/chat/MessageInput.css`
- Modify: `frontend/src/utils/markdown.ts`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Add manual acceptance checks for the current UI**

Before editing, capture the behaviors that need to change:

1. AI message blocks span too wide on desktop
2. Empty state has no example prompts
3. Input area is a flat full-width footer bar
4. Typing indicator is plain text only
5. `[引自: ...]` content blends into normal prose

- [ ] **Step 2: Restructure the page-level layout**

Update `ChatPage.tsx` to introduce a centered content shell and example prompt handling:

```tsx
const examplePrompts = [
  "什么是 Token？",
  "RAG 是怎么工作的？",
  "帮我解释 Attention。",
];

return (
  <div className="chat-page">
    <SessionSidebar ... />
    <div className="chat-main">
      <div className="chat-main-inner">
        <MessageList
          messages={messages}
          loading={loading}
          streaming={sending}
          examplePrompts={examplePrompts}
          onSelectPrompt={handleSend}
        />
        <MessageInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  </div>
);
```

- [ ] **Step 3: Implement message list structure changes**

Replace the plain role label layout with avatar + body rows:

```tsx
{messages.map((m) => (
  <div key={m.id} className={`message-row ${m.role}`}>
    <div className={`message-avatar ${m.role}`}>{m.role === "user" ? "你" : "AI"}</div>
    <div className="message-body">
      <div className={`message-bubble ${m.role}`}>
        {m.role === "assistant" ? (
          <div
            className="message-content markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
          />
        ) : (
          <div className="message-content">{m.content}</div>
        )}
      </div>
    </div>
  </div>
))}
```

For empty state:

```tsx
{messages.length === 0 && !loading && (
  <div className="welcome-panel">
    <div className="welcome-title">AI-Brain</div>
    <div className="welcome-subtitle">和你的课程知识库对话，或从下面的问题开始。</div>
    <div className="welcome-prompts">
      {examplePrompts.map((prompt) => (
        <button key={prompt} className="prompt-chip" onClick={() => onSelectPrompt(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: Redesign input component**

Keep the API minimal, but upgrade textarea behavior:

```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  const el = textareaRef.current;
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
}, [text]);
```

Render it inside a floating card:

```tsx
<div className="message-input-shell">
  <div className="message-input">
    <textarea ref={textareaRef} ... />
    <button className="send-btn" ... aria-label="发送消息">↑</button>
  </div>
</div>
```

- [ ] **Step 5: Extend markdown rendering for source tags**

In `frontend/src/utils/markdown.ts`, after escaping and before newline conversion, add a transform like:

```ts
.replace(/\[引自[：:]\s*([^\]]+)\]/g, '<span class="source-tag">引自: $1</span>')
```

Keep the parser lightweight; do not add an external markdown library.

- [ ] **Step 6: Apply CSS redesign**

Implement the following classes across the CSS files:

```css
.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  background: var(--bg);
}

.chat-main-inner {
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.message-list {
  flex: 1;
  padding: 32px 24px 140px;
}

.message-input-shell {
  position: sticky;
  bottom: 0;
  padding: 0 24px 24px;
  background: linear-gradient(180deg, rgba(15, 15, 19, 0), rgba(15, 15, 19, 0.92) 28%);
}
```

Also add:
- `message-row`, `message-avatar`, `message-bubble`
- `welcome-panel`, `prompt-chip`
- `source-tag`
- subtle typing dots animation
- token variables such as `--panel-shadow`, `--bg-soft`

- [ ] **Step 7: Run frontend build validation**

Run: `npm run build`

Working directory: `d:\develop\AI-Brain\frontend`

Expected: PASS and generated production bundle.

- [ ] **Step 8: Manual UI verification**

Run the local app and verify:

1. Desktop chat content is visually centered
2. AI messages no longer read as oversized gray slabs
3. Example prompts can send successfully
4. Input grows for multiline text and remains compact for short prompts
5. Source tags are visually separated from prose

- [ ] **Step 9: Commit chat layout redesign**

```bash
git add frontend/src/pages/ChatPage.tsx frontend/src/pages/ChatPage.css frontend/src/components/chat/MessageList.tsx frontend/src/components/chat/MessageList.css frontend/src/components/chat/MessageInput.tsx frontend/src/components/chat/MessageInput.css frontend/src/utils/markdown.ts frontend/src/index.css
git commit -m "feat: redesign chat layout and message presentation"
```

---

### Task 4: Sidebar interaction and final verification

**Files:**
- Modify: `frontend/src/components/chat/SessionSidebar.tsx`
- Modify: `frontend/src/components/chat/SessionSidebar.css`
- Modify: `frontend/src/pages/ChatPage.tsx`
- Test: `tests/test_sessions.py` (re-run only)

- [ ] **Step 1: Add sidebar delete affordance**

Update the component props and markup:

```tsx
interface Props {
  sessions: SessionInfo[];
  currentId: number | null;
  onSwitch: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void | Promise<void>;
}
```

Render each item with an action button that stops propagation:

```tsx
<button
  className="session-delete-btn"
  onClick={(e) => {
    e.stopPropagation();
    if (window.confirm("确认删除这个对话吗？")) {
      void onDelete(s.id);
    }
  }}
  aria-label={`删除会话 ${s.title}`}
>
  ×
</button>
```

- [ ] **Step 2: Refine session item presentation**

Use title as the primary text and demote time:

```tsx
<div className="session-meta">
  <span className="session-title">{s.title}</span>
  <span className="session-time">{s.created_at.slice(0, 16)}</span>
</div>
```

If needed, trim repeated default titles visually but keep the full title in the DOM `title` attribute.

- [ ] **Step 3: Apply sidebar CSS**

Implement styles such as:

```css
.session-sidebar {
  width: 220px;
  padding: 12px 10px;
}

.session-item {
  position: relative;
  border-radius: 12px;
  padding: 10px 36px 10px 12px;
}

.session-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: var(--accent);
}

.session-delete-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
}
```

Also ensure the delete button becomes visible on hover and on the active item.

- [ ] **Step 4: Run backend and frontend verification**

Run backend tests:

`pytest "d:\develop\AI-Brain\tests\test_sessions.py" -v`

Run frontend build:

`npm run build`

Working directory: `d:\develop\AI-Brain\frontend`

Expected: both commands PASS.

- [ ] **Step 5: Manual end-to-end verification**

With the local app running, verify:

1. New empty session does not duplicate when already blank
2. First user message updates the sidebar title
3. Hovering a session reveals delete
4. Deleting a non-current session leaves the current conversation untouched
5. Deleting the current session switches correctly
6. Deleting the last remaining session creates a fresh blank session

- [ ] **Step 6: Commit sidebar and verification pass**

```bash
git add frontend/src/components/chat/SessionSidebar.tsx frontend/src/components/chat/SessionSidebar.css frontend/src/pages/ChatPage.tsx
git commit -m "feat: improve sidebar session interactions"
```

---

## Self-Review

### Spec coverage

- 主区域布局重做：Task 3
- 消息气泡与空状态优化：Task 3
- 输入框悬浮卡片：Task 3
- 侧边栏视觉优化：Task 4
- 首条消息自动标题：Task 1 + Task 2
- 删除会话能力：Task 1 + Task 2 + Task 4
- Markdown / 引用样式优化：Task 3
- 不改 schema / 不引入新依赖：File Map + all tasks follow this

### Placeholder scan

- 无 `TODO` / `TBD`
- 每个任务都给了精确文件路径、命令、预期结果和代码片段

### Type consistency

- 后端使用 `SessionUpdate`, `update_session_title`, `delete_session`
- 前端使用 `refreshSessions`, `syncSession`, `removeSession`
- `SessionSidebar` props 在 Task 2 / Task 4 中保持一致
