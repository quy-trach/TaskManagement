
import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = () => {
    // Breadcrumb navigation
    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
                <li className="breadcrumb-item">
                    <Link to="/">Trang chủ</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                    Dashboard
                </li>
            </ol>
        </nav>
    );
};

export default Breadcrumb;