import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const useSignIn = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [form, setForm] = useState({ email: '', password: '' });
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: 'info', content: 'Mời nhập thông tin đăng nhập' });

    useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        if (savedEmail) {
            setForm(prev => ({ ...prev, email: savedEmail }));
            setRemember(true);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleShowPassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const validate = () => {
        if (!form.email.trim()) {
            setMessage({ type: 'warning', content: 'Vui lòng nhập email' });
            return false;
        }
        if (!form.password.trim()) {
            setMessage({ type: 'warning', content: 'Vui lòng nhập mật khẩu' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setMessage({ type: 'info', content: 'Đang xử lý...' });

        try {
            const response = await axiosInstance.post('/authentication/login', form);
            const data = response.data;

            console.log("Response data:", data); // Debug
            console.log("Token:", data.token); // Debug token
            console.log("User data:", data.userData); // Debug user data

            if (data.success) {
                setMessage({ type: 'success', content: data.message || 'Đăng nhập thành công!' });

                if (remember) {
                    localStorage.setItem('remember_email', form.email);
                } else {
                    localStorage.removeItem('remember_email');
                }

                // FIX: Đúng thứ tự - token trước, userData sau
                login(data.token, data.userData);

                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                setMessage({ type: 'error', content: data.message || 'Email hoặc mật khẩu không chính xác.' });
            }
        } catch (err) {
            console.error("Login error:", err);
            setMessage({
                type: 'error',
                content: err.response?.data?.message || 'Không thể kết nối đến máy chủ.'
            });
        }
    };

    return {
        form,
        remember,
        showPassword,
        message,
        handleChange,
        toggleShowPassword,
        handleSubmit,
        setRemember,
        setMessage
    };
};

export default useSignIn;