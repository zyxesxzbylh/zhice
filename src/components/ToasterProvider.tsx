"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          fontSize: "14px",
          borderRadius: "8px",
          padding: "10px 16px",
        },
        success: {
          iconTheme: { primary: "var(--color-success)", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "var(--color-danger)", secondary: "#fff" },
        },
      }}
    />
  );
}
