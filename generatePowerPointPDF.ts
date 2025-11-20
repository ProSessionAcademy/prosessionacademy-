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
  return String(text || '').replace(/[^\x20-\x7E\n]/g, '');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (testLine.length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { presentationData, slidesData, theme } = body;
    
    if (!presentationData || !slidesData) {
      return Response.json({ error: 'Missing data' }, { status: 400 });
    }
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const themes = {
      professional: rgb(0.11, 0.38, 0.87),
      vibrant: rgb(0.58, 0.2, 0.92),
      minimal: rgb(0.12, 0.16, 0.23),
      dark: rgb(0.06, 0.09, 0.16),
      nature: rgb(0.06, 0.73, 0.51),
      sunset: rgb(0.98, 0.45, 0.09)
    };
    
    const color = themes[theme?.value || 'professional'] || themes.professional;
    
    // TITLE SLIDE
    let page = pdfDoc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: color });
    
    page.drawCircle({ x: 500, y: 750, size: 130, color: rgb(1, 1, 1), opacity: 0.1 });
    page.drawCircle({ x: 80, y: 120, size: 170, color: rgb(0, 0, 0), opacity: 0.1 });
    
    const title = cleanText(presentationData?.presentation_title || 'PRESENTATION').toUpperCase();
    const titleLines = wrapText(title, 28);
    
    let titleY = 500;
    for (const line of titleLines.slice(0, 3)) {
      const textWidth = boldFont.widthOfTextAtSize(line, 36);
      page.drawText(line, { 
        x: (595 - textWidth) / 2, 
        y: titleY, 
        size: 36, 
        font: boldFont, 
        color: rgb(1, 1, 1) 
      });
      titleY -= 50;
    }
    
    if (presentationData?.subtitle) {
      const subtitle = cleanText(presentationData.subtitle);
      const subLines = wrapText(subtitle, 60);
      
      titleY -= 10;
      for (const line of subLines.slice(0, 2)) {
        const textWidth = font.widthOfTextAtSize(line, 16);
        page.drawText(line, { 
          x: (595 - textWidth) / 2, 
          y: titleY, 
          size: 16, 
          font: font, 
          color: rgb(0.95, 0.95, 0.95) 
        });
        titleY -= 26;
      }
    }
    
    page.drawText(cleanText(user.full_name || user.email), { 
      x: 60, 
      y: 100, 
      size: 13, 
      font: font, 
      color: rgb(0.95, 0.95, 0.95) 
    });
    page.drawText(new Date().toLocaleDateString(), { 
      x: 60, 
      y: 75, 
      size: 12, 
      font: font, 
      color: rgb(0.85, 0.85, 0.85) 
    });
    
    // CONTENT SLIDES
    const slides = slidesData || [];
    for (let i = 0; i < Math.min(slides.length, 25); i++) {
      const slide = slides[i];
      page = pdfDoc.addPage([595, 842]);
      
      page.drawRectangle({ x: 0, y: 790, width: 595, height: 52, color: color });
      
      const slideTitle = cleanText(slide?.title || `Slide ${i + 1}`);
      const titleText = slideTitle.substring(0, 55);
      page.drawText(titleText, { 
        x: 40, 
        y: 810, 
        size: 19, 
        font: boldFont, 
        color: rgb(1, 1, 1) 
      });
      
      let y = 720;
      
      if (slide?.content && Array.isArray(slide.content)) {
        for (const bullet of slide.content.slice(0, 8)) {
          if (y < 200) break;
          
          page.drawCircle({ x: 60, y: y - 2, size: 5, color: color });
          
          const bulletText = cleanText(bullet);
          const bulletLines = wrapText(bulletText, 65);
          
          for (const line of bulletLines.slice(0, 2)) {
            if (y < 190) break;
            page.drawText(line, { 
              x: 75, 
              y: y, 
              size: 12, 
              font: font, 
              color: rgb(0.15, 0.15, 0.15) 
            });
            y -= 18;
          }
          y -= 6;
        }
      }
      
      if (slide?.detailed_explanation && y > 240) {
        y -= 25;
        
        const boxY = y - 75;
        const boxHeight = 75;
        
        page.drawRectangle({ 
          x: 45, 
          y: boxY, 
          width: 505, 
          height: boxHeight, 
          color: rgb(0.97, 0.98, 0.99)
        });
        
        page.drawRectangle({ 
          x: 45, 
          y: boxY, 
          width: 8, 
          height: boxHeight, 
          color: color
        });
        
        page.drawText('Key Insight:', { 
          x: 60, 
          y: boxY + boxHeight - 18, 
          size: 11, 
          font: boldFont, 
          color: rgb(0.15, 0.15, 0.15) 
        });
        
        const explanation = cleanText(slide.detailed_explanation);
        const explainLines = wrapText(explanation, 70);
        
        let explainY = boxY + boxHeight - 38;
        for (const line of explainLines.slice(0, 3)) {
          page.drawText(line, { 
            x: 60, 
            y: explainY, 
            size: 10, 
            font: font, 
            color: rgb(0.3, 0.3, 0.3) 
          });
          explainY -= 14;
        }
      }
      
      page.drawRectangle({ 
        x: 0, 
        y: 0, 
        width: 595, 
        height: 35, 
        color: rgb(0.96, 0.96, 0.96) 
      });
      page.drawText(`${i + 2}`, { 
        x: 555, 
        y: 15, 
        size: 13, 
        font: font, 
        color: rgb(0.4, 0.4, 0.4) 
      });
    }
    
    // CLOSING SLIDE
    page = pdfDoc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: color });
    page.drawCircle({ x: 120, y: 720, size: 220, color: rgb(1, 1, 1), opacity: 0.08 });
    page.drawCircle({ x: 480, y: 140, size: 150, color: rgb(0, 0, 0), opacity: 0.08 });
    
    page.drawText('THANK YOU', { 
      x: 120, 
      y: 460, 
      size: 56, 
      font: boldFont, 
      color: rgb(1, 1, 1) 
    });
    page.drawText('Questions?', { 
      x: 210, 
      y: 380, 
      size: 28, 
      font: font, 
      color: rgb(0.95, 0.95, 0.95) 
    });
    
    const pdfBytes = await pdfDoc.save();
    const base64 = arrayBufferToBase64(pdfBytes);
    
    return Response.json({ 
      success: true,
      pdfBase64: base64,
      filename: 'Presentation.pdf'
    });
    
  } catch (error) {
    console.error('PDF Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});