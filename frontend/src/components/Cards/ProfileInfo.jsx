import React from 'react'
import { getInitials } from '../../utils/helper';

const ProfileInfo = ({ userInfo, onLogout }) => {
  return (
    <div className='flex items-center gap-4'>
      <div className='w-11 h-11 flex items-center justify-center rounded-full text-primary font-semibold bg-primary/10 shadow-inner'>
        {getInitials(userInfo?.fullName)}
      </div>
      <div className='flex flex-col'>
        <p className='text-[13px] font-semibold text-slate-800 leading-tight'>{userInfo?.fullName}</p>
        <button className='text-xs text-slate-500 hover:text-red-500 transition-colors text-left mt-0.5 font-medium' onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;