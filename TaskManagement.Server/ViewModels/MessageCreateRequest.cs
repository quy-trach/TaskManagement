using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class MessageCreateRequest
    {
        [JsonPropertyName("conversationId")]
        public int ConversationID { get; set; }

        [JsonPropertyName("receiverId")]
        public int? ReceiverID { get; set; } // NULL cho tin nhắn nhóm

        [JsonPropertyName("content")]
        public string Content { get; set; }

        public MessageCreateRequest()
        {
           
            Content = string.Empty;
        }
        public MessageCreateRequest(int conversationId, int? receiverId, string content)
        {
            ConversationID = conversationId;
            ReceiverID = receiverId;
            Content = content;
        }
    }
}
