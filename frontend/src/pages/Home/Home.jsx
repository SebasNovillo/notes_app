import React, { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import { MdAdd } from "react-icons/md"
import AddEditNotes from './AddEditNotes'
import Modal from "react-modal"
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Home = () => {

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const [allNotes, setAllNotes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const navigate = useNavigate();

  const handleEdit = (noteDetails) => {
    setOpenAddEditModal({ isShown: true, data: noteDetails, type: "edit" });
  };

  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [dragOverNoteId, setDragOverNoteId] = useState(null);

  // Get User Info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  // Get all Notes
  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get("/get-all-notes");

      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // Get all Tags
  const getAllTags = async () => {
    try {
      const response = await axiosInstance.get("/get-all-tags");
      if (response.data && response.data.tags) {
        setAllTags(response.data.tags);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Delete Note
  const deleteNote = async (data) => {
    const noteId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-note/" + noteId);

      if (response.data && !response.data.error) {
        getAllNotes();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        console.log("An unexpected error occurred. Please try again.");
      }
    }
  };

  // Update Pinned
  const updateIsPinned = async (noteData) => {
    const noteId = noteData._id;
    try {
      const response = await axiosInstance.put("/update-note-pinned/" + noteId, {
        "isPinned": !noteData.isPinned,
      });

      if (response.data && response.data.note) {
        getAllNotes();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // --- Folder Handlers ---
  const getAllFolders = async () => {
    try {
      const response = await axiosInstance.get("/get-all-folders");
      if (response.data && response.data.folders) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddFolder = async (name) => {
    try {
      const response = await axiosInstance.post("/add-folder", { name });
      if (response.data && response.data.folder) {
        getAllFolders();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    try {
      const response = await axiosInstance.put("/update-folder/" + folderId, { name: newName });
      if (response.data && response.data.folder) {
        getAllFolders();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const response = await axiosInstance.delete("/delete-folder/" + folderId);
      if (response.data && !response.data.error) {
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
        getAllFolders();
        getAllNotes(); // Because some notes might have lost their folder
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDropNote = async (noteId, folderId) => {
    setDraggedNoteId(null);
    try {
      const response = await axiosInstance.put("/update-note-folder/" + noteId, { folderId });
      if (response.data && response.data.note) {
        getAllNotes();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDropOnNote = async (draggedNoteIdParam, targetNoteId, isPinnedSection) => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    
    if (draggedNoteIdParam === targetNoteId) return;

    // Figure out which list we are operating on
    const listToReorder = isPinnedSection ? [...pinnedNotes] : [...otherNotes];
    
    const draggedIndex = listToReorder.findIndex(n => n._id === draggedNoteIdParam);
    const targetIndex = listToReorder.findIndex(n => n._id === targetNoteId);

    if (draggedIndex === -1 || targetIndex === -1) {
       // Cannot reorder between pinned and unpinned, or note missing
       return;
    }

    // Reorder array locally
    const [draggedNote] = listToReorder.splice(draggedIndex, 1);
    listToReorder.splice(targetIndex, 0, draggedNote);

    // Apply new positions sequentially
    const updatedPositions = listToReorder.map((note, index) => ({
      _id: note._id,
      position: index
    }));

    // Optimistic UI update
    setAllNotes(prevNotes => {
      const newAllNotes = [...prevNotes];
      updatedPositions.forEach(pos => {
        const note = newAllNotes.find(n => n._id === pos._id);
        if (note) note.position = pos.position;
      });
      // Sort immediately so UI doesn't jump back before API returns
      return newAllNotes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.position !== b.position) return a.position - b.position;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });

    try {
      await axiosInstance.put("/update-note-positions", { notes: updatedPositions });
    } catch (error) {
      console.log("Failed to update note positions", error);
      getAllNotes(); // Refresh to ensure backend state
    }
  };

  const handleReorderFolders = async (draggedFolderId, targetFolderId) => {
    if (draggedFolderId === targetFolderId) return;

    const draggedIndex = folders.findIndex(f => f._id === draggedFolderId);
    const targetIndex = folders.findIndex(f => f._id === targetFolderId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const listToReorder = [...folders];
    const [draggedFolder] = listToReorder.splice(draggedIndex, 1);
    listToReorder.splice(targetIndex, 0, draggedFolder);

    const updatedPositions = listToReorder.map((folder, index) => ({
      _id: folder._id,
      position: index
    }));

    // Optimistic UI update
    setFolders(listToReorder);

    try {
      await axiosInstance.put("/update-folder-positions", { folders: updatedPositions });
    } catch (error) {
      console.log("Failed to update folder positions", error);
      getAllFolders();
    }
  };

  // Search for a Note
  const onSearchNote = async (query) => {
    try {
      const response = await axiosInstance.get("/search-notes", {
        params: { query },
      });

      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    getAllNotes();
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter by tags
  let filteredNotes = selectedTags.length > 0
    ? allNotes.filter((note) =>
      selectedTags.every((tag) => note.tags.includes(tag))
    )
    : allNotes;
    
  // Filter by folder
  if (selectedFolderId !== null) {
    filteredNotes = filteredNotes.filter(note => note.folderId === selectedFolderId);
  }

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const otherNotes = filteredNotes.filter(note => !note.isPinned);

  useEffect(() => {
    getAllNotes();
    getUserInfo();
    getAllTags();
    getAllFolders();
    return () => { };
  }, []);


  return (
    <>
      <Navbar
        userInfo={userInfo}
        onSearchNote={onSearchNote}
        handleClearSearch={handleClearSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        allTags={allTags}
        selectedTags={selectedTags}
        handleTagClick={handleTagClick}
      />

      <div className='flex flex-col md:flex-row mx-auto min-h-screen'>
        {/* Sidebar */}
        <Sidebar 
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onDropNote={handleDropNote}
          onReorderFolders={handleReorderFolders}
        />

        {/* Main Content Area */}
        <div className='flex-1 w-full max-w-full overflow-hidden px-4 md:px-8 mt-4 md:mt-8 mb-24'>
          <div className='w-full'>

          {pinnedNotes.length > 0 && (
            <div className='mb-10'>
              <h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2'>
                Pinned Notes
                <div className='h-[1px] flex-1 bg-slate-100'></div>
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {pinnedNotes.map((item) => (
                  <div
                    key={item._id}
                    className={`transition-all ${draggedNoteId === item._id ? 'dragging' : ''} ${dragOverNoteId === item._id ? 'drag-over-note' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      // setTimeout ensures the native drag ghost doesn't have the 'dragging' class yet
                      setTimeout(() => setDraggedNoteId(item._id), 0);
                      e.dataTransfer.setData("noteId", item._id);
                    }}
                    onDragEnd={() => {
                      setDraggedNoteId(null);
                      setDragOverNoteId(null);
                    }}
                    onDragEnter={() => setDragOverNoteId(item._id)}
                    onDragLeave={() => setDragOverNoteId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverNoteId(null);
                      const droppedNoteId = e.dataTransfer.getData("noteId");
                      if (droppedNoteId) {
                         handleDropOnNote(droppedNoteId, item._id, true);
                      }
                    }}
                  >
                    <NoteCard
                      title={item.title}
                      date={item.createdAt}
                      content={item.content}
                      tags={item.tags}
                      isPinned={item.isPinned}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => deleteNote(item)}
                      onPinNote={() => updateIsPinned(item)}
                      onTagClick={handleTagClick}
                      searchQuery={searchQuery}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='mb-10'>
            {pinnedNotes.length > 0 && (
              <h3 className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2'>
                Recent Notes
                <div className='h-[1px] flex-1 bg-slate-100'></div>
              </h3>
            )}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {otherNotes.map((item) => (
                 <div
                 key={item._id}
                 className={`transition-all ${draggedNoteId === item._id ? 'dragging' : ''} ${dragOverNoteId === item._id ? 'drag-over-note' : ''}`}
                 draggable
                 onDragStart={(e) => {
                   setTimeout(() => setDraggedNoteId(item._id), 0);
                   e.dataTransfer.setData("noteId", item._id);
                 }}
                 onDragEnd={() => {
                   setDraggedNoteId(null);
                   setDragOverNoteId(null);
                 }}
                 onDragEnter={() => setDragOverNoteId(item._id)}
                 onDragLeave={() => setDragOverNoteId(null)}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => {
                   e.preventDefault();
                   setDragOverNoteId(null);
                   const droppedNoteId = e.dataTransfer.getData("noteId");
                   if (droppedNoteId) {
                      handleDropOnNote(droppedNoteId, item._id, false);
                   }
                 }}
               >
                 <NoteCard
                   title={item.title}
                   date={item.createdAt}
                   content={item.content}
                   tags={item.tags}
                   isPinned={item.isPinned}
                   onEdit={() => handleEdit(item)}
                   onDelete={() => deleteNote(item)}
                   onPinNote={() => updateIsPinned(item)}
                   onTagClick={handleTagClick}
                   searchQuery={searchQuery}
                 />
               </div>
              ))}
            </div>
          </div>

          {filteredNotes.length === 0 && (
            <div className='flex flex-col items-center justify-center mt-20'>
              <p className='text-slate-600 text-lg font-medium'>No notes found matching your criteria</p>
            </div>
          )}
        </div>
        </div>
      </div>

      <button
        className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10'
        onClick={() => {
          setOpenAddEditModal({ isShown: true, type: "add", data: { folderId: selectedFolderId } });
        }}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => { }}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
          },
        }}
        contentLabel=""
        className="w-[70%] max-h-[85vh] bg-white rounded-xl mx-auto mt-10 p-12 overflow-auto shadow-2xl outline-none border-none"
      >
        <AddEditNotes
          type={openAddEditModal.type}
          noteData={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({ isShown: false, type: "add", data: null })
          }}
          getAllNotes={getAllNotes}
        />
      </Modal>


    </>
  )
}

export default Home

