import React from 'react'
import ProfileInfo from '../Cards/ProfileInfo'
import { useNavigate, Link } from 'react-router-dom'
import SearchBar from '../SearchBar/SearchBar';
import FilterDropdown from '../TagFilter/FilterDropdown';

const Navbar = ({
  userInfo,
  onSearchNote,
  handleClearSearch,
  searchQuery,
  setSearchQuery,
  allTags,
  selectedTags,
  handleTagClick
}) => {
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearch = () => {
    if (searchQuery && onSearchNote) {
      onSearchNote(searchQuery);
    }
  };

  const onClearSearch = () => {
    setSearchQuery?.("");
    handleClearSearch?.();
  };

  const showSearch = Boolean(userInfo && onSearchNote && handleClearSearch && setSearchQuery);

  return (
    <div className='bg-white flex items-center justify-between px-4 md:px-8 py-4 shadow-sm z-50 sticky top-0 border-b border-slate-50'>
      <Link to="/dashboard">
        <h2 className='text-2xl font-semibold text-slate-900 py-1 tracking-tight'>Notes</h2>
      </Link>

      {showSearch && (
        <div className='flex-1 flex justify-center items-center gap-2 md:gap-4 px-2 md:px-8'>
          <SearchBar
            value={searchQuery}
            onChange={({ target }) => {
              setSearchQuery(target.value);
              if (target.value) {
                onSearchNote(target.value);
              } else {
                handleClearSearch();
              }
            }}
            handleSearch={handleSearch}
            onClearSearch={onClearSearch}
          />

          <FilterDropdown
            allTags={allTags || []}
            selectedTags={selectedTags || []}
            onTagClick={handleTagClick}
          />
        </div>
      )}

      {userInfo && <ProfileInfo userInfo={userInfo} onLogout={onLogout} />}
    </div>
  )
}

export default Navbar
