using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class UserOptionResponse
    {
        [JsonPropertyName("userId")]
        public int UserID { get; set; }

        [JsonPropertyName("fullName")]
        public string FullName { get; set; }

        [JsonPropertyName("avatar")]
        public string Avatar { get; set; }

        [JsonPropertyName("roleName")]
        public string RoleName { get; set; } // admin, manager, employee

        [JsonPropertyName("departmentName")]
        public string DepartmentName { get; set; }

        public UserOptionResponse()
        {
            FullName = string.Empty;
            Avatar = string.Empty;
            RoleName = string.Empty;
            DepartmentName = string.Empty;
        }

        public UserOptionResponse(int userId, string fullName, string avatar, string roleName, string departmentName)
        {
            UserID = userId;
            FullName = fullName;
            Avatar = avatar;
            RoleName = roleName;
            DepartmentName = departmentName;
        }
    }
}
