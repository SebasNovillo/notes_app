import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../../utils/helper';
import { MdOutlineArrowBack, MdPerson, MdLock, MdEmail } from 'react-icons/md';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
        setFullName(response.data.user.fullName);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

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
        setUserInfo(response.data.user);
        setPassword("");
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
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
    <div className="bg-slate-50 min-h-screen">
      <Navbar userInfo={null} onSearchNote={() => {}} handleClearSearch={() => {}} />

      <div className='max-w-3xl mx-auto mt-12 px-6'>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors font-medium"
        >
          <MdOutlineArrowBack size={20} />
          Back to Dashboard
        </button>

        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
          
          <div className='bg-primary/10 p-8 flex flex-col items-center justify-center border-b border-primary/20'>
            <div className="w-24 h-24 flex items-center justify-center rounded-full text-primary font-bold text-3xl bg-primary/20 mb-4 shadow-inner">
              {userInfo ? getInitials(userInfo.fullName) : ''}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {userInfo?.fullName || "Loading..."}
            </h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <MdEmail size={16} />
              {userInfo?.email || "..."}
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-6">Account Settings</h3>

            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <MdPerson size={16} />
                  Display Name
                </label>
                <input 
                  type="text" 
                  placeholder="Your Full Name" 
                  className="input-box bg-slate-50 border-slate-200 focus:bg-white" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <MdLock size={16} />
                  Change Password
                </label>
                <input 
                  type="password" 
                  placeholder="Enter new password to change" 
                  className="input-box bg-slate-50 border-slate-200 focus:bg-white" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty to keep your current password</p>
              </div>

            </div>

            {error && <p className="text-red-500 text-sm font-medium pt-4">{error}</p>}
            {message && <p className="text-green-500 text-sm font-medium pt-4">{message}</p>}

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button type="submit" className="btn-primary w-auto px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
                Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;
