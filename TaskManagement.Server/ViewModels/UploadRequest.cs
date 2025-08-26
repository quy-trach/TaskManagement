using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class UploadRequest
    {
        [JsonPropertyName("url")]
        public string Url { get; set; }

        public UploadRequest()
        {
            Url = string.Empty;
        }

        public UploadRequest(string url)
        {
            Url = url;
        }
    }
}
