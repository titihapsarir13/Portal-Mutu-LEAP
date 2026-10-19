import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prepareNaskahText } from '../spmiTextUtils';

function remarkSafeBreaks() {
  return (tree) => {
    function walk(node) { if (!node.children) return; node.children = node.children.map((child) => {
      if (child.type === 'html' && /^<br\s*\/?\s*>$/i.test(child.value)) return { type: 'break' };
      walk(child); return child;
    }); }
    walk(tree);
  };
}

// Raw HTML is never evaluated. Existing plain text and Markdown use the same reader.
export default function SpmiText({ value, empty }) {
  if (!value) return <div className="spmi-prose"><span className="spmi-empty">{empty || '—'}</span></div>;
  const prepared = prepareNaskahText(value);
  return <div className="spmi-prose spmi-formatted"><ReactMarkdown remarkPlugins={[remarkGfm, remarkSafeBreaks]} components={{
    ol: ({ node, children, start }) => { const style = prepared.types[node.position && node.position.start.line] || {}; return <ol type={style.type} start={style.start || start}>{children}</ol>; },
    a: ({ node, children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>,
    img: ({ alt }) => <span>[Gambar: {alt || 'lihat Google Docs'}]</span>,
    table: ({ node, ...props }) => <div className="spmi-inner-table"><table {...props} /></div>,
  }}>{prepared.text}</ReactMarkdown></div>;
}
