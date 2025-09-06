import { useCallback } from 'react';
import PropTypes from 'prop-types';

const SearchBar = ({
    selectOptions = [],
    onAdd,
    onTyping,
    onSearch,
    onClearSearch,
    keywordSearch = '',
    onKeywordSearchChange,
    isLoading = false,
}) => {
    // Hàm xử lý khi gõ vào ô input để tìm kiếm
    const handleKeywordChange = (event) => {
        const value = event.target.value;
        console.log('Keyword changed:', value); // Debug
        if (onKeywordSearchChange) {
            onKeywordSearchChange(value);
        }
        if (onTyping) {
            onTyping();
        }
    };

    // Hàm xử lý phím Enter và Escape
    const handleKeywordKeyUp = (event) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed'); // Debug
            if (onSearch) {
                onSearch();
            }
        } else if (event.key === 'Escape') {
            console.log('Escape pressed'); // Debug
            if (onClearSearch) {
                onClearSearch();
            }
        }
    };

    // Xử lý khi nhấn nút Lọc
    const triggerSearch = useCallback(() => {
        console.log('Search button clicked'); // Debug
        if (onSearch) {
            onSearch();
        }
    }, [onSearch]);

    // Xử lý khi nhấn nút Xóa Lọc
    const triggerClearSearch = useCallback(() => {
        console.log('Clear search button clicked'); // Debug
        if (onClearSearch) {
            onClearSearch();
        }
    }, [onClearSearch]);

    return (
        <div className="table-container">
            <div className="section-header">
                <div className="container-fluid">
                    <div className="row g-2 align-items-center">
                        {/* Nút Thêm */}
                        <div className="col-auto">
                            <button className="btn btn-primary btn-sm d-flex align-items-center" onClick={onAdd}>
                                <i className="ri-add-line me-1" />
                                <span className="d-none d-md-inline">Thêm</span>
                            </button>
                        </div>

                        {/* Select Options */}
                        {selectOptions.map((select, index) => (
                            <div className="col-auto" key={select.name || index}>
                                <div className="select-with-icon">
                                    <i className="ri-list-radio"></i>
                                    <select
                                        className="form-select form-select-sm"
                                        value={select.value || ''}
                                        onChange={(e) => select.onChange(e.target.value)}
                                        style={{ minWidth: '150px' }}
                                    >
                                        <option value="">{select.label}</option>
                                        {select.options.map((option) => (
                                            <option
                                                key={typeof option === 'string' ? option : (option.value || option.id)}
                                                value={typeof option === 'string' ? option : (option.value || option.id)}
                                            >
                                                {typeof option === 'string' ? option : (option.label || option.text || option.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}

                        {/* Tìm kiếm - Flex grow để chiếm không gian còn lại */}
                        <div className="col">
                            <div className="search-input position-relative">
                                <i className="ri-search-line position-absolute" />
                                <input
                                    type="search"
                                    className="form-control form-control-sm"
                                    placeholder="Tìm kiếm..."
                                    value={keywordSearch}
                                    onChange={handleKeywordChange}
                                    onKeyUp={handleKeywordKeyUp}
                                    style={{ paddingLeft: '35px' }}
                                />
                            </div>
                        </div>

                        {/* Nút Lọc */}
                        <div className="col-auto">
                            <button
                                className="btn btn-primary btn-sm d-flex align-items-center"
                                onClick={triggerSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                ) : (
                                    <i className="ri-equalizer-fill me-1" />
                                )}
                                <span className="d-none d-md-inline">Lọc</span>
                            </button>
                        </div>

                        {/* Nút Xóa */}
                        <div className="col-auto">
                            <button className="btn btn-outline-danger btn-sm d-flex align-items-center" onClick={triggerClearSearch}>
                                <i className="ri-delete-back-2-line me-1" />
                                <span className="d-none d-md-inline">Xóa</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

SearchBar.propTypes = {
    selectOptions: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            options: PropTypes.arrayOf(
                PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.shape({
                        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                        label: PropTypes.string,
                        text: PropTypes.string,
                        name: PropTypes.string,
                        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                    }),
                ])
            ).isRequired,
            value: PropTypes.string,
            onChange: PropTypes.func,
        })
    ),
    onAdd: PropTypes.func,
    onTyping: PropTypes.func,
    onSearch: PropTypes.func,
    onClearSearch: PropTypes.func,
    keywordSearch: PropTypes.string,
    onKeywordSearchChange: PropTypes.func,
    isLoading: PropTypes.bool,
};

export default SearchBar;