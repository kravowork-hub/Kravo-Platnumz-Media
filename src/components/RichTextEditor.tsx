import { useRef } from 'react';
import { Bold, Italic, Underline, Link, List, ListOrdered, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-input)] rounded-sm border border-[var(--border-color)] overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#1a1a1a] border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) execCommand('createLink', url);
          }}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Link"
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) execCommand('insertImage', url);
          }}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Image"
        >
          <ImageIcon size={16} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className="flex-1 p-4 text-white focus:outline-none overflow-y-auto prose prose-invert max-w-none"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}
