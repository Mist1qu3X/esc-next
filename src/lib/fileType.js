// Иконка/цвет/подпись по типу файла (PDF, Word, Excel, ZIP, …) — как на офиц. сайте.
export function fileTypeMeta(file, fallbackName = '') {
  const ext =
    ((file?.ext || '').replace('.', '').toLowerCase()) ||
    ((file?.name || fallbackName || '').split('.').pop() || '').toLowerCase();
  const map = {
    pdf: { icon: 'fa-file-pdf', color: '#e2574c', label: 'PDF' },
    doc: { icon: 'fa-file-word', color: '#2b7cd3', label: 'DOC' },
    docx: { icon: 'fa-file-word', color: '#2b7cd3', label: 'DOC' },
    xls: { icon: 'fa-file-excel', color: '#1f9e5e', label: 'XLS' },
    xlsx: { icon: 'fa-file-excel', color: '#1f9e5e', label: 'XLS' },
    csv: { icon: 'fa-file-excel', color: '#1f9e5e', label: 'CSV' },
    ppt: { icon: 'fa-file-powerpoint', color: '#d24726', label: 'PPT' },
    pptx: { icon: 'fa-file-powerpoint', color: '#d24726', label: 'PPT' },
    zip: { icon: 'fa-file-zipper', color: '#e0a23b', label: 'ZIP' },
    rar: { icon: 'fa-file-zipper', color: '#e0a23b', label: 'RAR' },
    '7z': { icon: 'fa-file-zipper', color: '#e0a23b', label: '7Z' },
    txt: { icon: 'fa-file-lines', color: '#9aa7b4', label: 'TXT' },
  };
  return map[ext] || { icon: 'fa-file', color: '#9aa7b4', label: (ext || 'FILE').toUpperCase().slice(0, 4) };
}
