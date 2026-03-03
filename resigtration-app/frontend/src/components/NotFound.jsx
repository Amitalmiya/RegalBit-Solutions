import React from "react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-xl text-gray-700 mb-2">Page Not Found</p>
      <a
        href="/dashboard"
        className="text-blue-500 underline hover:text-blue-700 transition"
      >
        Go Back Home
      </a>
    </div>
  );
};

export default NotFound;
