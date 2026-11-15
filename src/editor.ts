import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

const ShiftEnterNewBlock = Extension.create({
  name: 'shiftEnterNewBlock',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () => this.editor.commands.enter()
    };
  }
});

export interface EditorCallbacks {
  onUpdate: (markdown: string) => void;
  onSelectionChange: (line: number, col: number, words: number, chars: number) => void;
}

export function createMarkdownEditor(
  element: HTMLElement,
  initialContent: string,
  callbacks: EditorCallbacks
): Editor {
  const editor = new Editor({
    element,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        hardBreak: false,
        heading: {
          levels: [1, 2, 3, 4]
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'md-code-block'
          }
        }
      }),
      ShiftEnterNewBlock,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'md-link'
        }
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever em Markdown... (# título, **negrito**, - [ ] tarefa)'
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: true
      })
    ],
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'true'
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement | null;
        const linkEl = target?.closest('a');
        if (linkEl && (event.ctrlKey || event.metaKey)) {
          const href = linkEl.getAttribute('href');
          if (href) {
            event.preventDefault();
            window.markNotaAPI.openExternal(href);
            return true;
          }
        }
        return false;
      }
    },
    onUpdate({ editor: ed }) {
      const md = getEditorMarkdown(ed);
      callbacks.onUpdate(md);
      emitStats(ed, callbacks);
    },
    onSelectionUpdate({ editor: ed }) {
      emitStats(ed, callbacks);
    },
    onCreate({ editor: ed }) {
      emitStats(ed, callbacks);
    }
  });

  return editor;
}

export function getEditorMarkdown(editor: Editor): string {
  const storage = editor.storage as { markdown?: { getMarkdown: () => string } };
  return storage.markdown ? storage.markdown.getMarkdown() : editor.getText();
}

function emitStats(editor: Editor, callbacks: EditorCallbacks): void {
  const { state } = editor;
  const pos = state.selection.from;
  const textBefore = state.doc.textBetween(0, pos, '\n', '\n');
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;

  const fullText = state.doc.textBetween(0, state.doc.content.size, '\n', '\n');
  const trimmed = fullText.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = fullText.length;

  callbacks.onSelectionChange(line, col, words, chars);
}
