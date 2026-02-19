import React, { useState, useEffect } from 'react'
import TagInput from '../../components/Input/TagInput'
import { MdClose, MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdCode, MdFormatQuote, MdFunctions } from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import axiosInstance from '../../utils/axiosInstance';

const Toolbar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="tiptap-toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold"
            >
                <MdFormatBold size={20} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic"
            >
                <MdFormatItalic size={20} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                title="H1"
            >
                <span className="font-bold">H1</span>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                title="H2"
            >
                <span className="font-bold">H2</span>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                title="Bullet List"
            >
                <MdFormatListBulleted size={20} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                title="Ordered List"
            >
                <MdFormatListNumbered size={20} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                title="Quote"
            >
                <MdFormatQuote size={20} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
                title="Code Block"
            >
                <MdCode size={20} />
            </button>
        </div>
    );
};

const AddEditNotes = ({ noteData, type, getAllNotes, onClose }) => {

    const [title, setTitle] = useState(noteData?.title || "");
    const [tags, setTags] = useState(noteData?.tags || []);
    const [error, setError] = useState(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: noteData?.content || "",
        onUpdate: ({ editor }) => {
            // No need to manually set content state every keystroke if we grab it on save
        }
    });

    // Add Note
    const addNewNote = async () => {
        const content = editor.getHTML();
        try {
            const response = await axiosInstance.post("/add-note", {
                title,
                content,
                tags,
            });

            if (response.data && response.data.note) {
                getAllNotes();
                onClose();
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            }
        }
    };

    // Edit Note
    const editNote = async () => {
        const content = editor.getHTML();
        const noteId = noteData._id;
        try {
            const response = await axiosInstance.put("/edit-note/" + noteId, {
                title,
                content,
                tags,
            });

            if (response.data && response.data.note) {
                getAllNotes();
                onClose();
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            }
        }
    };

    const handleAddNote = () => {
        if (!title) {
            setError("Please enter the title");
            return;
        }

        if (editor.isEmpty) {
            setError("Please enter the content");
            return;
        }

        setError("");

        if (type === 'edit') {
            editNote();
        } else {
            addNewNote();
        }
    };

    return (
        <div className='relative'>

            <button className='w-10 h-10 rounded-full flex items-center justify-center absolute -top-3 -right-3 hover:bg-slate-50' onClick={onClose}
            >
                <MdClose className='text-xl text-slate-400' />
            </button>

            <div className='flex flex-col gap-2'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TITLE</label>
                <input
                    type='text'
                    className='text-4xl font-semibold text-slate-950 outline-none border-b border-white hover:border-slate-100 focus:border-slate-200 transition-all pb-2 mb-4 placeholder:text-slate-200'
                    placeholder='Untitled Note'
                    value={title}
                    onChange={({ target }) => setTitle(target.value)}
                />
            </div>

            <div className='flex flex-col gap-2 mt-4'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>CONTENT</label>
                <div className="border border-slate-50 rounded-lg p-2 min-h-[500px]">
                    <Toolbar editor={editor} />
                    <EditorContent editor={editor} className="tiptap-editor" />
                </div>
            </div>

            <div className='mt-8 pt-4 border-t border-slate-50'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TAGS</label>
                <TagInput tags={tags} setTags={setTags} />
            </div>

            {error && <p className='text-red-500 text-xs pt-4'>{error}</p>}

            <button className='btn-primary font-medium mt-5 p-3 uppercase tracking-widest' onClick={handleAddNote}>
                {type === 'edit' ? 'Update Note' : 'Add Note'}
            </button>
        </div>
    )
}

export default AddEditNotes
