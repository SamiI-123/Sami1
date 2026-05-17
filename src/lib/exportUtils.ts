import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Add type definition for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        // Handle strings with commas
        return typeof val === 'string' && val.includes(',') 
          ? `"${val.replace(/"/g, '""')}"` 
          : val;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (
  title: string, 
  headers: string[], 
  data: any[][], 
  filename: string,
  extraContent?: { label: string, value: string }[]
) => {
  const doc = new jsPDF();

  // Add Branding
  doc.setFontSize(22);
  doc.setTextColor(74, 103, 65); // primary-green
  doc.text('AGRINOVIA', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Advanced Digital Agriculture Solutions', 14, 25);

  // Add Title
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text(title, 14, 40);

  // Add Date
  doc.setFontSize(10);
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 47);

  // Add Extra Content if provided
  if (extraContent && extraContent.length > 0) {
    let yPos = 55;
    extraContent.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 40, yPos);
      yPos += 7;
    });
  }

  // Add Table
  doc.autoTable({
    startY: extraContent ? 75 : 55,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [74, 103, 65] },
    alternateRowStyles: { fillColor: [249, 248, 246] },
    margin: { top: 30 },
  });

  doc.save(`${filename}.pdf`);
};

export const exportReportToPDF = (report: string, filename: string, title = 'Diagnostic Report') => {
  const doc = new jsPDF();
  
  // Custom styling for report
  doc.setFontSize(22);
  doc.setTextColor(74, 103, 65); // primary-green
  doc.text('AGRINOVIA', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(title, 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  // Parse markdown-ish headings for simple styling if possible
  // For now, just split and render
  const splitText = doc.splitTextToSize(report.replace(/#/g, ''), 180);
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  doc.text(splitText, 14, 45);

  doc.save(`${filename}.pdf`);
};

export const exportHistoryToPDF = (history: any[], filename: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(74, 103, 65);
  doc.text('AGRINOVIA', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text('Diagnostic History Log', 14, 30);

  const tableData = history.map(h => {
    // Try to split findings into Diagnosis and Recommendations
    const text = h.findings || '';
    const recIndex = text.toLowerCase().indexOf('recommend');
    const actIndex = text.toLowerCase().indexOf('action');
    const splitIndex = recIndex !== -1 ? recIndex : (actIndex !== -1 ? actIndex : -1);

    let diagnosis = text;
    let recommendations = 'Included in details';

    if (splitIndex !== -1) {
      diagnosis = text.substring(0, splitIndex).trim();
      recommendations = text.substring(splitIndex).trim();
    }

    return [
      h.createdAt?.toDate ? h.createdAt.toDate().toLocaleString() : 'N/A',
      diagnosis.substring(0, 150).replace(/#/g, '') + (diagnosis.length > 150 ? '...' : ''),
      recommendations.substring(0, 150).replace(/#/g, '') + (recommendations.length > 150 ? '...' : ''),
      h.status || 'Completed'
    ];
  });

  doc.autoTable({
    startY: 40,
    head: [['Date', 'Diagnosis Detail', 'Recommendations', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [74, 103, 65] },
    columnStyles: {
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    styles: { fontSize: 8 }
  });

  doc.save(`${filename}.pdf`);
};
