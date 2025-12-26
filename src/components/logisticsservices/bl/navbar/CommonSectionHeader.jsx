import React from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

const CommonSectionHeader = ({
    title,
    type = "master",
    buttonText,
    isCollapsed,
    onToggle,
    onButtonClick,
    openModalId,

    /* BUTTON 2 */
    rightButton2Text,
    rightButton2ModalId,
    onRightButton2Click,

    /* ⭐ NEW BUTTON 3 */
    newButtonText,
    newButtonModalId,
    onNewButtonClick,
}) => {

    // BG COLOR LOGIC
    const bgColor =
        type === "master" || type === "houseairwaybill"
            ? "tw-bg-masterBlue"
            : ["house", "provisional", "arrivalnotice"].includes(type)
                ? "tw-bg-houseTeal"
                : type === "accounting"
                    ? "tw-bg-green-600"
                    : type === "accounting-detailed"
                        ? "tw-bg-yellow-500"
                        : ["accounting-vendor", "accounting-detailed-vendor"].includes(type)
                            ? "tw-bg-[#343A40]"
                            : type === "jobcosting"
                                ? "tw-bg-[#24A54F]"
                                : "tw-bg-gray-500";

    // MAIN BUTTON
    const mainButtonModalAttrs = () =>
        openModalId
            ? { "data-bs-toggle": "modal", "data-bs-target": `#${openModalId}` }
            : {};

    // NEW BUTTON 3 (RED)
    const newButtonModalAttrs = () =>
        newButtonModalId
            ? { "data-bs-toggle": "modal", "data-bs-target": `#${newButtonModalId}` }
            : {};

    return (
        <div
            className={`tw-flex tw-items-center tw-justify-between tw-text-white tw-px-4 tw-py-3 tw-font-semibold tw-rounded-t-lg  ${bgColor}`}
        >
            <span>{title}</span>

            <div className="tw-flex tw-items-center tw-gap-2">

                {/* ⭐ BUTTON 3 — RED BUTTON */}
                {newButtonText && (
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={onNewButtonClick}
                        {...newButtonModalAttrs()}
                    >
                        <FaPlus className="tw-inline tw-mr-1" />
                        {newButtonText}
                    </button>
                )}

                {/* MAIN BUTTON */}
                {buttonText && (
                    <button
                        className="btn btn-success btn-sm"
                        onClick={onButtonClick}
                        {...mainButtonModalAttrs()}
                    >
                        <FaPlus className="tw-inline tw-mr-1" />
                        {buttonText}
                    </button>
                )}

                {/* BUTTON 2 */}
                {rightButton2Text && (
                    <button
                        className="btn btn-success btn-sm"
                        onClick={onRightButton2Click}
                        {...(rightButton2ModalId
                            ? {
                                "data-bs-toggle": "modal",
                                "data-bs-target": `#${rightButton2ModalId}`,
                            }
                            : {})}
                    >
                        <FaPlus className="tw-inline tw-mr-1" />
                        {rightButton2Text}
                    </button>
                )}



                {/* COLLAPSE */}
                <button
                    className="btn btn-light btn-sm"
                    onClick={onToggle}
                >
                    {isCollapsed ? <FaPlus size={12} /> : <FaMinus size={12} />}
                </button>
            </div>
        </div>
    );
};

export default CommonSectionHeader;
