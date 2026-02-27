async function sendTeamsNotification(webhookUrl: string, message: string) {
  const payload = {
    text: message,
    // Hoặc sử dụng Adaptive Card cho format đẹp hơn:
    // "@type": "MessageCard",
    // "@context": "https://schema.org/extensions",
    // "summary": "Thông báo từ MCP Server",
    // "sections": [{
    //   "activityTitle": "MCP Server Alert",
    //   "activitySubtitle": new Date().toISOString(),
    //   "text": message
    // }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Teams webhook failed: ${response.statusText}`);
  }
  
  return response;
}

// Sử dụng trong MCP server
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || "YOUR_WEBHOOK_URL";

// Gửi thông báo khi có event
await sendTeamsNotification(TEAMS_WEBHOOK_URL, "⚠️ MCP Server: Có lỗi xảy ra!");