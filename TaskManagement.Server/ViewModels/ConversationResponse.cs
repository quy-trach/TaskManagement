using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class ConversationResponse
    {
        [JsonPropertyName("conversationId")]
        public int ConversationID { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; } // Định dạng dd/MM/yyyy HH:mm:ss

        [JsonPropertyName("lastMessageAt")]
        public string LastMessageAt { get; set; } // Định dạng dd/MM/yyyy HH:mm:ss

        [JsonPropertyName("departmentId")]
        public int? DepartmentID { get; set; }

        [JsonPropertyName("departmentName")]
        public string DepartmentName { get; set; }

        [JsonPropertyName("unreadCount")]
        public int UnreadCount { get; set; } // Số tin nhắn chưa đọc cho .unread-count

        [JsonPropertyName("participants")]
        public List<UserOptionResponse> Participants { get; set; }

        public ConversationResponse()
        {
            Title = string.Empty;
            CreatedAt = string.Empty;
            LastMessageAt = string.Empty;
            DepartmentName = string.Empty;
            Participants = new List<UserOptionResponse>();
        }

        public ConversationResponse(int conversationId, string title, string createdAt, string lastMessageAt, int? departmentId, string departmentName, int unreadCount, List<UserOptionResponse> participants)
        {
            ConversationID = conversationId;
            Title = title;
            CreatedAt = createdAt;
            LastMessageAt = lastMessageAt;
            DepartmentID = departmentId;
            DepartmentName = departmentName;
            UnreadCount = unreadCount;
            Participants = participants;
        }
    }
}
