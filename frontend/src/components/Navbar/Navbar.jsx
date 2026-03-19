import React from 'react'
import ProfileInfo from '../Cards/ProfileInfo'
import { useNavigate, Link } from 'react-router-dom'
import { MdArrowBack, MdDescription } from 'react-icons/md'
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
  handleTagClick,
  documentTitle,
  onDocumentTitleChange,
  documentMeta,
  documentMinimal = false,
  onBack,
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
  const showDocumentTitle = Boolean(documentTitle !== undefined);

  if (documentMinimal && showDocumentTitle) {
    return (
      <div className='bg-white flex items-center gap-3 px-4 md:px-6 py-3 shadow-sm z-50 sticky top-0 border-b border-slate-100'>
        <button
          type="button"
          onClick={onBack || (() => navigate('/dashboard'))}
          className='inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0'
          title='Back to notes'
        >
          <MdArrowBack size={20} />
        </button>

        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <MdDescription className='text-slate-300 shrink-0 text-xl' />
          {onDocumentTitleChange ? (
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => onDocumentTitleChange(e.target.value)}
              placeholder='Untitled document'
              className='min-w-0 w-full text-lg md:text-xl font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-300 outline-none pb-1'
            />
          ) : (
            <p className='min-w-0 truncate text-lg md:text-xl font-semibold text-slate-900'>
              {documentTitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white flex items-center justify-between px-4 md:px-8 py-4 shadow-sm z-50 sticky top-0 border-b border-slate-50 gap-4'>
      <div className={`flex items-center gap-3 min-w-0 ${showDocumentTitle && !showSearch ? 'flex-1' : ''}`}>
        <Link to="/dashboard">
          <h2 className='text-2xl font-semibold text-slate-900 py-1 tracking-tight whitespace-nowrap'>Notes</h2>
        </Link>

        {showDocumentTitle && (
          <>
            <div className='hidden md:block w-px h-8 bg-slate-200' />
            <div className='flex items-center gap-2 min-w-0'>
              <MdDescription className='text-slate-300 shrink-0 text-xl' />
              {onDocumentTitleChange ? (
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => onDocumentTitleChange(e.target.value)}
                  placeholder='Untitled document'
                  className='min-w-0 w-[220px] md:w-[460px] lg:w-[720px] xl:w-[980px] max-w-full text-base md:text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-300 outline-none pb-1'
                />
              ) : (
                <p className='min-w-0 truncate text-base md:text-lg font-semibold text-slate-900'>
                  {documentTitle}
                </p>
              )}
            </div>
          </>
        )}
      </div>

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

      {!showSearch && showDocumentTitle && documentMeta && (
        <div className='hidden xl:flex flex-1 justify-center'>
          <p className='text-sm text-slate-500 truncate'>{documentMeta}</p>
        </div>
      )}

      {userInfo && <ProfileInfo userInfo={userInfo} onLogout={onLogout} />}
    </div>
  )
}

export default Navbar
