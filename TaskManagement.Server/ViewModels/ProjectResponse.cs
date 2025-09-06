using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class ProjectResponse
    {
        [JsonPropertyName("projectID")]
        public int ProjectID { get; set; }

        [JsonPropertyName("projectName")]
        public string ProjectName { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("createdBy")]
        public int? CreatedBy { get; set; }

        [JsonPropertyName("createdByName")]
        public string CreatedByName { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; }

        // Constructor mặc định
        public ProjectResponse()
        {
            ProjectID = 0;
            ProjectName = string.Empty;
            Description = string.Empty;
            StartDate = string.Empty;
            EndDate = string.Empty;
            Status = string.Empty;
            CreatedBy = null;
            CreatedByName = string.Empty;
            CreatedAt = string.Empty;
        }

        // Constructor đầy đủ
        public ProjectResponse(int projectID, string projectName, string description, string startDate, string endDate, string status, int? createdBy, string createdByName, string createdAt)
        {
            ProjectID = projectID;
            ProjectName = projectName ?? string.Empty;
            Description = description ?? string.Empty;
            StartDate = startDate ?? string.Empty;
            EndDate = endDate ?? string.Empty;
            Status = status ?? string.Empty;
            CreatedBy = createdBy;
            CreatedByName = createdByName ?? string.Empty;
            CreatedAt = createdAt ?? string.Empty;
        }
    }
}