import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react';
import { COLORS, Note } from '@/lib/types';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';

interface NoteEditorProps {
  content: string;
  color: string;
  onChange: (content: string) => void;
  onColorChange: (color: string) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export default function NoteEditor({ content, color, onChange, onColorChange, onPointerDown }: NoteEditorProps) {
  const { stateRef, forceUpdate } = useAppContext();
  const { switchFolder } = useActions();
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type here...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full h-full font-hand text-lg leading-relaxed text-slate-700',
      },
      handleClick: (view, pos, event) => {
        const { schema, doc, tr } = view.state;
        const range = editor?.state.selection;
        
        // Check if we clicked on a link
        const target = event.target as HTMLElement;
        const linkElement = target.closest('a');
        
        if (linkElement && linkElement.href) {
          const href = linkElement.getAttribute('href');
          if (href?.startsWith('note://')) {
            const noteId = href.replace('note://', '');
            
            // Find the note
            for (const folder of stateRef.current.folders) {
              const notes = stateRef.current.notes[folder] || [];
              const note = notes.find(n => n.id === noteId);
              if (note) {
                // Navigate to the note
                if (stateRef.current.currentFolder !== folder) {
                  switchFolder(folder);
                }
                
                const targetX = note.x + note.w / 2;
                const targetY = note.y + note.h / 2;
                
                stateRef.current.view.x = window.innerWidth / 2 - targetX * stateRef.current.view.zoom;
                stateRef.current.view.y = window.innerHeight / 2 - targetY * stateRef.current.view.zoom;
                
                stateRef.current.selection.clear();
                stateRef.current.selection.add(note.id);
                
                forceUpdate();
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (content === '' && editor.isEmpty) return;
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const setLink = (noteId: string) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: `note://${noteId}` }).run();
    setShowLinkMenu(false);
    setLinkSearch('');
  };

  const allNotes: { folder: string; note: Note }[] = [];
  for (const folder of stateRef.current.folders) {
    const notes = stateRef.current.notes[folder] || [];
    for (const note of notes) {
      allNotes.push({ folder, note });
    }
  }

  const filteredNotes = allNotes.filter(n => {
    const textContent = n.note.content.replace(/<[^>]*>?/gm, '').toLowerCase();
    return textContent.includes(linkSearch.toLowerCase());
  }).slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col relative" onPointerDown={onPointerDown}>
      {editor && (
        <BubbleMenu editor={editor} className="flex bg-white shadow-md border border-slate-200 rounded-lg overflow-visible z-50 relative">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('bold') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('italic') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('strike') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <div className="w-px bg-slate-200 my-1 mx-1" />
          
          <div className="relative">
            <button
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  setShowLinkMenu(!showLinkMenu);
                }
              }}
              className={`p-2 hover:bg-slate-100 transition-colors ${editor.isActive('link') ? 'bg-slate-100 text-blue-600' : 'text-slate-600'}`}
              title={editor.isActive('link') ? "Remove Link" : "Link to Note"}
            >
              {editor.isActive('link') ? <Unlink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            
            {showLinkMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[60]">
                <div className="p-2 border-b border-slate-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search notes to link..."
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowLinkMenu(false);
                      }
                    }}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredNotes.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No notes found</div>
                  ) : (
                    filteredNotes.map((n, i) => (
                      <div
                        key={i}
                        onClick={() => setLink(n.note.id)}
                        className="p-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="text-[10px] font-semibold text-blue-500 mb-0.5">{n.folder}</div>
                        <div className="text-xs text-slate-700 line-clamp-1">
                          {n.note.content.replace(/<[^>]*>?/gm, '') || 'Empty note'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-8" />
      <div className="absolute bottom-2 left-2 flex gap-1.5 z-10" onPointerDown={(e) => e.stopPropagation()}>
        {Object.entries(COLORS).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onColorChange(key)}
            className={`w-4 h-4 rounded-full border hover:scale-110 transition-transform ${color === key ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-black/10'}`}
            style={{ backgroundColor: value.bg }}
            title={key}
          />
        ))}
      </div>
    </div>
  );
}
