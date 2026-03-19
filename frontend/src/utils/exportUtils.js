import html2pdf from 'html2pdf.js';

const getSafeFileName = (title = 'Untitled note') => {
    const normalized = title.trim() || 'Untitled note';
    return normalized.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Exports a note to a PDF file.
 * @param {string} title - The title of the note.
 * @param {string} htmlContent - The HTML content of the note (from TipTap).
 */
export const exportNoteToPDF = (title, htmlContent) => {
    const element = document.createElement('div');

    // Create a styled container for the PDF content
    element.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica', 'Arial', sans-serif; color: #0f172a;">
            <style>
                h1 { font-size: 32px; font-weight: bold; margin-bottom: 24px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; page-break-after: avoid; }
                h2 { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1e293b; page-break-after: avoid; }
                p { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 12px; page-break-inside: avoid; }
                ul, ol { margin-bottom: 16px; padding-left: 24px; page-break-inside: avoid; }
                li { margin-bottom: 8px; font-size: 16px; color: #334155; }
                blockquote { border-left: 4px solid #e2e8f0; padding-left: 16px; font-style: italic; color: #64748b; margin: 16px 0; page-break-inside: avoid; }
                code { background-color: #f1f5f9; color: #db2777; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 14px; }
                pre { background-color: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px; margin: 16px 0; overflow: hidden; page-break-inside: avoid; }
                pre code { background-color: transparent; color: inherit; padding: 0; border-radius: 0; }
            </style>
            <h1>${title || 'Untitled Note'}</h1>
            <div class="content">
                ${htmlContent}
            </div>
        </div>
    `;

    // PDF Configuration
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${getSafeFileName(title)}_note.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    // New Promise-based usage:
    html2pdf().set(opt).from(element).save();
};

export const downloadNoteAsHtml = (title, htmlContent) => {
    const safeFileName = getSafeFileName(title);
    const blob = new Blob([
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || 'Untitled Note'}</title>
</head>
<body>
  ${htmlContent}
</body>
</html>`,
    ], { type: 'text/html;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.html`;
    link.click();
    URL.revokeObjectURL(url);
};

export const printNoteContent = (title, htmlContent) => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');

    if (!printWindow) {
        return false;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${title || 'Untitled Note'}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #0f172a;
                margin: 40px;
                line-height: 1.7;
              }
              h1, h2, h3 {
                color: #0f172a;
                page-break-after: avoid;
              }
              h1 {
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 12px;
                margin-bottom: 24px;
              }
              blockquote {
                border-left: 4px solid #cbd5e1;
                margin: 16px 0;
                padding-left: 16px;
                color: #475569;
              }
              pre {
                background: #0f172a;
                color: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                overflow: auto;
              }
              code {
                font-family: "Courier New", monospace;
              }
            </style>
          </head>
          <body>
            <h1>${title || 'Untitled Note'}</h1>
            ${htmlContent}
          </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return true;
};
