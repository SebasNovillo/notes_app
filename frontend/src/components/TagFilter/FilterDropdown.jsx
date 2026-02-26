import React, { useState, useRef, useEffect } from 'react';
import { MdFilterList } from "react-icons/md";

const FilterDropdown = ({ allTags, selectedTags, onTagClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const hasFilters = selectedTags.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${isOpen || hasFilters
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                    }`}
                title="Filter by Tags"
            >
                <MdFilterList className="text-[18px]" />
                <span>Tags</span>
                {hasFilters && (
                    <span className="flex h-2 w-2 absolute top-2 right-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        Filter by Tags
                        {hasFilters && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case tracking-normal">
                                {selectedTags.length} active
                            </span>
                        )}
                    </h3>

                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {allTags.length > 0 ? (
                            allTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => onTagClick(tag)}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border ${isSelected
                                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        #{tag}
                                    </button>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-400 italic">No tags yet</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
