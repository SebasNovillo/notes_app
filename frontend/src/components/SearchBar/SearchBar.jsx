import React from 'react';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

const SearchBar = ({ value, onChange, handleSearch, onClearSearch }) => {
  return (
    <div className='flex-1 max-w-2xl flex items-center px-5 bg-slate-50 rounded-full border border-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-sm transition-all duration-300'>
      <input
        type="text"
        placeholder='Search Notes'
        className='w-full text-sm text-slate-700 bg-transparent py-3 outline-none placeholder:text-slate-400'
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />

      {value &&
        <IoMdClose
          className='text-xl text-slate-400 cursor-pointer hover:text-slate-700 mr-4 transition-colors'
          onClick={onClearSearch}
        />}

      <FaMagnifyingGlass className='text-slate-400 cursor-pointer hover:text-primary transition-colors' onClick={handleSearch} />
    </div>
  )
}

export default SearchBar