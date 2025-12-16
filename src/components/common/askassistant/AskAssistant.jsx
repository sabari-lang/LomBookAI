import React, { useState, useEffect, useRef } from "react";
import { MicFill, Plus, SendFill } from "react-bootstrap-icons";

const AskAssistant = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef?.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages?.length || 0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query?.trim?.()) return;

    setMessages((prev = []) => [...prev, { type: "user", text: query }]);
    setQuery("");

    // Simulated assistant reply
    setTimeout(() => {
      setMessages((prev = []) => [
        ...prev,
        {
          type: "assistant",
          text:
            "Hi 👋 I’m your ERP Assistant — I can help you with invoices, ledgers, stock, or reports.",
        },
      ]);
    }, 700);
  };

  const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0] || null;
    if (file) {
      setUploadedFile(file);
      setMessages((prev = []) => [
        ...prev,
        { type: "user", text: `📎 Uploaded file: ${file?.name || "Unknown"}` },
      ]);
    }
  };

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        height: "inherit",
        width: "100%",
        backgroundColor: "#f8fafc",
        // padding: "1.2rem 1.5rem",
        // margin: "auto auto",
        
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Chat Container */}
      <div
        className="shadow-sm rounded-4 d-flex flex-column"
        style={{
          backgroundColor: "#fff",
          width: "100%",
          // maxWidth: "980px",
          height: "calc(100vh - 100px)",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        {/* <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{
            background: "linear-gradient(90deg, #1976d2, #1565c0)",
            color: "#fff",
            fontWeight: 600,
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            fontSize: "1.1rem",
          }}
        >
          <span>Ask ERP Assistant</span>
        </div> */}

        {/* Gradient Divider */}
        {/* <div
          style={{
            height: "4px",
            background:
              "linear-gradient(90deg, #1976d2, #1e88e5, #42a5f5, #64b5f6)",
          }}
        /> */}

        {/* Chat Section */}
        <div
          className="flex-grow-1 overflow-auto p-4"
          style={{
            backgroundColor: "#f9fbfd",
            scrollBehavior: "smooth",
          }}
        >
          {(messages?.length || 0) === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                alt="assistant"
                style={{
                  width: "90px",
                  opacity: "0.8",
                  animation: "float 3s ease-in-out infinite",
                }}
              />
              <p
                className="mt-3 text-secondary"
                style={{
                  fontSize: "1rem",
                  maxWidth: "480px",
                  lineHeight: "1.6",
                }}
              >
                👋 Hello! I’m your <b>ERP Assistant</b> — ask me about{" "}
                <b>items</b>, <b>ledgers</b>, <b>reports</b>, or <b>stock</b>{" "}
                data. I’m here to help you manage everything smoothly.
              </p>
            </div>
          ) : (
            messages?.map?.((msg = {}, idx) => (
              <div
                key={idx}
                className={`d-flex mb-3 ${msg?.type === "user"
                  ? "justify-content-end"
                  : "justify-content-start"
                  }`}
              >
                <div
                  className={`p-3 ${msg?.type === "user"
                    ? "bg-primary text-white"
                    : "bg-light text-dark"
                    }`}
                  style={{
                    borderRadius:
                      msg?.type === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    maxWidth: "75%",
                    fontSize: "0.95rem",
                    lineHeight: "1.4",
                    wordBreak: "break-word",
                    boxShadow:
                      msg?.type === "user"
                        ? "0px 1px 4px rgba(0,0,0,0.1)"
                        : "0px 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {msg?.text || ""}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Section */}
        <form
          onSubmit={handleSubmit}
          className="d-flex align-items-center px-3 py-2 border-top"
          style={{
            backgroundColor: "#fff",
            borderTop: "1px solid #e0e6ef",
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px",
            boxShadow: "0px -1px 2px rgba(0,0,0,0.03)",
          }}
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef?.current?.click?.()}
            className="btn border-0 bg-transparent me-2"
            title="Attach File"
          >
            <Plus size={20} className="text-secondary" />
          </button>

          {/* Query Input */}
          <input
            type="text"
            className="form-control border-0 shadow-none px-3 py-2"
            placeholder="Type your query..."
            style={{
              fontSize: "0.95rem",
              color: "#333",
              backgroundColor: "#f1f3f6",
              borderRadius: "20px",
            }}
            value={query || ""}
            onChange={(e) => setQuery(e?.target?.value || "")}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="btn border-0 bg-transparent ms-2"
            title="Send Message"
          >
            <SendFill size={20} color="#1976d2" />
          </button>

          {/* Mic Button */}
          <button
            type="button"
            className="btn border-0 bg-transparent ms-1"
            title="Voice Input (Coming soon)"
          >
            <MicFill size={20} className="text-secondary" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskAssistant;
