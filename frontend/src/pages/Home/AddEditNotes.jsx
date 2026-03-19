import React, { useEffect, useMemo, useState } from 'react'
import TagInput from '../../components/Input/TagInput'
import {
    MdClose,
    MdUndo,
    MdRedo,
    MdFormatBold,
    MdFormatItalic,
    MdFormatUnderlined,
    MdFormatListBulleted,
    MdFormatListNumbered,
    MdLink,
    MdOpenInFull,
    MdSave,
    MdDownload,
    MdPrint,
    MdFormatColorText,
    MdClear,
} from 'react-icons/md';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-text-style/color'

import axiosInstance from '../../utils/axiosInstance';
import { NOTE_MODE_META } from '../../utils/constants';
import { exportNoteToPDF, printNoteContent } from '../../utils/exportUtils';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const TEXT_STYLE_OPTIONS = [
    { value: 'paragraph', label: 'Normal text' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'quote', label: 'Quote' },
    { value: 'code', label: 'Code block' },
];
const TEXT_COLORS = ['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#d97706', '#64748b'];
const DEFAULT_TEXT_COLOR = '#0f172a';

const normalizeColorValue = (value) => {
    if (typeof value !== 'string') return DEFAULT_TEXT_COLOR;
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : DEFAULT_TEXT_COLOR;
};

const RibbonButton = ({ onClick, active = false, title, children, compact = false }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`toolbar-btn ${active ? 'is-active' : ''} ${compact ? 'toolbar-btn--compact' : ''}`}
    >
        {children}
    </button>
);

