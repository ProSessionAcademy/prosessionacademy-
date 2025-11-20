import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== MINIMAL TEST: Creating simplest possible PowerPoint ===');

    // Create the absolute simplest PowerPoint possible
    const pptx = new PptxGenJS();
    
    // Add ONE slide with ONE text element
    const slide = pptx.addSlide();
    slide.addText('Hello World', {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 48,
      color: '000000'
    });

    console.log('Slide added. Generating file...');

    // Try different output methods
    let fileData;
    try {
      // Method 1: Try arraybuffer
      fileData = await pptx.write({ outputType: 'arraybuffer' });
      console.log('Generated with arraybuffer:', fileData.byteLength, 'bytes');
    } catch (e1) {
      console.error('arraybuffer failed:', e1.message);
      try {
        // Method 2: Try nodebuffer
        fileData = await pptx.write({ outputType: 'nodebuffer' });
        console.log('Generated with nodebuffer:', fileData.length || fileData.byteLength, 'bytes');
      } catch (e2) {
        console.error('nodebuffer failed:', e2.message);
        // Method 3: Try base64
        const base64Data = await pptx.write({ outputType: 'base64' });
        console.log('Generated with base64:', base64Data.length, 'chars');
        // Convert base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileData = bytes;
        console.log('Converted to bytes:', fileData.byteLength, 'bytes');
      }
    }

    // Ensure we have Uint8Array
    const uint8Data = fileData instanceof Uint8Array 
      ? fileData 
      : new Uint8Array(fileData);

    console.log('Final size:', uint8Data.byteLength, 'bytes');
    console.log('First 20 bytes:', Array.from(uint8Data.slice(0, 20)));

    if (uint8Data.byteLength < 1000) {
      throw new Error(`File too small: ${uint8Data.byteLength} bytes`);
    }

    return new Response(uint8Data, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="MINIMAL_TEST.pptx"',
        'Content-Length': String(uint8Data.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return Response.json({ 
      error: 'Minimal test failed',
      type: error.constructor.name,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});