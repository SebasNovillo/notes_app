import React, { useState } from 'react';
import { MdAdd, MdFolder, MdDelete, MdEdit } from 'react-icons/md';

const Sidebar = ({ folders, selectedFolderId, onSelectFolder, onAddFolder, onRenameFolder, onDeleteFolder, onDropNote }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
    }
  };

  const handleEditSubmit = (e, folderId) => {
    e.preventDefault();
    if (editFolderName.trim()) {
      onRenameFolder(folderId, editFolderName.trim());
      setEditingFolderId(null);
      setEditFolderName('');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (noteId) {
      onDropNote(noteId, folderId);
    }
  };

  return (
    <div className='w-64 bg-slate-50 min-h-[calc(100vh-80px)] border-r border-slate-200 p-4 flex flex-col pt-8'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest'>Folders</h3>
        <button onClick={() => setIsAdding(true)} className='text-slate-400 hover:text-primary transition-colors'>
          <MdAdd size={20} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className='mb-4'>
          <input
            type='text'
            autoFocus
            placeholder='Folder name...'
            className='w-full text-sm px-2 py-1 border border-slate-300 rounded outline-none focus:border-primary'
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => setIsAdding(false)}
          />
        </form>
      )}

      <div className='flex flex-col gap-1 overflow-y-auto'>
        {/* 'All Notes' filter essentially */}
        <div 
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            selectedFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
          title="Drop here to remove from any folder"
        >
          <MdFolder size={18} />
          <span className='text-sm flex-1'>All Notes</span>
        </div>

        {folders.map(folder => (
          <div 
            key={folder._id}
            onClick={() => onSelectFolder(folder._id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === folder._id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, folder._id)}
          >
            <MdFolder size={18} />
            
            {editingFolderId === folder._id ? (
              <form onSubmit={(e) => handleEditSubmit(e, folder._id)} className='flex-1'>
                <input
                  type='text'
                  autoFocus
                  className='w-full text-sm bg-white border border-slate-300 rounded px-1 outline-none'
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onBlur={() => setEditingFolderId(null)}
                  onClick={(e) => e.stopPropagation()}
                />
              </form>
            ) : (
              <span className='text-sm flex-1 truncate'>{folder.name}</span>
            )}
            
            <div className='hidden group-hover:flex items-center gap-1 opacity-60'>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditFolderName(folder.name);
                  setEditingFolderId(folder._id);
                }} 
                className='hover:text-primary transition-colors'
              >
                <MdEdit size={14} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder._id);
                }} 
                className='hover:text-red-500 transition-colors'
              >
                <MdDelete size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
