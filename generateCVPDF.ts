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

    const { cvData, template } = await req.json();
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const templates = {
      modern: { primary: rgb(0.15, 0.39, 0.93), accent: rgb(0.04, 0.71, 0.84), light: rgb(0.53, 0.81, 0.98) },
      elegant: { primary: rgb(0.58, 0.2, 0.92), accent: rgb(0.93, 0.28, 0.6), light: rgb(0.8, 0.47, 0.98) },
      professional: { primary: rgb(0.12, 0.16, 0.23), accent: rgb(0.28, 0.34, 0.42), light: rgb(0.39, 0.45, 0.53) },
      creative: { primary: rgb(0.98, 0.45, 0.09), accent: rgb(0.94, 0.27, 0.27), light: rgb(0.99, 0.55, 0.38) },
      minimal: { primary: rgb(0.06, 0.73, 0.51), accent: rgb(0.08, 0.72, 0.65), light: rgb(0.02, 0.59, 0.41) },
      tech: { primary: rgb(0.31, 0.27, 0.9), accent: rgb(0.49, 0.23, 0.93), light: rgb(0.39, 0.4, 0.95) }
    };
    
    const colors = templates[template] || templates.modern;
    
    page.drawRectangle({ x: 0, y: 0, width: 200, height: 842, color: colors.primary });
    page.drawCircle({ x: 200, y: 842, size: 120, color: rgb(1, 1, 1), opacity: 0.06 });
    page.drawCircle({ x: 0, y: 0, size: 90, color: rgb(0, 0, 0), opacity: 0.12 });
    
    page.drawCircle({ x: 100, y: 745, size: 57, color: colors.accent });
    
    const fullName = cleanText(cvData?.personal?.fullName || 'YOUR NAME').toUpperCase();
    const nameLines = fullName.substring(0, 40).match(/.{1,18}/g) || [fullName];
    let nameY = 635;
    for (const line of nameLines.slice(0, 2)) {
      const lineWidth = line.length * 5.2;
      page.drawText(line, { x: 100 - lineWidth, y: nameY, size: 19, font: boldFont, color: rgb(1, 1, 1) });
      nameY -= 24;
    }
    
    const title = cleanText(cvData?.personal?.title || '').toUpperCase();
    const titleLines = title.substring(0, 45).match(/.{1,20}/g) || [title];
    nameY -= 8;
    for (const line of titleLines.slice(0, 2)) {
      const lineWidth = line.length * 3.8;
      page.drawText(line, { x: 100 - lineWidth, y: nameY, size: 13, font: font, color: colors.light });
      nameY -= 18;
    }
    
    page.drawRectangle({ x: 15, y: 560, width: 170, height: 2.5, color: colors.accent });
    page.drawText('CONTACT', { x: 20, y: 578, size: 15, font: boldFont, color: colors.accent });
    
    let contactY = 555;
    
    const contacts = [
      { text: cvData?.personal?.email },
      { text: cvData?.personal?.phone },
      { text: cvData?.personal?.location },
      { text: cvData?.personal?.website },
      { text: cvData?.personal?.linkedin }
    ];
    
    for (const contact of contacts) {
      if (contact.text) {
        const text = cleanText(contact.text).substring(0, 42);
        const textLines = text.match(/.{1,20}/g) || [text];
        let lineY = contactY;
        for (const line of textLines.slice(0, 2)) {
          page.drawText(line, { x: 25, y: lineY, size: 8, font: font, color: rgb(0.96, 0.96, 0.96) });
          lineY -= 11;
        }
        contactY = lineY - 8;
      }
    }
    
    if (cvData?.skills?.length > 0) {
      page.drawRectangle({ x: 15, y: contactY - 25, width: 170, height: 2.5, color: colors.accent });
      page.drawText('SKILLS', { x: 20, y: contactY - 10, size: 15, font: boldFont, color: colors.accent });
      
      let skillY = contactY - 30;
      const skills = cvData.skills || [];
      for (const skill of skills.slice(0, 14)) {
        if (skill?.name && skillY > 50) {
          const skillName = cleanText(skill.name).substring(0, 24);
          page.drawText(skillName, { x: 20, y: skillY, size: 9, font: font, color: rgb(0.96, 0.96, 0.96) });
          skillY -= 13;
          
          const barWidth = skill.level === 'advanced' ? 160 : skill.level === 'intermediate' ? 110 : 70;
          page.drawRectangle({ x: 20, y: skillY - 3, width: 165, height: 7, color: rgb(0.25, 0.25, 0.25) });
          page.drawRectangle({ x: 20, y: skillY - 3, width: barWidth, height: 7, color: colors.light });
          skillY -= 20;
        }
      }
      contactY = skillY;
    }
    
    if (cvData?.languages?.length > 0 && contactY > 120) {
      page.drawRectangle({ x: 15, y: contactY - 20, width: 170, height: 2.5, color: colors.accent });
      page.drawText('LANGUAGES', { x: 20, y: contactY - 5, size: 15, font: boldFont, color: colors.accent });
      
      contactY -= 25;
      const langs = cvData.languages || [];
      for (const lang of langs.slice(0, 7)) {
        if (lang?.name && contactY > 35) {
          page.drawCircle({ x: 25, y: contactY - 2, size: 2.5, color: colors.light });
          const langText = `${cleanText(lang.name)} - ${String(lang.level).toUpperCase()}`;
          page.drawText(langText.substring(0, 24), { x: 32, y: contactY, size: 8, font: font, color: rgb(0.96, 0.96, 0.96) });
          contactY -= 15;
        }
      }
    }
    
    const rightX = 220;
    let rightY = 805;
    
    page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 375, height: 38, color: colors.primary, opacity: 0.13 });
    page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 7, height: 38, color: colors.primary });
    page.drawText('PROFESSIONAL SUMMARY', { x: rightX + 8, y: rightY, size: 16, font: boldFont, color: colors.primary });
    
    rightY -= 35;
    if (cvData?.personal?.summary) {
      const summary = cleanText(cvData.personal.summary);
      const lines = summary.match(/.{1,64}/g) || [];
      for (const line of lines.slice(0, 7)) {
        page.drawText(line, { x: rightX + 8, y: rightY, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
        rightY -= 14;
      }
    }
    
    rightY -= 30;
    
    page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 375, height: 38, color: colors.primary, opacity: 0.13 });
    page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 7, height: 38, color: colors.primary });
    page.drawText('WORK EXPERIENCE', { x: rightX + 8, y: rightY, size: 16, font: boldFont, color: colors.primary });
    
    rightY -= 36;
    const experience = cvData?.experience || [];
    for (const exp of experience.slice(0, 4)) {
      if (exp?.title) {
        page.drawCircle({ x: rightX + 16, y: rightY - 3, size: 6, color: colors.primary });
        page.drawRectangle({ x: rightX + 16, y: 50, width: 1.5, height: rightY - 53, color: colors.accent, opacity: 0.35 });
        
        page.drawText(cleanText(exp.title).substring(0, 54).toUpperCase(), {
          x: rightX + 30, y: rightY, size: 13, font: boldFont, color: rgb(0.08, 0.08, 0.08)
        });
        rightY -= 16;
        
        if (exp?.company) {
          page.drawText(cleanText(exp.company).substring(0, 58), {
            x: rightX + 30, y: rightY, size: 11, font: font, color: rgb(0.25, 0.25, 0.25)
          });
          rightY -= 13;
        }
        
        const dates = `${exp.startDate || 'Start'} - ${exp.current ? 'Present' : exp.endDate || 'End'}`;
        page.drawText(dates, {
          x: rightX + 30, y: rightY, size: 9, font: font, color: rgb(0.48, 0.48, 0.48)
        });
        rightY -= 15;
        
        if (exp?.description) {
          const desc = cleanText(exp.description);
          const descLines = desc.match(/.{1,62}/g) || [];
          for (const line of descLines.slice(0, 5)) {
            if (rightY < 75) break;
            page.drawText(line, {
              x: rightX + 30, y: rightY, size: 9, font: font, color: rgb(0.38, 0.38, 0.38)
            });
            rightY -= 12;
          }
        }
        rightY -= 20;
        
        if (rightY < 160) break;
      }
    }
    
    if (rightY > 200 && cvData?.education?.length > 0) {
      page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 375, height: 38, color: colors.primary, opacity: 0.13 });
      page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 7, height: 38, color: colors.primary });
      page.drawText('EDUCATION', { x: rightX + 8, y: rightY, size: 16, font: boldFont, color: colors.primary });
      
      rightY -= 36;
      const education = cvData.education || [];
      for (const edu of education.slice(0, 3)) {
        if (edu?.degree && rightY > 110) {
          page.drawCircle({ x: rightX + 16, y: rightY - 3, size: 6, color: colors.primary });
          
          page.drawText(cleanText(edu.degree).substring(0, 54), {
            x: rightX + 30, y: rightY, size: 12, font: boldFont, color: rgb(0.08, 0.08, 0.08)
          });
          rightY -= 15;
          
          if (edu?.institution) {
            page.drawText(cleanText(edu.institution).substring(0, 58), {
              x: rightX + 30, y: rightY, size: 10, font: font, color: rgb(0.28, 0.28, 0.28)
            });
            rightY -= 12;
          }
          
          if (edu?.year) {
            const yearText = `${cleanText(edu.year)}${edu?.gpa ? ` - GPA: ${cleanText(edu.gpa)}` : ''}`;
            page.drawText(yearText.substring(0, 50), {
              x: rightX + 30, y: rightY, size: 9, font: font, color: rgb(0.48, 0.48, 0.48)
            });
            rightY -= 12;
          }
          
          if (edu?.description) {
            const desc = cleanText(edu.description);
            const descLines = desc.match(/.{1,60}/g) || [];
            for (const line of descLines.slice(0, 2)) {
              if (rightY < 90) break;
              page.drawText(line, {
                x: rightX + 30, y: rightY, size: 8, font: font, color: rgb(0.4, 0.4, 0.4)
              });
              rightY -= 11;
            }
          }
          rightY -= 16;
        }
      }
    }
    
    if (rightY > 170 && cvData?.certifications?.length > 0) {
      page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 375, height: 38, color: colors.primary, opacity: 0.13 });
      page.drawRectangle({ x: rightX - 10, y: rightY - 14, width: 7, height: 38, color: colors.primary });
      page.drawText('CERTIFICATIONS', { x: rightX + 8, y: rightY, size: 16, font: boldFont, color: colors.primary });
      
      rightY -= 34;
      const certs = cvData.certifications || [];
      for (const cert of certs.slice(0, 6)) {
        if (cert?.name && rightY > 75) {
          page.drawCircle({ x: rightX + 16, y: rightY - 2, size: 3, color: colors.accent });
          page.drawText(cleanText(cert.name).substring(0, 50), {
            x: rightX + 30, y: rightY, size: 10, font: font, color: rgb(0.18, 0.18, 0.18)
          });
          rightY -= 13;
          
          if (cert?.issuer) {
            page.drawText(cleanText(cert.issuer).substring(0, 52), {
              x: rightX + 30, y: rightY, size: 8, font: font, color: rgb(0.48, 0.48, 0.48)
            });
            rightY -= 11;
          }
          
          if (cert?.date) {
            page.drawText(cleanText(cert.date).substring(0, 30), {
              x: rightX + 30, y: rightY, size: 7, font: font, color: rgb(0.58, 0.58, 0.58)
            });
            rightY -= 15;
          }
        }
      }
    }
    
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 28, color: colors.accent });
    page.drawText('Generated via Pro-Session CV Generator Pro', { 
      x: 28, y: 11, size: 9, font: font, color: rgb(1, 1, 1) 
    });
    page.drawText(new Date().toLocaleDateString(), { 
      x: 495, y: 11, size: 9, font: font, color: rgb(1, 1, 1) 
    });
    
    const pdfBytes = await pdfDoc.save();
    const base64 = arrayBufferToBase64(pdfBytes);
    
    return Response.json({ 
      success: true,
      pdfBase64: base64,
      filename: `CV_${cleanText(cvData?.personal?.fullName || 'Resume').replace(/\s+/g, '_')}.pdf`
    });
    
  } catch (error) {
    console.error('CV Error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});