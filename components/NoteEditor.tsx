import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered } from 'lucide-react';
import { COLORS } from '@/lib/types';

interface NoteEditorProps {
  content: string;
  color: string;
  onChange: (content: string) => void;
  onColorChange: (color: string) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export default function NoteEditor({ content, color, onChange, onColorChange, onPointerDown }: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type here...',
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

  return (
    <div className="w-full h-full flex flex-col relative" onPointerDown={onPointerDown}>
      {editor && (
        <BubbleMenu editor={editor} className="flex bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden z-50">
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
