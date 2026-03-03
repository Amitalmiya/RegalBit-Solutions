import React from 'react'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({children, allowedRoles}) => {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    

    if (!token) {
        return <Navigate to='/login' replace/>
    }

    if (allowedRoles && !allowedRoles.inlcudes(role)){
        return <Navigate to='/home'/> 
    }
    return children;
}

export default ProtectedRoute;