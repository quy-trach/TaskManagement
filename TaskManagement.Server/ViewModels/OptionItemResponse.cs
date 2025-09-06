using System.Text.Json.Serialization;
namespace TaskManagement.Server.ViewModels
{
    public class OptionItemResponse
    {
        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("selected")]
        public bool Selected { get; set; } = false;

        public OptionItemResponse()
        {
            Value = string.Empty;
            Text = string.Empty;
            Selected = false;
        }

        public OptionItemResponse(string value, string text, bool selected)
        {
            Value = value;
            Text = text;
            Selected = selected;
        }
    }

}
