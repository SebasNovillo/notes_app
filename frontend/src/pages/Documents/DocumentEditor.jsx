import React, { useEffect, useState } from 'react';
import { MdArrowBack, MdDescription } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../components/Navbar/Navbar';
import AddEditNotes from '../Home/AddEditNotes';
import axiosInstance from '../../utils/axiosInstance';
import { formatNoteDate } from '../../utils/helper';

const DocumentEditor = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { noteId } = useParams();

    const isEditing = Boolean(noteId);

    const getUserInfo = async () => {
        try {
            const response = await axiosInstance.get("/get-user");
            if (response.data?.user) {
                setUserInfo(response.data.user);
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.clear();
                navigate("/login");
            }
        }
    };

    const loadNote = async () => {
        if (location.state?.draft && isEditing) {
            setNoteData({
                ...location.state.draft,
                _id: noteId,
                noteMode: "document",
            });
            return;
        }

        if (!isEditing) {
            setNoteData({
                ...(location.state?.draft || {}),
                noteMode: "document",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get(`/get-note/${noteId}`);
            if (response.data?.note) {
                setNoteData(response.data.note);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                navigate("/dashboard");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserInfo();
        loadNote();
    }, [noteId, location.state]);

    return (
        <div className='min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_35%,#fffdf7_100%)]'>
            <Navbar userInfo={userInfo} />

            <div className='max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10'>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className='inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors'
                >
                    <MdArrowBack size={18} />
                    Back to notes
                </button>

                <div className='mt-6'>
                    <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8'>
                        <div>
                            <p className='text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400'>Document Workspace</p>
                            <h1 className='text-3xl md:text-5xl font-bold text-slate-950 mt-3 flex items-center gap-3'>
                                <MdDescription className='text-slate-300 shrink-0' />
                                {isEditing ? 'Edit document' : 'New document'}
                            </h1>
                            <p className='text-sm md:text-base text-slate-500 mt-3 max-w-2xl'>
                                A quieter space for long-form notes, structured thinking and deeper writing sessions.
                            </p>
                        </div>

                        {isEditing && noteData && (
                            <p className='text-sm text-slate-500'>
                                Last updated {formatNoteDate(noteData.updatedAt || noteData.createdAt)}
                            </p>
                        )}
                    </div>

                    {loading ? (
                        <p className='text-sm text-slate-500'>Loading document...</p>
                    ) : (
                        <AddEditNotes
                            type={isEditing ? 'edit' : 'add'}
                            noteData={noteData}
                            editorVariant='document'
                            hideCloseButton
                            onClose={() => navigate('/dashboard')}
                            onSaveSuccess={(savedNote) => navigate(`/documents/${savedNote._id}`, { replace: true })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentEditor;
