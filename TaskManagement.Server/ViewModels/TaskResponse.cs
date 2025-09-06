using System.Text.Json.Serialization;

namespace TaskManagement.Server.ViewModels
{
    public class TaskResponse
    {
        [JsonPropertyName("taskID")]
        public int TaskID { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("creatorID")]
        public int? CreatorID { get; set; }

        [JsonPropertyName("creatorName")]
        public string CreatorName { get; set; }

        [JsonPropertyName("creatorAvatar")]
        public string CreatorAvatar { get; set; }

        [JsonPropertyName("departmentID")]
        public int? DepartmentID { get; set; }

        [JsonPropertyName("departmentName")]
        public string DepartmentName { get; set; }

        [JsonPropertyName("projectID")]
        public int? ProjectID { get; set; }

        [JsonPropertyName("projectName")]
        public string ProjectName { get; set; }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; }

        [JsonPropertyName("priority")]
        public string Priority { get; set; }

        [JsonPropertyName("statusID")]
        public int? StatusID { get; set; }

        [JsonPropertyName("statusName")]
        public string StatusName { get; set; }

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; }

        // Sử dụng lại UserResponse hoặc một phiên bản rút gọn để hiển thị người được giao
        [JsonPropertyName("assignees")]
        public List<UserResponse> Assignees { get; set; }


        // Constructor mặc định
        public TaskResponse()
        {
            Title = string.Empty;
            Description = string.Empty;
            CreatorName = string.Empty;
            CreatorAvatar = string.Empty;
            DepartmentName = string.Empty;
            ProjectName = string.Empty;
            StartDate = string.Empty;
            EndDate = string.Empty;
            Priority = string.Empty;
            StatusName = string.Empty;
            CreatedAt = string.Empty;
            Assignees = new List<UserResponse>();
        }

        // Constructor có tham số
        public TaskResponse(
            int taskID,
            string title,
            string description,
            int? creatorID,
            string creatorName,
            string creatorAvatar,
            int? departmentID,
            string departmentName,
            int? projectID,
            string projectName,
            string startDate,
            string endDate,
            string priority,
            int? statusID,
            string statusName,
            string createdAt,
            List<UserResponse> assignees)
        {
            TaskID = taskID;
            Title = title ?? string.Empty;
            Description = description ?? string.Empty;
            CreatorID = creatorID;
            CreatorName = creatorName ?? string.Empty;
            CreatorAvatar = creatorAvatar ?? string.Empty;
            DepartmentID = departmentID;
            DepartmentName = departmentName ?? string.Empty;
            ProjectID = projectID;
            ProjectName = projectName ?? string.Empty;
            StartDate = startDate ?? string.Empty;
            EndDate = endDate ?? string.Empty;
            Priority = priority ?? string.Empty;
            StatusID = statusID;
            StatusName = statusName ?? string.Empty;
            CreatedAt = createdAt ?? string.Empty;
            Assignees = assignees ?? new List<UserResponse>();
        }
    }
}