const Toolbar = ({
    editor,
    variant = 'quick',
    onSave,
    title,
    onStatusChange,
}) => {
    const isDocumentToolbar = variant === 'document';
    if (!editor) return null;

    const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
    const currentTextColor = normalizeColorValue(editor.getAttributes('textStyle').color);
    const currentTextStyle = editor.isActive('heading', { level: 1 })
        ? 'h1'
        : editor.isActive('heading', { level: 2 })
            ? 'h2'
            : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : editor.isActive('blockquote')
                    ? 'quote'
                    : editor.isActive('codeBlock')
                        ? 'code'
                        : 'paragraph';

    const applyTextStyle = (value) => {
        const chain = editor.chain().focus();

        if (value === 'paragraph') {
            chain.setParagraph().run();
            return;
        }

        if (value === 'quote') {
            chain.toggleBlockquote().run();
            return;
        }

        if (value === 'code') {
            chain.toggleCodeBlock().run();
            return;
        }

        chain.toggleHeading({ level: Number(value.replace('h', '')) }).run();
    };

    const handleSetLink = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        const url = window.prompt('Paste a URL', previousUrl);

        if (url === null) return;

        if (url.trim() === '') {
            editor.chain().focus().unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    const reportStatus = (message) => {
        onStatusChange?.(message);
    };

    const copyToClipboard = async (value, successMessage) => {
        try {
            await navigator.clipboard.writeText(value);
            reportStatus(successMessage);
        } catch {
            reportStatus('Clipboard is not available in this browser.');
        }
    };

    const handleSaveDocument = async () => {
        const saved = await onSave?.();
        if (saved) {
            reportStatus('Document saved.');
        }
    };

    const setTextColor = (color) => {
        editor.chain().focus().setColor(color).run();
        reportStatus('Text color updated.');
    };

    const clearTextColor = () => {
        editor.chain().focus().unsetColor().run();
        reportStatus('Text color cleared.');
    };

    return (
        <div className={`tiptap-toolbar ${isDocumentToolbar ? 'document-toolbar document-toolbar--minimal' : ''}`}>
            <div className='toolbar-main-row'>
                {isDocumentToolbar && (
                    <>
                        <RibbonButton onClick={() => void handleSaveDocument()} title="Save">
                            <MdSave size={18} />
                        </RibbonButton>
                        <div className="toolbar-divider" />
                    </>
                )}

                <RibbonButton onClick={() => editor.chain().focus().undo().run()} title="Undo" compact>
                    <MdUndo size={18} />
                </RibbonButton>
                <RibbonButton onClick={() => editor.chain().focus().redo().run()} title="Redo" compact>
                    <MdRedo size={18} />
                </RibbonButton>

                <div className="toolbar-divider" />

                <select
                    value={currentTextStyle}
                    onChange={(e) => applyTextStyle(e.target.value)}
                    className='toolbar-select'
                    title="Text Style"
                >
                    {TEXT_STYLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

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

                <label className='toolbar-color-input toolbar-color-input--compact'>
                    <MdFormatColorText size={16} />
                    <input
                        type="color"
                        value={currentTextColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        aria-label="Text color"
                    />
                </label>

                <button type="button" className='toolbar-clear-btn toolbar-clear-btn--compact' onClick={clearTextColor}>
                    <MdClear size={14} />
                </button>

                <div className="toolbar-divider" />

                {TEXT_COLORS.slice(0, 5).map((color) => (
                    <button
                        key={color}
                        type="button"
                        className={`toolbar-swatch ${currentTextColor === color ? 'is-active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTextColor(color)}
                        title={color}
                    />
                ))}

                <div className="toolbar-divider" />

                <RibbonButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold" compact>
                    <MdFormatBold size={18} />
                </RibbonButton>
                <RibbonButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic" compact>
                    <MdFormatItalic size={18} />
                </RibbonButton>
                <RibbonButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline" compact>
                    <MdFormatUnderlined size={18} />
                </RibbonButton>

                <div className="toolbar-divider" />

                <RibbonButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list" compact>
                    <MdFormatListBulleted size={18} />
                </RibbonButton>
                <RibbonButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list" compact>
                    <MdFormatListNumbered size={18} />
                </RibbonButton>
                <RibbonButton onClick={handleSetLink} active={editor.isActive('link')} title="Add link" compact>
                    <MdLink size={18} />
                </RibbonButton>

                {isDocumentToolbar && (
                    <>
                        <div className="toolbar-divider" />
                        <RibbonButton
                            onClick={() => {
                                exportNoteToPDF(title || 'Untitled document', editor.getHTML());
                                reportStatus('PDF download started.');
                            }}
                            title="Download PDF"
                            compact
                        >
                            <MdDownload size={18} />
                        </RibbonButton>
                        <RibbonButton
                            onClick={() => {
                                const opened = printNoteContent(title || 'Untitled document', editor.getHTML());
                                reportStatus(opened ? 'Print dialog opened.' : 'Allow pop-ups to print this document.');
                            }}
                            title="Print"
                            compact
                        >
                            <MdPrint size={18} />
                        </RibbonButton>
                    </>
                )}
            </div>
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
    externalTitle,
    onTitleChange,
    hideTitleField = false,
}) => {
    const [title, setTitle] = useState(noteData?.title || "");
    const [tags, setTags] = useState(noteData?.tags || []);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    const noteMode = editorVariant === 'document' ? 'document' : (noteData?.noteMode || 'quick');
    const modeMeta = useMemo(() => NOTE_MODE_META[noteMode] || NOTE_MODE_META.quick, [noteMode]);
    const isDocumentEditor = editorVariant === 'document';
    const currentTitle = externalTitle !== undefined ? externalTitle : title;
    const containerClassName = isDocumentEditor ? 'w-full' : 'relative';

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            FontSize,
            Color,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
        ],
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

    useEffect(() => {
        if (!statusMessage) return undefined;

        const timeoutId = window.setTimeout(() => {
            setStatusMessage('');
        }, 2600);

        return () => window.clearTimeout(timeoutId);
    }, [statusMessage]);

    const persistNote = async () => {
        const payload = {
            title: currentTitle,
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
        if (!currentTitle?.trim()) {
            setError("Please enter the title");
            return false;
        }

        if (!editor || editor.isEmpty) {
            setError("Please enter the content");
            return false;
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

                return true;
            }
        } catch (apiError) {
            if (apiError.response?.data?.message) {
                setError(apiError.response.data.message);
            } else {
                setError("Unexpected error while saving the note");
            }
        }

        return false;
    };

    useEffect(() => {
        if (!isDocumentEditor) return undefined;

        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                void handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDocumentEditor, handleSave]);

    const handleTitleInputChange = (value) => {
        setTitle(value);
        onTitleChange?.(value);
    };

    return (
        <div className={containerClassName}>
            {!isDocumentEditor && (
                <div className='flex items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100'>
                    <div>
                        <p className='text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400'>Quick Capture</p>
                        <p className='text-sm font-semibold text-slate-900 mt-1'>{modeMeta.label}</p>
                    </div>

                    <div className='flex items-center gap-2'>
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

                        {!hideCloseButton && (
                            <button
                                type="button"
                                className='w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors'
                                onClick={onClose}
                            >
                                <MdClose className='text-xl' />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!hideTitleField && (
                <div className='flex flex-col gap-2 mb-4'>
                    <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TITLE</label>
                    <input
                        type='text'
                        className={`outline-none transition-all pb-2 placeholder:text-slate-200 ${isDocumentEditor
                            ? 'text-6xl font-bold text-slate-950 border-b border-slate-200 focus:border-slate-400 bg-transparent'
                            : 'text-4xl font-semibold text-slate-950 border-b border-white hover:border-slate-100 focus:border-slate-200'
                            }`}
                        placeholder={noteMode === 'document' ? 'Untitled document' : 'Untitled note'}
                        value={currentTitle}
                        onChange={({ target }) => handleTitleInputChange(target.value)}
                    />
                </div>
            )}

            <div className='flex flex-col gap-2 mt-4'>
                {!isDocumentEditor && (
                    <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>CONTENT</label>
                )}
                <div className={`document-host ${isDocumentEditor ? 'document-shell' : ''}`}>
                    <Toolbar
                        editor={editor}
                        variant={isDocumentEditor ? 'document' : 'quick'}
                        onSave={handleSave}
                        title={currentTitle}
                        onStatusChange={setStatusMessage}
                    />
                    <div className={`document-page ${isDocumentEditor ? 'document-page--workspace is-full' : ''}`}>
                        <EditorContent editor={editor} className="tiptap-editor" />
                    </div>
                </div>
                {isDocumentEditor && statusMessage && (
                    <p className='document-status-message'>{statusMessage}</p>
                )}
            </div>

            {!isDocumentEditor && (
                <div className='mt-8 pt-4 border-t border-slate-50'>
                    <label className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>TAGS</label>
                    <TagInput tags={tags} setTags={setTags} />
                </div>
            )}

            {error && <p className='text-red-500 text-xs pt-4'>{error}</p>}

            <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 ${isDocumentEditor ? 'pt-0' : ''}`}>
                {!isDocumentEditor ? (
                    <p className='text-sm text-slate-500'>Quick notes stay lightweight so you can capture ideas without friction.</p>
                ) : <span />}

                {!isDocumentEditor && (
                    <button className='btn-primary' onClick={handleSave}>
                        {type === 'edit' ? 'Update Note' : noteMode === 'document' ? 'Create Document' : 'Add Note'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default AddEditNotes
