import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin (super_admin or top_tier_admin)
        if (user.admin_level !== 'super_admin' && user.admin_level !== 'top_tier_admin') {
            return Response.json({ error: 'Only Super Admins and Top Tier Admins can update users' }, { status: 403 });
        }

        const { action, userId, data } = await req.json();

        // Use service role to update user
        let result;
        
        if (action === 'promote_premium') {
            const now = new Date();
            const oneYearLater = new Date(now);
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

            result = await base44.asServiceRole.entities.User.update(userId, {
                subscription_status: 'premium',
                subscription_end_date: oneYearLater.toISOString()
            });

            // Send congratulations email
            await base44.integrations.Core.SendEmail({
                to: data.userEmail,
                from_name: "Pro-Session Team",
                subject: "🎉 Congratulations! Your Account Has Been Upgraded to Premium",
                body: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
                      <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 18px;">You're now a Premium Member</p>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.userName}! 👋</h2>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.8;">
                        We're thrilled to inform you that your Pro-Session account has been <strong style="color: #667eea;">upgraded to Premium</strong>!
                      </p>

                      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; margin: 30px 0;">
                        <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">✨ What You Now Have Access To:</h3>
                        <ul style="color: white; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                          <li>🎓 <strong>Unlimited Courses</strong> - Access all courses without limits</li>
                          <li>🏆 <strong>All Certificates</strong> - Earn certificates for every completed course</li>
                          <li>🤖 <strong>Unlimited PSA Agent</strong> - AI assistant always available</li>
                          <li>📹 <strong>Unlimited Meetings</strong> - Create and join unlimited video meetings</li>
                          <li>💬 <strong>Unlimited Posts</strong> - Share unlimited community posts</li>
                          <li>📥 <strong>Unlimited Downloads</strong> - Download all resources and materials</li>
                          <li>🎫 <strong>All Events</strong> - Attend all online and physical events</li>
                          <li>👨‍🏫 <strong>1-on-1 Mentorship</strong> - Get personal guidance from mentors</li>
                          <li>🚫 <strong>Ad-Free Experience</strong> - Enjoy a clean, distraction-free platform</li>
                        </ul>
                      </div>

                      <p style="color: #475569; font-size: 16px; line-height: 1.8;">
                        Your premium membership is valid until <strong style="color: #667eea;">${oneYearLater.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                      </p>

                      <p style="color: #667eea; font-size: 16px; font-weight: bold; margin-top: 30px;">
                        Happy Learning! 📚<br>
                        The Pro-Session Team
                      </p>
                    </div>
                  </div>
                `
            });

        } else if (action === 'demote_standard') {
            result = await base44.asServiceRole.entities.User.update(userId, {
                subscription_status: 'standard',
                subscription_end_date: null
            });

            // Send notification email
            await base44.integrations.Core.SendEmail({
                to: data.userEmail,
                from_name: "Pro-Session Team",
                subject: "Your Subscription Status Has Changed",
                body: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Update</h1>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                      <h2 style="color: #1e293b;">Hi ${data.userName},</h2>
                      
                      <p style="color: #475569; font-size: 16px; line-height: 1.8;">
                        Your Pro-Session subscription has been changed to <strong>Standard</strong>.
                      </p>

                      <p style="color: #475569; font-size: 16px; line-height: 1.8;">
                        You still have access to all free features including courses, community, and more.
                      </p>

                      <p style="color: #667eea; font-size: 16px; margin-top: 30px;">
                        Questions? Contact us anytime!<br>
                        The Pro-Session Team
                      </p>
                    </div>
                  </div>
                `
            });

        } else if (action === 'update_permission') {
            // Check if trying to promote to top_tier_admin
            if (data.newLevel === 'top_tier_admin' && user.admin_level !== 'top_tier_admin') {
                return Response.json({ 
                    error: 'Only Top Tier Admins can promote users to Top Tier Admin level' 
                }, { status: 403 });
            }

            result = await base44.asServiceRole.entities.User.update(userId, {
                admin_level: data.newLevel,
                assigned_groups: data.assignedGroups || [],
                can_access_all_groups: data.canAccessAll || false
            });

        } else {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        return Response.json({ success: true, data: result });

    } catch (error) {
        console.error('Admin user update error:', error);
        return Response.json({ 
            error: error.message || 'Failed to update user'
        }, { status: 500 });
    }
});