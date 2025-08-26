using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class ProjectRequest
    {
        [JsonPropertyName("projectName")]
        public string ProjectName { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        // Constructor mặc định
        public ProjectRequest()
        {
            ProjectName = string.Empty;
            Description = string.Empty;
            StartDate = null;
            EndDate = null;
            Status = string.Empty;
        }

        // Constructor đầy đủ
        public ProjectRequest(string projectName, string description, DateTime? startDate, DateTime? endDate, string status)
        {
            ProjectName = projectName ?? string.Empty;
            Description = description ?? string.Empty;
            StartDate = startDate;
            EndDate = endDate;
            Status = status ?? string.Empty;
        }
    }
}