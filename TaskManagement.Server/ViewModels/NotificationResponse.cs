using System.Text.Json.Serialization;
namespace TaskManagement.Server.ViewModels
{
    public class NotificationResponse
    {
        [JsonPropertyName("notificationId")]
        public int NotificationID { get; set; }

        [JsonPropertyName("userId")]
        public int UserID { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; } // Định dạng dd/MM/yyyy HH:mm:ss

        [JsonPropertyName("messageId")]
        public int? MessageID { get; set; } // Liên kết với tin nhắn

        public string SenderName { get; set; } = string.Empty; 
        public string SenderAvatar { get; set; } = string.Empty; 

        public NotificationResponse()
        {
            NotificationID = 0;
            UserID = 0;
            Message = string.Empty;
            CreatedAt = string.Empty;
            IsRead = false;
            MessageID = null;

        }
        public NotificationResponse(int notificationId, int userId, string message, bool isRead, string createdAt, int? messageId)
        {
            NotificationID = notificationId;
            UserID = userId;
            Message = message;
            IsRead = isRead;
            CreatedAt = createdAt;
            MessageID = messageId;
        }
    }
}
