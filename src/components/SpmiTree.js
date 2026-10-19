import React from 'react';
import { routeSpmi } from '../spmiModel';
function cocok(node, query) { return node.label.toLowerCase().includes(query) || node.children.some((n) => cocok(n, query)); }
function Node({ node, aktif, query, pilih, depth }) {
  if (query && !cocok(node, query)) return null;
  const selected = node.key === aktif;
  const ownMatch = query && node.label.toLowerCase().includes(query);
  const content = <button className={'spmi-tree-select' + (selected ? ' selected' : '')} aria-current={selected ? 'page' : undefined} onClick={() => pilih(routeSpmi(node.key))}>{node.label}</button>;
  if (!node.children.length) return <div className={'spmi-tree-leaf depth-' + depth}>{content}</div>;
  return <details className={'spmi-tree-node depth-' + depth} open={query || selected || aktif.startsWith(node.key.slice(0, -1) + ',') ? true : undefined}>
    <summary aria-label={'Buka/tutup ' + node.label}><span className="spmi-tree-chevron">›</span><span>{node.label}</span></summary>
    <div className="spmi-tree-children">{content}{node.children.map((n) => <Node key={n.key} node={n} aktif={aktif} query={ownMatch ? '' : query} pilih={pilih} depth={depth + 1} />)}</div>
  </details>;
}
export default function SpmiTree({ tree, aktif, query, pilih }) {
  const q = query.trim().toLowerCase();
  return <div className="spmi-tree">
    <button className={'spmi-tree-select' + (aktif === 'all' ? ' selected' : '')} onClick={() => pilih('modul-naskah')}>Semua bagian</button>
    {tree.root.children.map((n) => <Node key={n.key} node={n} aktif={aktif} query={q} pilih={pilih} depth={0} />)}
    {q && !tree.root.children.some((n) => cocok(n, q)) && <p className="section-empty">Tidak ada BAB atau bagian yang cocok.</p>}
  </div>;
}
