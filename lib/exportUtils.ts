import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Note } from './types';

export async function exportToPDF(notes: Note[], folderName: string) {
  const doc = new jsPDF();
  let y = 20;
  
  doc.setFontSize(20);
  doc.text(`Folder: ${folderName}`, 20, y);
  y += 15;
  
  doc.setFontSize(12);
  
  for (const note of notes) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    // Strip HTML tags for simple text export
    const textContent = note.content.replace(/<[^>]*>?/gm, '');
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Note ID: ${note.id}`, 20, y);
    y += 7;
    
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(textContent, 170);
    doc.text(lines, 20, y);
    y += (lines.length * 7) + 10;
  }
  
  doc.save(`${folderName}_notes.pdf`);
}

export function exportToMarkdown(notes: Note[], folderName: string) {
  let md = `# Folder: ${folderName}\n\n`;
  
  notes.forEach(note => {
    const textContent = note.content.replace(/<[^>]*>?/gm, '');
    md += `## Note (${note.id})\n\n`;
    md += `${textContent}\n\n`;
    if (note.summary) {
      md += `**Summary:** ${note.summary}\n\n`;
    }
    if (note.tasks && note.tasks.length > 0) {
      md += `**Tasks:**\n`;
      note.tasks.forEach(t => {
        md += `- [${t.status === 'completed' ? 'x' : ' '}] ${t.title}\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });
  
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_notes.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPlainText(notes: Note[], folderName: string) {
  let txt = `Folder: ${folderName}\n\n`;
  
  notes.forEach(note => {
    const textContent = note.content.replace(/<[^>]*>?/gm, '');
    txt += `--- Note ---\n`;
    txt += `${textContent}\n\n`;
    if (note.summary) {
      txt += `Summary: ${note.summary}\n\n`;
    }
    if (note.tasks && note.tasks.length > 0) {
      txt += `Tasks:\n`;
      note.tasks.forEach(t => {
        txt += `[${t.status === 'completed' ? 'x' : ' '}] ${t.title}\n`;
      });
      txt += `\n`;
    }
  });
  
  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_notes.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
