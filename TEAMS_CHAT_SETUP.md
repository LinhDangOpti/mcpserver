# Cách gửi notification vào Teams Chat

## Option 1: Power Automate Flow (Đơn giản nhất)

### Tạo Flow mới:

1. Vào https://make.powerautomate.com
2. Click **+ Create** → **Automated cloud flow**
3. Đặt tên: "Send notification to Teams chat"
4. Skip trigger selection → Click **Create**

### Configure Flow:

#### Step 1: Add Trigger
- Search và chọn: **"When a HTTP request is received"**
- Click **Generate from sample** 
- Paste JSON schema:
```json
{
    "text": "Sample message",
    "title": "Optional title"
}
```
- Click **Done**

#### Step 2: Add Action
- Click **+ New step**
- Search: **"Post message in a chat or channel"** (Microsoft Teams)
- Configure:
  - **Post as**: Flow bot
  - **Post in**: 
    - "Chat with Flow bot" - gửi trực tiếp cho 1 người
    - "Group chat" - gửi vào group chat
  - **Recipient** (nếu chọn Chat with Flow bot): Email của bạn hoặc người nhận
  - **Group chat** (nếu chọn Group chat): Chọn group chat từ dropdown
  - **Message**: Click vào field và chọn **Dynamic content** → `text`

#### Step 3: Save và lấy Webhook URL
- Click **Save**
- Click vào trigger "When a HTTP request is received"
- Copy **HTTP POST URL**
- Update vào file `.env`:
```bash
TEAMS_WEBHOOK_URL=<url_vừa_copy>
```

---

## Option 2: Microsoft Graph API (Advanced)

Cần App Registration và permissions:
- `Chat.ReadWrite`
- `ChatMessage.Send`

### 1. Create Azure App Registration:
```bash
# Vào Azure Portal → App registrations → New registration
# Sau đó add API permissions: Microsoft Graph → Chat.ReadWrite
```

### 2. Get Chat ID:
```bash
# Dùng Graph Explorer: https://developer.microsoft.com/graph/graph-explorer
# GET: https://graph.microsoft.com/v1.0/me/chats
```

### 3. Send message via Graph API:
```javascript
const axios = require('axios');

async function sendTeamsChat(message) {
    const chatId = 'YOUR_CHAT_ID';
    const accessToken = 'YOUR_ACCESS_TOKEN';
    
    await axios.post(
        `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
        {
            body: {
                content: message
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
}
```

---

## Recommendation:

**Dùng Option 1 (Power Automate)** - đơn giản, không cần code, không cần permissions phức tạp!

Sau khi setup xong, test bằng:
```bash
npm run test-webhook
```
