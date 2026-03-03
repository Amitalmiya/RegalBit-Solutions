import React from "react";

const Home = () => {
  const role = localStorage.getItem("role");



  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Welcome to the Home
        </h1>
        {!role && (
            <p className="text-center text-gray-600">
            Please <span className="text-blue-600 font-semibold">login</span> to
            access your dashboard.
          </p>
        )}

        {role === 'user' && (
           <div>
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
              Home
            </h2>
            <p className="text-gray-700">
              You can view and update your profile details here.
            </p>
          </div>
        )}

        {role === 'admin' && (
           <div>
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
              Admin Home
            </h2>
            <p className="text-gray-700">
              You can view and update your profile details here.
            </p>
          </div>
        )}

        {role === 'superadmin' && (
           <div>
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
             SuperAdmin Home
            </h2>
            <p className="text-gray-700">
              You can view and update your profile details here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
