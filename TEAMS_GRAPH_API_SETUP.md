# Gửi Teams notification qua Microsoft Graph API

Cách này **KHÔNG CẦN** Power Automate account trả phí! Chỉ cần Azure AD app registration (miễn phí).

## Bước 1: Tạo Azure App Registration

1. Vào **Azure Portal**: https://portal.azure.com
2. Tìm **App registrations** (hoặc "Đăng ký ứng dụng")
3. Click **+ New registration**
4. Điền thông tin:
   - **Name**: `Teams MCP Notifier` (tên gì cũng được)
   - **Supported account types**: Chọn "Accounts in this organizational directory only"
   - **Redirect URI**: Để trống
5. Click **Register**

### Lưu lại thông tin:
- **Application (client) ID** → Copy giá trị này
- **Directory (tenant) ID** → Copy giá trị này

## Bước 2: Tạo Client Secret

1. Trong app vừa tạo, click **Certificates & secrets** (menu bên trái)
2. Click **+ New client secret**
3. Description: `MCP Server Secret`
4. Expires: Chọn thời hạn (recommend: 24 months)
5. Click **Add**
6. **⚠️ QUAN TRỌNG**: Copy **Value** ngay (chỉ hiện 1 lần!)

## Bước 3: Add API Permissions

1. Click **API permissions** (menu bên trái)
2. Click **+ Add a permission**
3. Chọn **Microsoft Graph**
4. Chọn **Application permissions** (KHÔNG phải Delegated)
5. Tìm và chọn:
   - ✅ `Chat.ReadWrite.All` - Để gửi message vào chat
   - ✅ `ChatMessage.Send` - Để send message
6. Click **Add permissions**
7. **⚠️ QUAN TRỌNG**: Click **Grant admin consent for [Your Organization]**
   - Phải có admin permission để làm bước này
   - Nếu không có quyền admin, nhờ IT admin làm giúp

## Bước 4: Lấy Chat ID

### Cách 1: Dùng Graph Explorer (Đơn giản)
1. Vào: https://developer.microsoft.com/graph/graph-explorer
2. Sign in với Teams account của bạn
3. Chạy query:
   ```
   GET https://graph.microsoft.com/v1.0/me/chats
   ```
4. Tìm chat bạn muốn gửi notification trong danh sách
5. Copy **id** của chat đó (dạng: `19:abc123...@thread.v2`)

### Cách 2: Dùng PowerShell
```powershell
# Install module (chỉ cần 1 lần)
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect
Connect-MgGraph -Scopes "Chat.Read"

# List chats
Get-MgUserChat | Select-Object Id, Topic, ChatType
```

## Bước 5: Update .env file

Thêm vào file `.env`:

```bash
# Azure App Registration (for Graph API)
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# Teams Chat ID
TEAMS_CHAT_ID=19:abc123...@thread.v2
```

## Bước 6: Test!

```bash
# Install dependencies nếu chưa có
npm install

# Test gửi message
node teams-graph-api.js "Test message from MCP!"

# Hoặc dùng npm script
npm run teams-notify "Hello from Azure DevOps MCP!"
```

---

## Troubleshooting

### Error: "Forbidden" hoặc "403"
- Kiểm tra đã **Grant admin consent** cho permissions chưa
- Đảm bảo app có permissions: `Chat.ReadWrite.All` và `ChatMessage.Send`

### Error: "Resource not found" hoặc "404"
- Chat ID không đúng
- Kiểm tra lại Chat ID từ Graph Explorer

### Error: "Invalid client secret"
- Client secret đã expired hoặc copy sai
- Tạo client secret mới trong Azure Portal

### Không nhận được message
- Kiểm tra bot/app đã được add vào chat chưa
- Thử gửi message thủ công qua Graph Explorer để test

---

## Bonus: Gửi Adaptive Card (Message đẹp hơn)

Sửa content trong `teams-graph-api.js`:

```javascript
const messageBody = JSON.stringify({
    body: {
        contentType: 'html',
        content: `<h2>🔔 Notification</h2><p>${message}</p>`
    }
});
```

Hoặc dùng Adaptive Card format:

```javascript
const messageBody = JSON.stringify({
    body: {
        contentType: 'text',
        content: message
    },
    attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [{
                type: 'TextBlock',
                text: message,
                size: 'Medium',
                weight: 'Bolder'
            }]
        }
    }]
});
```

---

## So sánh với Power Automate

| Feature | Graph API | Power Automate |
|---------|-----------|----------------|
| Cost | ✅ Free | ❌ Cần premium account |
| Setup | ⚠️ Phức tạp hơn | ✅ Đơn giản |
| Control | ✅ Full control | ⚠️ Giới hạn |
| Customization | ✅ Adaptive Cards, HTML | ⚠️ Limited |
| Performance | ✅ Nhanh | ⚠️ Có delay |

**Kết luận**: Graph API phức tạp hơn setup nhưng free và linh hoạt hơn nhiều!
