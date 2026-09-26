import React, { useState, useEffect, useRef } from 'react';
import { Tag as TagIcon, Plus, ChevronRight, X, Sparkles, Folder, Palette } from 'lucide-react';
import { TagItem, loadStoredTags, createNewTag, DEFAULT_TAG_GROUPS, COLOR_PALETTE } from '../utils/tagStore';

interface TagInputWithMentionProps {
  value: string;
  onChange: (value: string) => void;
  onTagSelected?: (tagName: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  openTagManagerModal?: () => void;
  hideTagButtons?: boolean;
}

// Helper to compute exact caret / text line coordinates inside textarea
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
    'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize'
  ];

  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  properties.forEach(prop => {
    // @ts-ignore
    style[prop] = computed[prop];
  });

  div.textContent = element.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = element.value.substring(position, position + 1) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + (parseInt(computed.borderTopWidth) || 0),
    left: span.offsetLeft + (parseInt(computed.borderLeftWidth) || 0),
    height: parseInt(computed.lineHeight) || 18,
  };

  document.body.removeChild(div);
  return coordinates;
}

export default function TagInputWithMention({
  value,
  onChange,
  onTagSelected,
  placeholder = "Digite aqui... (use @ para tags, @# para criar novas)",
  className = "",
  rows = 4,
  openTagManagerModal,
  hideTagButtons = false
}: TagInputWithMentionProps) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [isCreationMode, setIsCreationMode] = useState(false);
  const [newTagNameInput, setNewTagNameInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f59e0b');
  const [selectedParentGroup, setSelectedParentGroup] = useState<string | null>(null);
  const [selectedParentTag, setSelectedParentTag] = useState<TagItem | null>(null);
  const [expandedTagIds, setExpandedTagIds] = useState<Record<string, boolean>>({});
  const [dropdownPos, setDropdownPos] = useState({ top: 38, left: 12 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTags(loadStoredTags());
  }, [showDropdown]);

  useEffect(() => {
    if (isCreationMode) {
      const clean = dropdownQuery.replace(/^[@#]+/, '').replace(/#/g, '');
      setNewTagNameInput(clean);
    }
  }, [dropdownQuery, isCreationMode]);

  // Recalculate dropdown position on exact line where `@` or `@#` is typed
  const updateDropdownPosition = (targetIndex: number) => {
    if (!textareaRef.current) return;
    try {
      const coords = getCaretCoordinates(textareaRef.current, targetIndex);
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      const textareaWidth = textareaRef.current.clientWidth || 320;
      const textareaHeight = textareaRef.current.clientHeight || 200;

      let top = coords.top - scrollTop + coords.height + 4;
      let left = Math.max(8, Math.min(coords.left - scrollLeft, textareaWidth - 320));

      // If opening near bottom edge, flip above the line
      if (top + 260 > textareaHeight && top > 200) {
        top = Math.max(8, coords.top - scrollTop - 260);
      }

      setDropdownPos({ top, left });
    } catch (err) {
      // Fallback
      setDropdownPos({ top: 40, left: 12 });
    }
  };

  // Handle textarea text changes & check for `@` or `@#`
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Look backwards from cursor to find if user is typing `@` or `@#`
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtHash = textBeforeCursor.lastIndexOf('@#');
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAtHash !== -1 && lastAtHash >= textBeforeCursor.length - 25) {
      // Inline tag creation mode (@#)
      const query = textBeforeCursor.substring(lastAtHash + 2);
      if (!query.includes(' ') && !query.includes('\n')) {
        setShowDropdown(true);
        setIsCreationMode(true);
        setDropdownQuery(query.replace(/#/g, ''));
        updateDropdownPosition(lastAtHash);
        return;
      }
    }

    if (lastAt !== -1 && lastAt >= textBeforeCursor.length - 25) {
      // Mention invocation mode (@)
      const query = textBeforeCursor.substring(lastAt + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setShowDropdown(true);
        setIsCreationMode(false);
        setDropdownQuery(query.replace(/#/g, ''));
        updateDropdownPosition(lastAt);
        return;
      }
    }

    setShowDropdown(false);
    setSelectedParentGroup(null);
    setSelectedParentTag(null);
  };

  // Insert tag into textarea cleanly and immediately restore typing
  const insertTagIntoText = (tagName: string) => {
    const cleanTagName = tagName.replace(/^[@#]+/, '').replace(/#/g, '').trim();
    if (!cleanTagName) return;

    const textarea = textareaRef.current;
    const currentVal = value || '';
    const cursorPos = textarea?.selectionStart ?? currentVal.length;

    const textBefore = currentVal.substring(0, cursorPos);
    const textAfter = currentVal.substring(cursorPos);

    // Find nearest `@#` or `@` before cursor
    const lastAtHash = textBefore.lastIndexOf('@#');
    const lastAt = textBefore.lastIndexOf('@');

    let targetIndex = -1;
    if (lastAtHash !== -1 && lastAtHash >= textBefore.length - 30) {
      targetIndex = lastAtHash;
    } else if (lastAt !== -1 && lastAt >= textBefore.length - 30) {
      targetIndex = lastAt;
    }

    let newText: string;
    let nextCursorPos: number;

    if (targetIndex !== -1) {
      const prefix = textBefore.substring(0, targetIndex);
      const inserted = `@${cleanTagName} `;
      newText = `${prefix}${inserted}${textAfter}`;
      nextCursorPos = prefix.length + inserted.length;
    } else {
      const prefix = currentVal ? `${currentVal} ` : '';
      const inserted = `@${cleanTagName} `;
      newText = `${prefix}${inserted}`;
      nextCursorPos = newText.length;
    }

    onChange(newText);
    setShowDropdown(false);
    setIsCreationMode(false);
    setNewTagNameInput('');
    setSelectedParentGroup(null);
    setSelectedParentTag(null);

    if (onTagSelected) {
      onTagSelected(cleanTagName);
    }

    // Refocus textarea and place cursor directly after tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 20);
  };

  const handleCreateInlineTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = (newTagNameInput || dropdownQuery).replace(/^[@#]+/, '').replace(/#/g, '').trim();
    if (!cleanName) return;

    const group = selectedParentGroup || 'Foco';
    const parentTagId = selectedParentTag?.id;
    const parentTagName = selectedParentTag?.name;

    const created = createNewTag(cleanName, group, selectedColor, parentTagId, parentTagName);
    
    // Update local state immediately
    const updatedTags = loadStoredTags();
    setTags(updatedTags);

    insertTagIntoText(created.name);
  };

  // Extract active tags used in the current text for visual chips display
  const extractUsedTags = () => {
    if (!value) return [];
    const matches = value.match(/@[^\s@#]+/g) || [];
    const unique = Array.from(new Set(matches.map(m => m.replace(/^@/, '').trim()))).filter(Boolean);
    return unique.map(name => {
      const found = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      return {
        name,
        color: found ? found.color : '#f97316',
        group: found ? found.group : undefined
      };
    });
  };

  const usedTags = extractUsedTags();

  // Group tags
  const availableGroups = Array.from(new Set([...DEFAULT_TAG_GROUPS, ...tags.map(t => t.group)])).filter(Boolean);

  const isFlex = className.includes('flex-1') || className.includes('h-full') || className.includes('h-') || rows >= 8;

  return (
    <div className={`relative w-full ${isFlex ? 'flex-1 flex flex-col min-h-[220px]' : 'space-y-1.5'}`}>
      <div className={`relative bg-zinc-950 border border-zinc-800 rounded-xl focus-within:border-orange-500/80 transition-all overflow-hidden ${isFlex ? 'flex-1 flex flex-col' : ''}`}>
        
        {/* Direct, responsive native textarea for 100% reliable editing and typing */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          rows={rows}
          className={`relative z-10 w-full px-3.5 py-2.5 bg-transparent text-zinc-100 placeholder-zinc-500 text-xs font-sans leading-relaxed focus:outline-none transition-all resize-y caret-orange-500 selection:bg-orange-500/30 selection:text-white ${
            isFlex ? 'flex-1 h-full min-h-[220px] sm:min-h-[280px] lg:min-h-[340px]' : ''
          } ${className}`}
          style={{
            wordBreak: 'break-word'
          }}
        />

        {/* Floating Quick Action Button */}
        {!hideTagButtons && (
          <div className="absolute right-2 bottom-2 z-20 flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl backdrop-blur-sm border border-zinc-800/80 shadow-md">
            <button
              type="button"
              onClick={() => {
                if (!showDropdown && textareaRef.current) {
                  const cursorPos = textareaRef.current.selectionStart || value.length;
                  updateDropdownPosition(cursorPos);
                }
                setShowDropdown(!showDropdown);
                setSelectedParentGroup(null);
                setSelectedParentTag(null);
                setIsCreationMode(false);
              }}
              className="p-1.5 bg-zinc-900 hover:bg-orange-500/20 hover:text-orange-400 border border-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
              title="Inserir Tag (@)"
            >
              <TagIcon className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[10px] font-mono font-bold text-orange-400">@</span>
            </button>

            {openTagManagerModal && (
              <button
                type="button"
                onClick={openTagManagerModal}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs transition-colors"
                title="Central de Tags"
              >
                <Folder className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chips bar showing active tags with their colors */}
      {usedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
          <span className="text-[10px] text-zinc-500 font-mono font-medium">Tags ativas:</span>
          {usedTags.map(tag => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shadow-xs"
              style={{
                backgroundColor: `${tag.color}18`,
                borderColor: `${tag.color}40`,
                color: tag.color
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
              @{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Mention Dropdown Overlay - Positioned exactly at line invocation */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`
          }}
          className="absolute z-50 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 space-y-2 text-xs overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-white/10"
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

          {isCreationMode ? (
            /* Creation Mode */
            <form onSubmit={handleCreateInlineTag} className="space-y-3 p-1">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Nome da Tag:</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-orange-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    value={newTagNameInput}
                    onChange={(e) => setNewTagNameInput(e.target.value.replace(/[@#]/g, ''))}
                    placeholder="NomeDaTag"
                    className="w-full pl-6 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-semibold"
                    autoFocus
                  />
                </div>
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

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Cor da Tag:</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.slice(0, 10).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        selectedColor === c ? 'scale-125 border-white' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Criar e Inserir Tag
              </button>
            </form>
          ) : (
            /* Mention Selection Mode with Hierarchical Navigation */
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              
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
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="font-semibold text-xs" style={{ color: t.color }}>#{t.name}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{t.group}</span>
                      </button>
                    ))}

                  {/* Option to create if not found */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreationMode(true);
                      setNewTagNameInput(dropdownQuery.replace(/^[@#]+/, '').replace(/#/g, ''));
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center gap-2 border border-orange-500/30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Criar tag "{dropdownQuery.replace(/^[@#]+/, '').replace(/#/g, '')}"</span>
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
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedParentTag.color }} />
                    <span style={{ color: selectedParentTag.color }}>Selecionar #{selectedParentTag.name}</span>
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
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subTag.color }} />
                          <span className="font-semibold text-xs" style={{ color: subTag.color }}>#{subTag.name}</span>
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                /* Showing Groups and Main Tags in a Clean Tree Hierarchy with Click-to-Expand Sub-tags */
                availableGroups.map(groupName => {
                  const groupTags = tags.filter(t => t.group === groupName);
                  if (groupTags.length === 0) return null;

                  // Filter to get only root tags in this group
                  const rootGroupTags = groupTags.filter(t => 
                    !groupTags.some(p => p.id !== t.id && (p.id === t.parentTagId || p.name === t.parentTagName))
                  );

                  const renderTagTree = (tag: TagItem, level: number = 0): React.ReactNode => {
                    const subTags = tags.filter(st => st.id !== tag.id && (st.parentTagId === tag.id || (st.parentTagName && st.parentTagName === tag.name)));
                    const hasSubTags = subTags.length > 0;
                    const isExpanded = !!expandedTagIds[tag.id];

                    return (
                      <div key={tag.id} className="space-y-1">
                        <div
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800/60 transition-all ${
                            level > 0 ? 'bg-zinc-950/70 border-zinc-850' : ''
                          }`}
                        >
                          {/* Clicking tag name or row inserts tag if no subtags or toggles expansion if subtags exist */}
                          <button
                            type="button"
                            onClick={() => {
                              if (hasSubTags) {
                                setExpandedTagIds(prev => ({ ...prev, [tag.id]: !prev[tag.id] }));
                              } else {
                                insertTagIntoText(tag.name);
                              }
                            }}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left"
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                            <span className={`font-semibold truncate ${level > 0 ? 'text-[11px]' : 'text-xs'}`} style={{ color: tag.color }}>
                              #{tag.name}
                            </span>
                          </button>

                          {/* Sub-tag toggle button - ONLY opened upon clicking the parent tag */}
                          {hasSubTags && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => insertTagIntoText(tag.name)}
                                className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
                                title={`Inserir #${tag.name}`}
                              >
                                Usar
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedTagIds(prev => ({ ...prev, [tag.id]: !prev[tag.id] }))}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                                  isExpanded
                                    ? 'bg-orange-500 text-white border-orange-400'
                                    : 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30'
                                }`}
                              >
                                <span>{subTags.length} sub-tags</span>
                                <ChevronRight className={`h-2.5 w-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Sub-tags are ONLY rendered when the user has clicked to expand */}
                        {hasSubTags && isExpanded && (
                          <div className="ml-3 pl-2.5 border-l-2 border-orange-500/40 space-y-1 my-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="text-[9px] text-zinc-500 font-mono px-1">Sub-tags de #{tag.name}:</div>
                            {subTags.map(subTag => renderTagTree(subTag, level + 1))}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={groupName} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-1">
                        <Folder className="h-3 w-3 text-orange-400" />
                        {groupName}
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {rootGroupTags.map(tag => renderTagTree(tag, 0))}
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
