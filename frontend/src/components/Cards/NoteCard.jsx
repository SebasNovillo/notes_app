import React from 'react';

import { MdOutlinePushPin } from "react-icons/md";
import { MdCreate, MdDelete, MdDownload } from "react-icons/md";
import { exportNoteToPDF } from "../../utils/exportUtils";

/**
 * Wraps occurrences of `query` in `text` with a <mark> tag.
 * Returns a string of HTML safe to set via dangerouslySetInnerHTML.
 */
const highlight = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Strips HTML tags from a string, returning plain text.
 */
const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const NoteCard = ({
    title,
    date,
    content,
    tags,
    isPinned,
    onEdit,
    onDelete,
    onPinNote,
    onTagClick,
    searchQuery = '',
}) => {
    const highlightedTitle = highlight(title, searchQuery);
    const plainContent = stripHtml(content);
    const highlightedContent = highlight(plainContent, searchQuery);

    return (
        <div className='group border-none shadow-sm rounded-xl p-5 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative flex flex-col h-full'>
            <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 pr-6'>
                    <h6
                        className='text-base font-semibold text-slate-800 leading-snug'
                        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                    />
                    <span className='text-[11px] font-medium text-slate-400'>{date}</span>
                </div>

                <MdOutlinePushPin className={`icon-btn absolute right-5 top-5 ${isPinned ? 'text-primary' : 'text-slate-300 hover:text-primary'}`} onClick={onPinNote} />
            </div>

            <div
                className='text-[13px] text-slate-600 mt-4 leading-relaxed line-clamp-4 flex-1'
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />

            <div className='flex items-end justify-between mt-6'>
                <div className='flex flex-wrap gap-2 text-xs'>
                    {tags.map((item) => {
                        const isTagMatched = searchQuery && item.toLowerCase().includes(searchQuery.toLowerCase());

                        return (
                            <span
                                key={item}
                                className={`px-2.5 py-1 rounded-md font-medium capitalize cursor-pointer transition-colors ${isTagMatched
                                        ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                                        : 'bg-primary/5 text-primary hover:bg-primary/10'
                                    }`}
                                onClick={() => onTagClick(item)}
                            >
                                #{item}
                            </span>
                        );
                    })}
                </div>

                <div className='flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 backdrop-blur pl-2 rounded-l-full'>
                    <MdDownload
                        className="text-[18px] text-slate-400 cursor-pointer hover:text-primary transition-colors"
                        title="Download PDF"
                        onClick={() => exportNoteToPDF(title, content)}
                    />
                    <MdCreate
                        className="text-[18px] text-slate-400 cursor-pointer hover:text-green-500 transition-colors"
                        onClick={onEdit}
                    />
                    <MdDelete
                        className="text-[18px] text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                        onClick={onDelete}
                    />
                </div>
            </div>
        </div>
    );
};

export default NoteCard