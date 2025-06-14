import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-secondary">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">{"Sayfa Bulunamadı."}</p>
      <Link
        to="/"
        className="bg-accent text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        {"Ana Sayfaya Dön"}
      </Link>
    </div>
  );
}
