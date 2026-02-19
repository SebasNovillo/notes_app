import React from 'react'

const TagFilter = ({ allTags, selectedTags, onTagClick }) => {
    return (
        <div className='w-64 bg-slate-50 p-4 rounded-lg border border-slate-200'>
            <h3 className='text-sm font-semibold text-slate-700 mb-4'>Filter by Tags</h3>
            <div className='flex flex-col gap-2'>
                {allTags.length > 0 ? (
                    allTags.map((tag) => (
                        <div
                            key={tag}
                            onClick={() => onTagClick(tag)}
                            className={`flex items-center gap-2 cursor-pointer p-2 rounded-md transition-all ${selectedTags.includes(tag)
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-slate-200 text-slate-600'
                                }`}
                        >
                            <input
                                type='checkbox'
                                checked={selectedTags.includes(tag)}
                                readOnly
                                className='cursor-pointer accent-white'
                            />
                            <span className='text-sm'>#{tag}</span>
                        </div>
                    ))
                ) : (
                    <p className='text-xs text-slate-400'>No tags found</p>
                )}
            </div>
        </div>
    )
}

export default TagFilter
