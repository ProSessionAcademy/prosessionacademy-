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
    const planData = body?.planData || body;
    const formData = body?.formData || {};
    
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const color = rgb(0.58, 0.2, 0.92);
    
    // Header
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: color });
    page.drawText('MARKETING PLAN', { x: 50, y: 800, size: 28, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(cleanText(formData.company_name || '').substring(0, 40), { x: 50, y: 780, size: 11, font: font, color: rgb(0.9, 0.9, 0.9) });
    
    let y = 730;
    
    // Executive Summary
    if (planData?.executive_summary) {
      page.drawText('EXECUTIVE SUMMARY', { x: 50, y: y, size: 14, font: boldFont, color: color });
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
    
    // Campaign Ideas
    if (planData?.campaign_ideas && Array.isArray(planData.campaign_ideas)) {
      if (y < 150) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      
      page.drawText('CAMPAIGN IDEAS', { x: 50, y: y, size: 14, font: boldFont, color: color });
      y -= 20;
      
      for (let i = 0; i < Math.min(planData.campaign_ideas.length, 6); i++) {
        const campaign = planData.campaign_ideas[i];
        
        if (y < 120) {
          page = pdfDoc.addPage([595, 842]);
          y = 800;
        }
        
        page.drawRectangle({ x: 45, y: y - 15, width: 505, height: 18, color: rgb(0.95, 0.95, 1), borderColor: color, borderWidth: 1 });
        page.drawText(`${i+1}. ${cleanText(campaign.campaign_name || 'Campaign').substring(0, 55)}`, { x: 50, y: y - 10, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
        y -= 25;
        
        if (campaign.description) {
          const text = cleanText(campaign.description);
          const lines = text.match(/.{1,75}/g) || [];
          for (const line of lines.slice(0, 4)) {
            if (y < 80) {
              page = pdfDoc.addPage([595, 842]);
              y = 800;
            }
            page.drawText(line, { x: 50, y: y, size: 8, font: font, color: rgb(0.2, 0.2, 0.2) });
            y -= 10;
          }
        }
        
        if (campaign.total_cost) {
          if (y < 80) {
            page = pdfDoc.addPage([595, 842]);
            y = 800;
          }
          page.drawText('💰 Cost: ' + cleanText(campaign.total_cost), { x: 50, y: y, size: 9, font: boldFont, color: rgb(0.13, 0.54, 0.13) });
          y -= 12;
        }
        
        if (campaign.roi_estimate) {
          page.drawText('📈 ROI: ' + cleanText(campaign.roi_estimate), { x: 50, y: y, size: 9, font: boldFont, color: rgb(0.13, 0.54, 0.13) });
          y -= 12;
        }
        
        y -= 20;
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    const base64 = arrayBufferToBase64(pdfBytes);
    
    return Response.json({ 
      success: true,
      pdfBase64: base64,
      filename: 'MarketingPlan.pdf'
    });
    
  } catch (error) {
    console.error('Marketing Plan Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});