import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
  try {
    console.log('🔍 TEST: Creating PDF...');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('HELLO WORLD!', {
      x: 50,
      y: 700,
      size: 30,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    const pdfBytes = await pdfDoc.save();
    console.log('✅ PDF bytes length:', pdfBytes.length);
    
    // Convert Uint8Array to ArrayBuffer explicitly
    const arrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    
    console.log('✅ ArrayBuffer created, byteLength:', arrayBuffer.byteLength);
    
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(arrayBuffer.byteLength),
        'Content-Disposition': 'inline; filename="test.pdf"',
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});