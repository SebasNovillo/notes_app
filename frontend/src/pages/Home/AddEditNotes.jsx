import React, { useEffect, useMemo, useState } from 'react'
import TagInput from '../../components/Input/TagInput'
import {
    MdClose,
    MdFormatBold,
    MdFormatItalic,
    MdFormatListBulleted,
    MdFormatListNumbered,
    MdCode,
    MdFormatQuote,
    MdOpenInFull,
} from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'

import axiosInstance from '../../utils/axiosInstance';
import { NOTE_MODE_META } from '../../utils/constants';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

const Toolbar = ({ editor }) => {
    if (!editor) return null;

    const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';

    return (
        <div className="tiptap-toolbar">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold"
            >
                <MdFormatBold size={20} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic"
            >
                <MdFormatItalic size={20} />
            </button>

            <select
                value={currentFontSize}
                onChange={(e) => {
                    if (e.target.value === 'default') {
                        editor.chain().focus().unsetFontSize().run();
                    } else {
                        editor.chain().focus().setFontSize(e.target.value).run();
                    }
                }}
                className="toolbar-select"
                title="Font Size"
            >
                <option value="default">Size</option>
                {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size.replace('px', '')}</option>
                ))}
            </select>

            <div className="toolbar-divider" />

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                title="H1"
            >
                <span className="font-bold text-sm">H1</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                title="H2"
            >
                <span className="font-bold text-sm">H2</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                title="Bullet List"
            >
                <MdFormatListBulleted size={20} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                title="Ordered List"
            >
                <MdFormatListNumbered size={20} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                title="Quote"
            >
                <MdFormatQuote size={20} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
                title="Code Block"
            >
                <MdCode size={20} />
            </button>
        </div>
    );
};

const AddEditNotes = ({
    noteData,
    type,
    getAllNotes,
    onClose,
    editorVariant = 'quick',
    onSaveSuccess,
    onOpenAsDocument,
    hideCloseButton = false,
}) => {
    const [title, setTitle] = useState(noteData?.title || "");
    const [tags, setTags] = useState(noteData?.tags || []);
    const [error, setError] = useState(null);

    const noteMode = editorVariant === 'document' ? 'document' : (noteData?.noteMode || 'quick');
    const modeMeta = useMemo(() => NOTE_MODE_META[noteMode] || NOTE_MODE_META.quick, [noteMode]);

    const editor = useEditor({
        extensions: [StarterKit, TextStyle, FontSize],
        content: noteData?.content || "",
    });

    useEffect(() => {
        setTitle(noteData?.title || "");
        setTags(noteData?.tags || []);
        setError(null);

        if (editor) {
            editor.commands.setContent(noteData?.content || "");
        }
    }, [noteData, editor]);

    const persistNote = async () => {
        const payload = {
            title,
            content: editor?.getHTML() || "",
            tags,
            folderId: noteData?.folderId || null,
            noteMode,
        };

        if (type === 'edit') {
            return axiosInstance.put(`/edit-note/${noteData._id}`, payload);
        }

        return axiosInstance.post("/add-note", payload);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Please enter the title");
            return;
        }

        if (!editor || editor.isEmpty) {
            setError("Please enter the content");
            return;
        }

        setError("");

        try {
            const response = await persistNote();

            if (response.data?.note) {
                getAllNotes?.();
                if (onSaveSuccess) {
                    onSaveSuccess(response.data.note);
                } else {
                    onClose?.();
                }
            }
        } catch (apiError) {
            if (apiError.response?.data?.message) {
                setError(apiError.response.data.message);
            } else {
                setError("Unexpected error while saving the note");
            }
        }
    };

    const containerClassName = editorVariant === 'document'
        ? 'w-full'
        : 'relative';

    return (
        <div className={containerClassName}>
            {!hideCloseButton && (
                <button
                    type="button"
                    className='w-10 h-10 rounded-full flex items-center justify-center absolute -top-3 -right-3 hover:bg-slate-50'
                    onClick={onClose}
                >
                    <MdClose className='text-xl text-slate-400' />
                </button>
            )}

            <div className={`rounded-2xl border p-4 mb-6 ${noteMode === 'document' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${noteMode === 'document' ? 'text-slate-300' : 'text-slate-400'}`}>
                    Workspace Mode
                </p>
                <div className='flex items-start justify-between gap-4 mt-2'>
                    <div>
                        <p className='text-lg font-semibold'>{modeMeta.label}</p>
                        <p className={`text-sm mt-1 ${noteMode === 'document' ? 'text-slate-300' : 'text-slate-600'}`}>
                            {modeMeta.description}
                        </p>
                    </div>

                    {noteMode === 'quick' && onOpenAsDocument && (
                        <button
                            type="button"
                            onClick={() => onOpenAsDocument({
                                title,
                                content: editor?.getHTML() || noteData?.content || "",
                                tags,
                                folderId: noteData?.folderId || null,
                                _id: noteData?._id,
                            })}
                            className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300'
                        >
                            <MdOpenInFull />
                            Continue as document
                        </button>
                    )}
                </div>
            </div>

            <div className='flex flex-col gap-2 mb-4'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TITLE</label>
                <input
                    type='text'
                    className={`outline-none transition-all pb-2 placeholder:text-slate-200 ${editorVariant === 'document'
                        ? 'text-5xl font-bold text-slate-950 border-b border-slate-100 focus:border-slate-300'
                        : 'text-4xl font-semibold text-slate-950 border-b border-white hover:border-slate-100 focus:border-slate-200'
                        }`}
                    placeholder={noteMode === 'document' ? 'Untitled document' : 'Untitled note'}
                    value={title}
                    onChange={({ target }) => setTitle(target.value)}
                />
            </div>

            <div className='flex flex-col gap-2 mt-4'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>CONTENT</label>
                <div className="document-host">
                    <Toolbar editor={editor} />
                    <div className={`document-page ${editorVariant === 'document' ? 'min-h-[72vh]' : ''}`}>
                        <EditorContent editor={editor} className="tiptap-editor" />
                    </div>
                </div>
            </div>

            <div className='mt-8 pt-4 border-t border-slate-50'>
                <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TAGS</label>
                <TagInput tags={tags} setTags={setTags} />
            </div>

            {error && <p className='text-red-500 text-xs pt-4'>{error}</p>}

            <div className='flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6'>
                {editorVariant === 'document' ? (
                    <p className='text-sm text-slate-500'>Documents give you more space for long-form thinking and structured writing.</p>
                ) : (
                    <p className='text-sm text-slate-500'>Quick notes stay lightweight so you can capture ideas without friction.</p>
                )}

                <button className='btn-primary font-medium p-3 uppercase tracking-widest' onClick={handleSave}>
                    {type === 'edit' ? 'Update Note' : noteMode === 'document' ? 'Create Document' : 'Add Note'}
                </button>
            </div>
        </div>
    )
}

export default AddEditNotes
