import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // We could fetch user info on mount, but for simplicity, we let user type new info
  // Or we can just get user info from localStorage if stored, or fetch it.
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!fullName && !password) {
      setError("Please provide a name or a password to update.");
      return;
    }

    try {
      const response = await axiosInstance.put("/update-user", {
        fullName: fullName || undefined,
        password: password || undefined,
      });

      if (response.data && response.data.user) {
        setMessage("Profile updated successfully!");
        setFullName("");
        setPassword("");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      {/* We can pass null or empty props to Navbar if we just want the header without search */}
      <Navbar userInfo={null} onSearchNote={() => {}} handleClearSearch={() => {}} />

      <div className='flex items-center justify-center mt-28'>
        <div className='w-96 border rounded bg-white px-7 py-10 shadow-lg'>
          <form onSubmit={handleUpdateProfile}>
            <h4 className='text-2xl mb-7'>Update Profile</h4>

            <input 
              type="text" 
              placeholder="New Full Name" 
              className="input-box" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input 
              type="password" 
              placeholder="New Password" 
              className="input-box mt-4" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-xs pb-1 mt-2">{error}</p>}
            {message && <p className="text-green-500 text-xs pb-1 mt-2">{message}</p>}

            <button type="submit" className="btn-primary mt-5">
              Update
            </button>
            <button 
              type="button" 
              className="btn-primary mt-3 bg-slate-500 hover:bg-slate-600"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
