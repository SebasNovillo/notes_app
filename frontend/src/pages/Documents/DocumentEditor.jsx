import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../components/Navbar/Navbar';
import AddEditNotes from '../Home/AddEditNotes';
import axiosInstance from '../../utils/axiosInstance';

const DocumentEditor = () => {
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [documentTitle, setDocumentTitle] = useState('Untitled document');

    const navigate = useNavigate();
    const location = useLocation();
    const { noteId } = useParams();

    const isEditing = Boolean(noteId);

    const getUserInfo = async () => {
        try {
            await axiosInstance.get("/get-user");
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.clear();
                navigate("/login");
            }
        }
    };

    const loadNote = async () => {
        if (location.state?.draft && isEditing) {
            const draftNote = {
                ...location.state.draft,
                _id: noteId,
                noteMode: "document",
            };
            setNoteData(draftNote);
            setDocumentTitle(draftNote.title || 'Untitled document');
            return;
        }

        if (!isEditing) {
            const draftNote = {
                ...(location.state?.draft || {}),
                noteMode: "document",
            };
            setNoteData(draftNote);
            setDocumentTitle(draftNote.title || 'Untitled document');
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get(`/get-note/${noteId}`);
            if (response.data?.note) {
                setNoteData(response.data.note);
                setDocumentTitle(response.data.note.title || 'Untitled document');
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
        <div className='min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#f5f7fb_100%)]'>
            <Navbar
                documentTitle={documentTitle}
                onDocumentTitleChange={setDocumentTitle}
                documentMinimal
                onBack={() => navigate('/dashboard')}
            />

            <div className='w-full py-0'>
                {loading ? (
                    <p className='text-sm text-slate-500 px-4 md:px-6 mt-4'>Loading document...</p>
                ) : (
                    <AddEditNotes
                        type={isEditing ? 'edit' : 'add'}
                        noteData={noteData}
                        editorVariant='document'
                        hideCloseButton
                        hideTitleField
                        externalTitle={documentTitle}
                        onTitleChange={setDocumentTitle}
                        onClose={() => navigate('/dashboard')}
                        onSaveSuccess={(savedNote) => {
                            setNoteData(savedNote);
                            setDocumentTitle(savedNote.title || 'Untitled document');
                            navigate(`/documents/${savedNote._id}`, { replace: true });
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default DocumentEditor;
