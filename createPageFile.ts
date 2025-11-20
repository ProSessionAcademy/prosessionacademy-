import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.admin_level !== 'top_tier_admin') {
      return Response.json({ error: 'Unauthorized - Top Tier Admin only' }, { status: 403 });
    }

    const { page_name, code, title, icon_name, placement } = await req.json();

    if (!page_name || !code) {
      return Response.json({ error: 'Missing page_name or code' }, { status: 400 });
    }

    // Write the page file using Base44 SDK
    const filePath = `pages/${page_name}.js`;
    
    // Use the write_file tool through the backend
    const writeResponse = await fetch(`${Deno.env.get('BASE44_API_URL')}/apps/${Deno.env.get('BASE44_APP_ID')}/files/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization')
      },
      body: JSON.stringify({
        file_path: filePath,
        content: code
      })
    });

    if (!writeResponse.ok) {
      throw new Error('Failed to write file');
    }

    // Add to navigation if needed
    if (placement === 'navigation') {
      await base44.asServiceRole.entities.AppNavigation.create({
        title: title,
        page_name: page_name,
        icon_name: icon_name || 'FileCode',
        order: 99,
        is_active: true,
        required_role: 'all'
      });
    }

    return Response.json({ 
      success: true, 
      message: `Page ${page_name} created successfully!`,
      page_name 
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});