using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class ConversationCreateRequest
    {
        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentID { get; set; }

        [JsonPropertyName("participantIds")]
        public List<int> ParticipantIds { get; set; } // Danh sách UserID

        public ConversationCreateRequest()
        {
            Title = string.Empty;
            ParticipantIds = new List<int>();
        }

        public ConversationCreateRequest(string title, int? departmentId, List<int> participantIds)
        {
            Title = title;
            DepartmentID = departmentId;
            ParticipantIds = participantIds;
        }
    }
}
