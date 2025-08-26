import axios from 'axios';

// Tạo instance axios với cấu hình cơ bản
const axiosInstance = axios.create({
    baseURL: 'https://localhost:7143/api', 
    timeout: 10000, // Timeout 10 giây
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để tự động thêm JWT token vào header Authorization
axiosInstance.interceptors.request.use(
    (config) => {
        // FIX: Sử dụng cùng key 'authToken' như trong AuthContext
        const token = localStorage.getItem('authToken');

        // Debug log để kiểm tra token
        console.log('Axios interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'No token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor để xử lý response và lỗi
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.log('Axios response error:', error.response?.status, error.response?.data);

        // Xử lý lỗi 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
        if (error.response && error.response.status === 401) {
            console.log('401 Unauthorized - Clearing auth data and redirecting to login');

            // FIX: Xóa đúng key names như trong AuthContext
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // Chuyển hướng về trang đăng nhập
            window.location.href = '/sign-in'; 
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;