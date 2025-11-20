import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function cleanText(text) {
  return String(text || '').replace(/[^\x20-\x7E]/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const planData = body?.planData || body.generatedPlan || {};
    const formData = body?.formData || {};
    
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const primaryColor = rgb(0.11, 0.38, 0.87);
    
    // Header
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: primaryColor });
    page.drawText('BUSINESS PLAN', { x: 50, y: 800, size: 28, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(new Date().toLocaleDateString(), { x: 50, y: 780, size: 10, font: font, color: rgb(0.9, 0.9, 0.9) });
    
    let y = 730;
    
    // Executive Summary
    if (planData?.executive_summary) {
      page.drawText('EXECUTIVE SUMMARY', { x: 50, y: y, size: 14, font: boldFont, color: primaryColor });
      y -= 20;
      
      const text = cleanText(planData.executive_summary);
      const lines = text.match(/.{1,80}/g) || [];
      for (const line of lines.slice(0, 8)) {
        if (y < 80) {
          page = pdfDoc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(line, { x: 50, y: y, size: 9, font: font, color: rgb(0.2, 0.2, 0.2) });
        y -= 12;
      }
      y -= 20;
    }
    
    // SWOT Analysis
    if (planData?.swot) {
      if (y < 150) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      
      page.drawText('SWOT ANALYSIS', { x: 50, y: y, size: 14, font: boldFont, color: primaryColor });
      y -= 20;
      
      const swotSections = [
        { key: 'strengths', label: 'Strengths', color: rgb(0.06, 0.73, 0.51) },
        { key: 'weaknesses', label: 'Weaknesses', color: rgb(0.92, 0.34, 0.29) },
        { key: 'opportunities', label: 'Opportunities', color: rgb(0.13, 0.54, 0.96) },
        { key: 'threats', label: 'Threats', color: rgb(0.95, 0.61, 0.07) }
      ];
      
      for (const section of swotSections) {
        if (planData.swot[section.key]?.length > 0) {
          if (y < 100) {
            page = pdfDoc.addPage([595, 842]);
            y = 800;
          }
          
          page.drawText(section.label.toUpperCase(), { x: 50, y: y, size: 11, font: boldFont, color: section.color });
          y -= 15;
          
          for (const item of planData.swot[section.key].slice(0, 3)) {
            if (y < 80) {
              page = pdfDoc.addPage([595, 842]);
              y = 800;
            }
            page.drawCircle({ x: 58, y: y - 3, size: 2, color: section.color });
            const itemText = cleanText(item).substring(0, 75);
            page.drawText(itemText, { x: 70, y: y, size: 8, font: font, color: rgb(0.2, 0.2, 0.2) });
            y -= 12;
          }
          y -= 10;
        }
      }
      y -= 15;
    }
    
    const pdfBytes = await pdfDoc.save();
    const base64 = arrayBufferToBase64(pdfBytes);
    
    return Response.json({ 
      success: true,
      pdfBase64: base64,
      filename: 'BusinessPlan.pdf'
    });
    
  } catch (error) {
    console.error('Business Plan Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});