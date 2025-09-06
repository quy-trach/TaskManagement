import React, { useContext } from 'react';
import useSignIn from '../../hooks/useSignIn';
import { Link } from 'react-router-dom';
import LayoutBasic from '../../layouts/LayoutBasic';
import MessageBox from '../../components/MessageBox';
import { AuthContext } from '../../context/AuthContext';

const SignIn = () => {
    const {
        form,
        remember,
        showPassword,
        message,
        handleChange,
        toggleShowPassword,
        handleSubmit,
        setRemember,
    } = useSignIn();

    // Lấy hàm login từ Context
    const { login } = useContext(AuthContext);

    // Ghi đè hàm handleSubmit để tích hợp với Context
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        // Gọi hàm handleSubmit gốc từ hook useSignIn
        // và truyền vào hàm login của context như một callback
        await handleSubmit(e, (userData, jwtToken) => {
            // CẬP NHẬT: Truyền cả userData và jwtToken cho AuthContext
            login(userData, jwtToken);
        });
    };

    return (
        <>
            <title>Đăng nhập tài khoản</title>
            <LayoutBasic>
                <div className="login-form">
                    <div className="logo">
                        <img src="/assets/img/team.png" alt="Logo" />
                    </div>
                    <h2>Đăng Nhập</h2>

                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Username / Email:</label>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Nhập username hoặc email"
                                required
                            />
                        </div>
                        <div className="form-group password-group">
                            <label htmlFor="password">Mật khẩu:</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Nhập mật khẩu"
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={toggleShowPassword}
                                >
                                    <i className={`ri-eye${showPassword ? '-fill' : '-line'} align-middle`} />
                                </button>
                            </div>
                        </div>
                        <div className="form-options">
                            <div className="remember-me">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                            </div>
                            <Link to="/forgot-password" className="forgot-password">
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <button type="submit" className="login-btn">
                            Đăng Nhập
                        </button>
                    </form>
                    {message.content && (
                        <MessageBox type={message.type} message={message.content} />
                    )}
                </div>
            </LayoutBasic>
        </>
    );
};

export default SignIn;