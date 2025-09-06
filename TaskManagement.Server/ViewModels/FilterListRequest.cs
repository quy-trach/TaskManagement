using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class FilterListRequest
    {
        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("department")]
        public string? Department { get; set; }

        [JsonPropertyName("keyword")]
        public string? Keyword { get; set; }

        [JsonPropertyName("page")]
        public int? Page { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        public FilterListRequest()
        {
            Role = string.Empty;
            Department = string.Empty;
            Keyword = string.Empty;
            Status = string.Empty;
            Page = 1;
        }

        public FilterListRequest(string role, string department, string keyword, int page, string status)
        {
            Role = role;
            Department = department;
            Keyword = keyword;
            Page = page;
            Status = status;
        }
    }
}
