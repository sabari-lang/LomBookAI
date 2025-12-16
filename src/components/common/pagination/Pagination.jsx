import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 0) return null;

    return (
        <ul className="pagination pagination-sm m-0">
            {/* Previous */}
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                    className="page-link"
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </button>
            </li>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                return (
                    <li
                        key={page}
                        className={`page-item ${currentPage === page ? "active" : ""}`}
                    >
                        <button
                            className="page-link"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    </li>
                );
            })}

            {/* Next */}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                    className="page-link"
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </button>
            </li>
        </ul>
    );
};

export default Pagination;
