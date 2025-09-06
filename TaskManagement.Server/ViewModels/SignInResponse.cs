using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class SignInResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = false;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;

        [JsonPropertyName("userData")]
        public UserData? UserData { get; set; }
    }
    public class UserData
    {
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [JsonPropertyName("fullName")]
        public string FullName { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("avatar")]
        public string Avatar { get; set; } = string.Empty;

        [JsonPropertyName("roleId")]
        public int? RoleID { get; set; }

        [JsonPropertyName("roleName")]
        public string RoleName { get; set; }  = string.Empty;
    }
}
