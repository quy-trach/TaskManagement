using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class StatusRequest
    {
        [JsonPropertyName("status")]
        public bool Status { get; set; }

        public StatusRequest()
        {
            Status = false;
        }

        public StatusRequest(bool status)
        {
            Status = status;
        }
    }
}
