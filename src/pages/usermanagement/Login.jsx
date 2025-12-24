import React, { useState, useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { FaUser, FaLock } from "react-icons/fa";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { MOBILE_REQUIRED, onlyDigits } from "../../utils/validation";
import { useNavigate } from "react-router-dom";
import { images } from "../../assets/images/Image";
import { notifySuccess, notifyError, notifyInfo } from "../../utils/notifications";

const Login = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { control, handleSubmit, register, setValue, watch, formState: { errors } } = useForm();

    useEffect(() => {
        const remembered = localStorage.getItem("rememberMobileNumber");
        if (remembered) setValue("mobileNumber", remembered);
    }, [setValue]);

    const handleRememberMe = (checked) => {
        setRememberMe(checked);
        setShowPassword(checked);
    };

    // --- LOGIN LOGIC (enabled) ---
    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            sessionStorage.setItem("auth", "true");
            if (data?.token) sessionStorage.setItem("token", data.token);
            if (data?.userName) sessionStorage.setItem("userName", data.userName);
            if (data?.role) sessionStorage.setItem("role", data.role);
            if (data?.branch) sessionStorage.setItem("branch", data.branch);
            if (data?.user) sessionStorage.setItem("user", JSON.stringify(data.user));
            if (rememberMe) {
                localStorage.setItem("rememberMobileNumber", watch("mobileNumber"));
            } else {
                localStorage.removeItem("rememberMobileNumber");
            }
            queryClient.invalidateQueries(["users"]);
            queryClient.invalidateQueries(["me"]);
            // notifySuccess("Login Successful!");
            // Force navigation to Home before reload
            window.location.hash = "#/";
            window.location.reload();
        },
        onError: (err) => {
            handleProvisionalError(err, "Login");
        },
    });

    const onSubmit = (values) => {
        const payload = {
            mobileNumber: values.mobileNumber,
            password: values.password,
        };
        loginMutation.mutate(payload);
    };

    return (
        <div
            className="position-relative d-flex justify-content-center align-items-center"
            style={{ minHeight: "100vh" }}
        >
            {/* LAZY LOADED BACKGROUND IMAGE */}
            <LazyLoadImage
                src={images?.loginbackground}
                effect="blur"
                wrapperClassName="login-bg-wrapper"
                className="login-bg"
            />

            {/* TOP-LEFT LOGO */}
            <img
                src={images?.lomlogologin}
                alt="Lom Tech Logo"
                style={{
                    position: "absolute",
                    top: "-60px",
                    left: "0px",
                    width: "200px",
                    height: "250px",
                    zIndex: 3,
                    opacity: 0.95,


                }}
            />

            {/* DULL OVERLAY */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.11)",
                    zIndex: 1,
                }}
            ></div>

            {/* LOGIN CARD */}
            <div
                className="position-relative"
                style={{
                    zIndex: 2,
                    width: "90%",
                    maxWidth: "320px",
                    padding: "20px",
                    borderRadius: "2px",
                    background: "rgba(255, 255, 255, 0.99)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                }}
            >
                <h2 className="text-center fw-bold" style={{ fontSize: "24px", color: "#1c335f" }}>
                    iLOMO TradeSuite
                </h2>

                <p className="text-center" style={{ color: "#4b4b4b", fontSize: "14px", marginBottom: "15px" }}>
                    Sign in to continue
                </p>


                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* MOBILE NUMBER */}
                    <label className="fw-semibold mb-1" style={{ color: "#1c335f", fontSize: "14px" }}>
                        Mobile Number
                    </label>
                    <div className="input-group mb-2">
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            onInput={onlyDigits}
                            className={`form-control ${errors.mobileNumber ? "is-invalid" : ""}`}
                            placeholder="Enter mobile number"
                            style={{ padding: "12px" }}
                            {...register("mobileNumber", MOBILE_REQUIRED)}
                        />
                        <span className="input-group-text bg-white">
                            <FaUser size={16} color="#1c335f" />
                        </span>
                    </div>
                    {errors.mobileNumber && (
                        <div className="invalid-feedback d-block mb-2">{errors.mobileNumber.message}</div>
                    )}

                    {/* PASSWORD */}
                    <label className="fw-semibold mb-1" style={{ color: "#1c335f", fontSize: "14px" }}>
                        Password
                    </label>
                    <div className="input-group mb-2">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            placeholder="Enter password"
                            style={{ padding: "12px" }}
                            {...register("password", {
                                required: "Password is required",
                                minLength: { value: 6, message: "Password must be at least 6 characters" },
                            })}
                        />
                        <span className="input-group-text bg-white">
                            <FaLock size={16} color="#1c335f" />
                        </span>
                    </div>
                    {errors.password && (
                        <div className="text-danger small mb-2">{errors.password.message}</div>
                    )}

                    {/* REMEMBER & BUTTON */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => handleRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember" className="ms-2" style={{ fontSize: "14px" }}>
                                Remember me
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            style={{
                                background: "#1c5ed6",
                                color: "white",
                                fontWeight: "600",
                                padding: "5px 20px",
                                borderRadius: "6px",
                            }}
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                        </button>
                    </div>

                    <div className="text-center">
                        <a
                            className="small"
                            href="#"
                            style={{
                                color: "#2d6cdf",
                                fontSize: "13px",
                                textDecoration: "none",
                            }}
                        >
                            Forgot password?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
