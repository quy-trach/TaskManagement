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
                <div className="flex items-center gap-10">
                    <button className="btn btn-primary" onClick={onAdd}>
                        <i className="ri-add-line" />
                        Thêm
                    </button>
                    {selectOptions.map((select) => (
                        <div className="select-with-icon" key={select.name}>
                            <i className="ri-list-radio"></i>
                            <select
                                className="form-control"
                                value={select.value || ''}
                                onChange={(e) => select.onChange(e.target.value)}
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
                    ))}
                    <div className="search-input">
                        <i className="ri-search-line" />
                        <input
                            type="search"
                            className="form-control search"
                            placeholder="Tìm kiếm..."
                            value={keywordSearch}
                            onChange={handleKeywordChange}
                            onKeyUp={handleKeywordKeyUp}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={triggerSearch}
                        disabled={isLoading}
                    >
                        <>
                            {isLoading && <i className="spinner-border spinner-border-sm me-1" />}
                            {!isLoading && <i className="ri-equalizer-fill align-bottom me-1" />}
                            <span role="status">Lọc</span>
                        </>
                    </button>
                    <button className="btn btn-secondary" onClick={triggerClearSearch}>
                        <i className="ri-delete-back-2-line" />
                        Xóa
                    </button>
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