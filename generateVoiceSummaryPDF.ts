import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, summary, summaryType } = await req.json();

    if (!summary || !summaryType) {
      return Response.json({ error: 'Missing summary data' }, { status: 400 });
    }

    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Voice Summary', 20, y);
    y += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;

    doc.setTextColor(0, 0, 0);

    // Summary content based on type
    if (summaryType === 'general') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(summary.summary || '', 170);
      doc.text(lines, 20, y);
      y += lines.length * 7;
    } else if (summaryType === 'bullets') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Points:', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      (summary.bullets || []).forEach((bullet) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const lines = doc.splitTextToSize(`• ${bullet}`, 165);
        doc.text(lines, 25, y);
        y += lines.length * 7 + 3;
      });
    } else if (summaryType === 'complete') {
      // Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(summary.summary || '', 170);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 7 + 10;

      // Key Points
      if (summary.key_points?.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Points:', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        summary.key_points.forEach((point) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`• ${point}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 7 + 3;
        });
        y += 10;
      }

      // Important Highlights
      if (summary.important_highlights?.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Important Highlights:', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        summary.important_highlights.forEach((highlight) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`⭐ ${highlight}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 7 + 3;
        });
        y += 10;
      }

      // Mind Map
      if (summary.mind_map) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Mind Map:', 20, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(summary.mind_map.main_topic || '', 25, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        (summary.mind_map.subtopics || []).forEach((subtopic) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text(`  ${subtopic.title}`, 30, y);
          y += 7;

          doc.setFont('helvetica', 'normal');
          (subtopic.points || []).forEach((point) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const lines = doc.splitTextToSize(`    → ${point}`, 160);
            doc.text(lines, 35, y);
            y += lines.length * 6 + 2;
          });
          y += 5;
        });
      }

      // Action Items
      if (summary.action_items?.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Action Items:', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        summary.action_items.forEach((item, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`${idx + 1}. ${item}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 7 + 3;
        });
      }
    }

    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return Response.json({
      success: true,
      pdfBase64,
      filename: `Voice-Summary-${new Date().toISOString().split('T')[0]}.pdf`
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});