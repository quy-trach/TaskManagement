// Hàm khởi tạo biểu đồ cho trạng thái công việc
function initializeStatusChart() {
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (!statusCtx) return;

    new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành'],
            datasets: [{
                data: [24, 18, 42],
                backgroundColor: ['#ffc107', '#007BFF', '#28a745'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1, // Giới hạn tỷ lệ chiều rộng/chiều cao
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}


// Hàm khởi tạo biểu đồ cho số liệu theo phòng ban
function initializeDepartmentChart() {
    const departmentCtx = document.getElementById('departmentChart')?.getContext('2d');
    if (!departmentCtx) return;

    new Chart(departmentCtx, {
        type: 'bar',
        data: {
            labels: ['Phòng IT', 'Phòng Marketing', 'Phòng Kế toán', 'Phòng Nhân sự', 'Phòng Kinh doanh'],
            datasets: [
                {
                    label: 'Chưa bắt đầu',
                    data: [8, 5, 3, 4, 4],
                    backgroundColor: '#ffc107',
                    borderColor: '#ffc107',
                    borderWidth: 1
                },
                {
                    label: 'Đang thực hiện',
                    data: [6, 4, 2, 3, 3],
                    backgroundColor: '#007BFF',
                    borderColor: '#007BFF',
                    borderWidth: 1
                },
                {
                    label: 'Hoàn thành',
                    data: [15, 12, 8, 5, 2],
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    borderWidth: 1
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}
function initAvatarUpload() {
    const avatarFileUpload = document.querySelector("#avatar-file-upload");
    const avatarUrlTextarea = document.querySelector("#avatarUrl");
    let currentBlobUrl = null;

    if (avatarFileUpload) {
        avatarFileUpload.addEventListener("change", function (event) {
            const file = event.target.files[0];
            const avatarContainer = avatarFileUpload.closest(".avatar-container");
            const avatarPreview = avatarContainer.querySelector(".avatar-preview");
            const avatarUrl = avatarContainer.querySelector(".avatar-file-url");

            if (file) {
                // KIỂM TRA FILE TYPE
                if (!file.type.startsWith('image/')) {
                    alert('Vui lòng chọn file hình ảnh!');
                    return;
                }

                // KIỂM TRA FILE SIZE (MAX 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
                    return;
                }

                const fileExtension = file.name.split('.').pop().toLowerCase();

                // Thu hồi Blob URL cũ nếu tồn tại
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                }

                // Tạo Blob URL từ file - ĐẢM BẢO FILE NGUYÊN VẸN
                currentBlobUrl = URL.createObjectURL(file);

                // Kiểm tra Blob URL được tạo thành công
                if (!currentBlobUrl) {
                    alert('Không thể tạo preview cho file này!');
                    return;
                }

                // Gán Blob URL cho preview
                avatarPreview.src = currentBlobUrl;
                avatarPreview.onload = function () {
                    console.log('Preview loaded successfully');
                };
                avatarPreview.onerror = function () {
                    console.error('Failed to load preview');
                    alert('Không thể hiển thị preview cho file này!');
                };

                if (avatarUrl) {
                    // LUU Ý: Không thêm extension vào blob URL vì sẽ làm corrupt
                    avatarUrl.value = currentBlobUrl;
                    avatarUrl.setAttribute("data-type", fileExtension);
                    avatarUrl.setAttribute("data-filename", file.name);
                }

                // Cập nhật textarea URL
                if (avatarUrlTextarea) {
                    avatarUrlTextarea.value = currentBlobUrl;
                    const eventInput = new Event("input", { bubbles: true });
                    avatarUrlTextarea.dispatchEvent(eventInput);
                }
            } else {
                // Reset nếu không có file
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                    currentBlobUrl = null;
                }
                avatarPreview.src = "";
                if (avatarUrl) {
                    avatarUrl.value = "";
                    avatarUrl.removeAttribute("data-type");
                    avatarUrl.removeAttribute("data-filename");
                }

                if (avatarUrlTextarea) {
                    avatarUrlTextarea.value = "";
                    const eventInput = new Event("input", { bubbles: true });
                    avatarUrlTextarea.dispatchEvent(eventInput);
                }
            }

            // Reset giá trị của input file
            avatarFileUpload.value = "";
        });

        // Handle remove button click
        const avatarRemove = avatarFileUpload.closest(".avatar-container").querySelector(".avatar-remove");
        if (avatarRemove) {
            avatarRemove.addEventListener("click", function (event) {
                event.preventDefault();
                const avatarContainer = avatarFileUpload.closest(".avatar-container");
                const avatarPreview = avatarContainer.querySelector(".avatar-preview");
                const avatarUrl = avatarContainer.querySelector(".avatar-file-url");

                // Thu hồi Blob URL khi xóa
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                    currentBlobUrl = null;
                }

                avatarPreview.src = "";
                if (avatarUrl) {
                    avatarUrl.value = "";
                    avatarUrl.removeAttribute("data-type");
                    avatarUrl.removeAttribute("data-filename");
                }

                if (avatarUrlTextarea) {
                    avatarUrlTextarea.value = "";
                    const eventInput = new Event("input", { bubbles: true });
                    avatarUrlTextarea.dispatchEvent(eventInput);
                }
            });
        }
    }
}

// Helper function để kiểm tra URL hình ảnh hợp lệ
function isValidImageUrl(url) {
    try {
        if (url.startsWith('blob:') || url.startsWith('data:image/')) {
            return true;
        }
        new URL(url);
        return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url);
    } catch {
        return false;
    }
}

// Global hàm initAvatarUpload để có thể gọi trong react
window.initAvatarUpload = initAvatarUpload;

// Hàm khởi tạo các function khi trang được tải
function init() {
    initializeStatusChart();
    initializeDepartmentChart();
    initAvatarUpload();
    // Tương lai: gọi thêm các hàm khác ở đây
    // Ví dụ: initializeTaskChart();
}

// Gọi hàm init khi trang được tải
window.onload = init;