import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';

const Pagination = ({
    totalRecords,
    currentPage,
    pageSize,
    onPageChange
}) => {
    // States
    const [pageNumbers, setPageNumbers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);

    // Hàm tính toán danh sách số trang hiển thị
    const buildPageNumbers = useCallback(() => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        const maxPagesToShow = 5; // Số trang tối đa hiển thị (có thể tùy chỉnh)
        const numbers = [];

        if (totalPages <= maxPagesToShow) {
            // Nếu tổng số trang nhỏ hơn hoặc bằng maxPagesToShow, hiển thị tất cả
            for (let i = 1; i <= totalPages; i++) {
                numbers.push(i);
            }
        } else {
            // Tính toán các trang để hiển thị
            const halfPages = Math.floor(maxPagesToShow / 2);
            let startPage = Math.max(2, currentPage - halfPages);
            let endPage = Math.min(totalPages - 1, currentPage + halfPages);

            // Điều chỉnh để đảm bảo hiển thị đúng số lượng trang
            if (endPage - startPage + 1 < maxPagesToShow) {
                if (currentPage <= halfPages + 1) {
                    endPage = maxPagesToShow;
                } else {
                    startPage = totalPages - maxPagesToShow + 1;
                }
            }

            // Luôn thêm trang 1
            numbers.push(1);

            // Thêm dấu "..." nếu startPage > 2
            if (startPage > 2) {
                numbers.push('...');
            }

            // Thêm các trang giữa
            for (let i = startPage; i <= endPage; i++) {
                numbers.push(i);
            }

            // Thêm dấu "..." nếu endPage < totalPages - 1
            if (endPage < totalPages - 1) {
                numbers.push('...');
            }

            // Luôn thêm trang cuối
            if (totalPages > 1) {
                numbers.push(totalPages);
            }
        }

        // Cập nhật vào state
        setPageNumbers(numbers);
        setTotalPages(totalPages);
    }, [totalRecords, pageSize, currentPage]);

    // Hàm xử lý khi nhấp vào 1 trang bất kỳ
    const handlePageClick = (e, pageNumber) => {
        e.preventDefault();

        // Nếu trang không hợp lệ, hoặc là trang hiện tại thì bỏ qua
        if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
            return;
        }

        // Kích hoạt event onPageChange
        if (onPageChange) {
            onPageChange(pageNumber);
        }
    };

    // Hàm xử lý khi nút "Trang đầu" được nhấp
    const handleFirstClick = (e) => {
        e.preventDefault();
        handlePageClick(e, 1);
    };

    // Hàm xử lý khi nút "Trang cuối" được nhấp
    const handleLastClick = (e) => {
        e.preventDefault();
        handlePageClick(e, totalPages);
    };

    // Hàm xử lý khi nút "Trang trước" được nhấp
    const handlePrevClick = (e) => {
        e.preventDefault();
        handlePageClick(e, currentPage - 1);
    };

    // Hàm xử lý khi nút "Trang sau" được nhấp
    const handleNextClick = (e) => {
        e.preventDefault();
        handlePageClick(e, currentPage + 1);
    };

    // Tự động tải danh sách trang khi mount hoặc thay đổi
    useEffect(() => {
        buildPageNumbers();
    }, [buildPageNumbers]);

    return (
        <ul className="pagination pagination-separated justify-content-center m-3">
            {/* Nút Trang đầu */}
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a href="#" className="page-link" onClick={handleFirstClick}>
                    <i class="ri-arrow-left-double-line"></i>
                </a>
            </li>

            {/* Nút Trang trước */}
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a href="#" className="page-link" onClick={handlePrevClick}>
                    <i class="ri-arrow-left-s-line"></i>
                </a>
            </li>

            {/* Danh sách số trang */}
            {pageNumbers.map((number, index) => (
                <li
                    key={index}
                    className={`page-item ${number === currentPage ? 'active' : ''} ${number === '...' ? 'disabled' : ''
                        }`}
                >
                    <a
                        href="#"
                        className="page-link"
                        onClick={(e) => number !== '...' && handlePageClick(e, number)}
                    >
                        {number}
                    </a>
                </li>
            ))}

            {/* Nút Trang sau */}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a href="#" className="page-link" onClick={handleNextClick}>
                    <i class="ri-arrow-right-s-line"></i>
                </a>
            </li>

            {/* Nút Trang cuối */}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a href="#" className="page-link" onClick={handleLastClick}>
                    <i class="ri-arrow-right-double-line"></i>
                </a>
            </li>
        </ul>
    );
};

// Định nghĩa propTypes cho component Pagination
Pagination.propTypes = {
    totalRecords: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
};

export default Pagination;