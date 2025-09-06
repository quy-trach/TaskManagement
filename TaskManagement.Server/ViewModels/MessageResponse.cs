using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class MessageResponse
    {
        [JsonPropertyName("messageId")]
        public int MessageID { get; set; }

        [JsonPropertyName("conversationId")]
        public int ConversationID { get; set; }

        [JsonPropertyName("senderId")]
        public int SenderID { get; set; }

        [JsonPropertyName("senderName")]
        public string SenderName { get; set; }

        [JsonPropertyName("senderAvatar")]
        public string SenderAvatar { get; set; }

        [JsonPropertyName("receiverId")]
        public int? ReceiverID { get; set; }

        [JsonPropertyName("receiverName")]
        public string ReceiverName { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }

        [JsonPropertyName("sentAt")]
        public string SentAt { get; set; } // Định dạng dd/MM/yyyy HH:mm:ss

        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; } // Để hiển thị .seen

        [JsonPropertyName("status")]
        public string Status { get; set; } // 'sent', 'delivered', 'read'

        public MessageResponse()
        {
            SenderName = string.Empty;
            SenderAvatar = string.Empty;
            ReceiverName = string.Empty;
            Content = string.Empty;
            SentAt = string.Empty;
            Status = string.Empty;
        }

        public MessageResponse(int messageId, int conversationId, int senderId, string senderName, string senderAvatar, int? receiverId, string receiverName, string content, string sentAt, bool isRead, string status)
        {
            MessageID = messageId;
            ConversationID = conversationId;
            SenderID = senderId;
            SenderName = senderName;
            SenderAvatar = senderAvatar;
            ReceiverID = receiverId;
            ReceiverName = receiverName;
            Content = content;
            SentAt = sentAt;
            IsRead = isRead;
            Status = status;
        }
    }
}
