import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
  try {
    console.log('Starting minimal PDF test...');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('Creating PDF document...');
    const pdfDoc = await PDFDocument.create();
    
    console.log('Adding page...');
    const page = pdfDoc.addPage([595, 842]);
    
    console.log('Embedding font...');
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    console.log('Drawing text...');
    page.drawText('HELLO WORLD', { x: 100, y: 400, size: 30, font: font, color: rgb(0, 0, 0) });
    
    console.log('Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    
    console.log('PDF saved, size:', pdfBytes.length, 'bytes');
    
    console.log('Converting to Base64...');
    const bytes = new Uint8Array(pdfBytes);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    console.log('Base64 length:', base64.length);
    console.log('First 50 chars:', base64.substring(0, 50));
    
    return Response.json({ 
      success: true,
      pdfBase64: base64,
      filename: 'test.pdf',
      size: pdfBytes.length
    });
    
  } catch (error) {
    console.error('ERROR:', error);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});