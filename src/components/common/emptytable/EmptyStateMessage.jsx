import React from "react";

const EmptyStateMessage = ({ title }) => {
    return (
        <div className="text-center py-5">
            <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076505.png"
                alt="empty"
                width={90}
                height={90}
                style={{ opacity: 0.3 }}
            />

            <h6 className="fw-bold text-muted mt-3">
                No data is available for {title}.
            </h6>

            <small className="text-muted">
                Please try again after making relevant changes.
            </small>
        </div>
    );
};

export default EmptyStateMessage;
