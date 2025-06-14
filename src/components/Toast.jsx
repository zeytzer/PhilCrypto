import { Toaster } from "react-hot-toast";

export default function Toasts() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#111",
          color: "#fff",
          fontSize: "14px",
        },
      }}
    />
  );
}
