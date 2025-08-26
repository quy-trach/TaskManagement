using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class ApiResponse
    {
        [JsonPropertyName("success")]
        public bool? Success { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("data")]
        public object? Data { get; set; }

        public ApiResponse()
        {
            Success = null;
            Message = null;
            Data = null;
        }

        public ApiResponse(bool success, string message, object data)
        {
            Success = success;
            Message = message;
            Data = data;
        }
    }
}
