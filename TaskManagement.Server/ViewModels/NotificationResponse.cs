using System.Text.Json.Serialization;
namespace TaskManagement.Server.ViewModels
{
    public class NotificationResponse
    {
        [JsonPropertyName("notificationID")]
        public int NotificationID { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("isRead")]
        public bool IsRead { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; }

        [JsonPropertyName("timeAgo")]
        public string TimeAgo { get; set; }

        public NotificationResponse()
        {
            NotificationID = 0;
            Message = string.Empty;
            IsRead = false;
            CreatedAt = string.Empty;
            TimeAgo = string.Empty;
        }

        public NotificationResponse(int notificationID, string message, bool isRead, string createdAt, string timeAgo)
        {
            NotificationID = notificationID;
            Message = message;
            IsRead = isRead;
            CreatedAt = createdAt;
            TimeAgo = timeAgo;
        }
    }
}
