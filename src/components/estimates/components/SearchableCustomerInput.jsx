import React, { useState, useEffect, useRef } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { searchCustomers } from "../api/quotationApi";

const SearchableCustomerInput = ({ value, onChange, error, disabled }) => {
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebouncedValue(searchTerm, 300);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (debouncedSearch && debouncedSearch.length >= 2) {
            setLoading(true);
            searchCustomers({ q: debouncedSearch })
                .then((data) => {
                    setSuggestions(data?.customers || data || []);
                    setShowSuggestions(true);
                })
                .catch((err) => {
                    console.error("Error searching customers:", err);
                    setSuggestions([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setShowSuggestions(true);
    };

    const handleSelectCustomer = (customer) => {
        const customerName = typeof customer === "string" ? customer : customer.name || customer.customerName || customer.displayName || "";
        setSearchTerm(customerName);
        onChange(customerName);
        setShowSuggestions(false);
    };

    return (
        <div className="position-relative">
            <div className="input-group">
                <input
                    ref={inputRef}
                    type="text"
                    className={`form-control ${error ? "is-invalid" : ""}`}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder="Search customer..."
                    disabled={disabled}
                />
                <span className="input-group-text">
                    <i className="fa fa-search"></i>
                </span>
            </div>
            {error && <div className="text-danger small mt-1">{error}</div>}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                    style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
                >
                    {loading ? (
                        <div className="p-2 text-center">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                        </div>
                    ) : (
                        suggestions.map((customer, index) => {
                            const customerName = typeof customer === "string" ? customer : customer.name || customer.customerName || customer.displayName || "";
                            return (
                                <div
                                    key={index}
                                    className="p-2 border-bottom cursor-pointer"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSelectCustomer(customer)}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "#f8f9fa";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "white";
                                    }}
                                >
                                    {customerName}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableCustomerInput;

