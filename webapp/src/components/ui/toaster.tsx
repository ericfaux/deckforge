import { Toaster as HotToaster } from "react-hot-toast";
import { useTheme } from "next-themes";

export const Toaster = () => {
  const { theme = "system" } = useTheme();

  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          color: theme === "dark" ? "#f3f4f6" : "#1f2937",
          border: "1px solid",
          borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
};
