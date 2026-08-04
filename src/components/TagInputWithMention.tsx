import React, { useState, useEffect, useRef } from 'react';
import { Tag as TagIcon, Plus, ChevronRight, X, Sparkles, Folder } from 'lucide-react';
import { TagItem, loadStoredTags, createNewTag, DEFAULT_TAG_GROUPS } from '../utils/tagStore';

interface TagInputWithMentionProps {
  value: string;
  onChange: (value: string) => void;
  onTagSelected?: (tagName: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  openTagManagerModal?: () => void;
}

export default function TagInputWithMention({
  value,
  onChange,
  onTagSelected,
  placeholder = "Digite aqui... (use @ para tags, @# para criar novas)",
  className = "",
  rows = 4,
  openTagManagerModal
}: TagInputWithMentionProps) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [selectedParentGroup, setSelectedParentGroup] = useState<string | null>(null);
  const [selectedParentTag, setSelectedParentTag] = useState<TagItem | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTags(loadStoredTags());
  }, [showDropdown]);

  // Handle textarea text changes & check for `@` or `@#`
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Look backwards from cursor to find if user is typing `@` or `@#`
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtHash = textBeforeCursor.lastIndexOf('@#');
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAtHash !== -1 && lastAtHash >= textBeforeCursor.length - 20) {
      // Inline tag creation mode
      const query = textBeforeCursor.substring(lastAtHash + 2);
      if (!query.includes(' ') && !query.includes('\n')) {
        setShowDropdown(true);
        setIsCreationMode(true);
        setDropdownQuery(query);
        return;
      }
    }

    if (lastAt !== -1 && lastAt >= textBeforeCursor.length - 20) {
      // Mention invocation mode
      const query = textBeforeCursor.substring(lastAt + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setShowDropdown(true);
        setIsCreationMode(false);
        setDropdownQuery(query);
        return;
      }
    }

    setShowDropdown(false);
    setSelectedParentGroup(null);
    setSelectedParentTag(null);
  };

  // Insert tag into textarea at cursor position
  const insertTagIntoText = (tagName: string) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart || 0;
    const textBefore = value.substring(0, cursorPos);
    const textAfter = value.substring(cursorPos);

    // Find nearest `@` or `@#` before cursor
    const lastAtHash = textBefore.lastIndexOf('@#');
    const lastAt = textBefore.lastIndexOf('@');
    const targetIndex = lastAtHash !== -1 && lastAtHash > lastAt ? lastAtHash : lastAt;

    let newText = value;
    if (targetIndex !== -1) {
      const prefix = value.substring(0, targetIndex);
      newText = `${prefix}@${tagName} ${textAfter}`;
    } else {
      newText = `${value} @${tagName} `;
    }

    onChange(newText);
    setShowDropdown(false);
    setSelectedParentGroup(null);
    setSelectedParentTag(null);
    if (onTagSelected) {
      onTagSelected(tagName);
    }

    // Refocus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleCreateInlineTag = () => {
    if (!dropdownQuery.trim()) return;
    const group = selectedParentGroup || 'Foco';
    const parentTagId = selectedParentTag?.id;
    const parentTagName = selectedParentTag?.name;

    const created = createNewTag(dropdownQuery, group, undefined, parentTagId, parentTagName);
    insertTagIntoText(created.name);
  };

  // Group tags
  const availableGroups = Array.from(new Set([...DEFAULT_TAG_GROUPS, ...tags.map(t => t.group)])).filter(Boolean);

  return (
    <div className="relative w-full space-y-1.5">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/80 transition-all resize-y ${className}`}
        />

        {/* Floating Quick Action Button */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setSelectedParentGroup(null);
              setSelectedParentTag(null);
              setIsCreationMode(false);
            }}
            className="p-1.5 bg-zinc-900/90 hover:bg-orange-500/20 hover:text-orange-400 border border-zinc-800 text-zinc-400 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
            title="Inserir Tag (@)"
          >
            <TagIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-mono font-bold">@</span>
          </button>

          {openTagManagerModal && (
            <button
              type="button"
              onClick={openTagManagerModal}
              className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-xs transition-colors"
              title="Central de Tags"
            >
              <Folder className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mention Dropdown Overlay */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-2 z-50 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 space-y-2 text-xs overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 px-1">
            <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <TagIcon className="h-3 w-3" />
              {isCreationMode ? 'Criar Nova Tag (@#)' : 'Selecionar Tag (@)'}
            </span>

            <button
              onClick={() => setShowDropdown(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {isCreationMode || dropdownQuery.startsWith('#') ? (
            /* Creation Mode */
            <div className="space-y-3 p-1">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 text-[11px] block mb-1">Criar tag:</span>
                <span className="font-mono font-bold text-orange-400 text-xs">
                  #{dropdownQuery.replace(/^#/, '')}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Grupo da Tag:</label>
                <div className="flex flex-wrap gap-1">
                  {availableGroups.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedParentGroup(g)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        selectedParentGroup === g
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateInlineTag}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Criar e Inserir Tag
              </button>
            </div>
          ) : (
            /* Mention Selection Mode with Hierarchical Navigation */
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              
              {/* Back button if inside sub-tag view */}
              {selectedParentTag && (
                <button
                  type="button"
                  onClick={() => setSelectedParentTag(null)}
                  className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 px-1 py-0.5"
                >
                  &larr; Voltar para {selectedParentGroup || 'Tags Principais'}
                </button>
              )}

              {/* Filtering or Group Navigation */}
              {dropdownQuery ? (
                /* Direct search match */
                <div className="space-y-1">
                  {tags
                    .filter(t => t.name.toLowerCase().includes(dropdownQuery.toLowerCase()))
                    .map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => insertTagIntoText(t.name)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition-colors border border-zinc-800/60"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="font-semibold text-xs">#{t.name}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{t.group}</span>
                      </button>
                    ))}

                  {/* Option to create if not found */}
                  <button
                    type="button"
                    onClick={() => setIsCreationMode(true)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center gap-2 border border-orange-500/30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Criar tag "#{dropdownQuery}"</span>
                  </button>
                </div>
              ) : selectedParentTag ? (
                /* Showing sub-tags under selected parent tag */
                <div className="space-y-1.5">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider px-1">
                    Sub-tags de #{selectedParentTag.name}:
                  </div>

                  {/* Select the parent tag itself */}
                  <button
                    type="button"
                    onClick={() => insertTagIntoText(selectedParentTag.name)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-orange-400 font-bold flex items-center gap-2 border border-zinc-800"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedParentTag.color }} />
                    <span>Selecionar #{selectedParentTag.name}</span>
                  </button>

                  {/* List children sub-tags */}
                  {tags
                    .filter(t => t.parentTagId === selectedParentTag.id || t.parentTagName === selectedParentTag.name)
                    .map(subTag => (
                      <button
                        key={subTag.id}
                        type="button"
                        onClick={() => insertTagIntoText(subTag.name)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between border border-zinc-800/60 transition-colors pl-6"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subTag.color }} />
                          <span className="font-semibold text-xs">#{subTag.name}</span>
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                /* Showing Groups and Main Tags */
                availableGroups.map(groupName => {
                  const groupTags = tags.filter(t => t.group === groupName);

                  return (
                    <div key={groupName} className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-1">
                        <Folder className="h-3 w-3 text-orange-400" />
                        {groupName}
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {groupTags.map(tag => {
                          const subTags = tags.filter(st => st.parentTagId === tag.id || st.parentTagName === tag.name);
                          const hasSubTags = subTags.length > 0;

                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (hasSubTags) {
                                  setSelectedParentTag(tag);
                                } else {
                                  insertTagIntoText(tag.name);
                                }
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between border border-zinc-800/60 transition-colors group"
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                <span className="font-semibold text-xs">#{tag.name}</span>
                              </span>

                              {hasSubTags ? (
                                <span className="text-[10px] text-orange-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                  {subTags.length} sub-tags
                                  <ChevronRight className="h-3 w-3" />
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
