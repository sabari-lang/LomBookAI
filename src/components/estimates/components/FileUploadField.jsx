import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { notifyError } from "../../../utils/notifications";

const FileUploadField = ({ value, onChange, existingFileUrl, existingFileName, error, disabled }) => {
    const [file, setFile] = useState(null);
    const [showReupload, setShowReupload] = useState(false);

    const allowedFileTypes = ["pdf", "doc", "docx", "xls", "xlsx"];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) {
            setFile(null);
            onChange(null);
            return;
        }

        // Validate file type
        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        if (!allowedFileTypes.includes(fileExtension)) {
            notifyError(`Invalid file type. Allowed types: ${allowedFileTypes.join(", ").toUpperCase()}`);
            e.target.value = "";
            return;
        }

        // Validate file size
        if (selectedFile.size > maxFileSize) {
            notifyError("File size must be less than 10MB");
            e.target.value = "";
            return;
        }

        setFile(selectedFile);
        onChange(selectedFile);
    };

    const handleViewFile = () => {
        if (existingFileUrl) {
            window.open(existingFileUrl, "_blank");
        }
    };

    return (
        <div>
            {existingFileUrl && !showReupload && (
                <div className="mb-2 d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-info text-white"
                        onClick={handleViewFile}
                    >
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        View File
                    </button>
                    {existingFileName && <span className="small text-muted">{existingFileName}</span>}
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowReupload(true)}
                    >
                        Reupload
                    </button>
                </div>
            )}
            {(showReupload || !existingFileUrl) && (
                <div>
                    <input
                        type="file"
                        className={`form-control ${error ? "is-invalid" : ""}`}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        disabled={disabled}
                    />
                    <small className="text-muted">
                        Allowed types: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                    </small>
                    {showReupload && existingFileUrl && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary mt-2"
                            onClick={() => {
                                setShowReupload(false);
                                setFile(null);
                                onChange(null);
                            }}
                        >
                            Cancel Reupload
                        </button>
                    )}
                </div>
            )}
            {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
    );
};

export default FileUploadField;

