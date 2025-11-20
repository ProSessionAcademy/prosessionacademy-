import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    
    const leaderboard = users.map(u => {
      const xp = u.xp_points || 0;
      const cash = u.game_stats?.cash || 0;
      
      const assetsValue = (u.game_stats?.assets || []).reduce((sum, asset) => {
        return sum + (asset.cost || 0);
      }, 0);
      
      const investmentsValue = Object.values(u.game_stats?.investments || {}).reduce((sum, inv) => {
        return sum + inv.amount;
      }, 0);
      
      const projectsValue = (u.game_stats?.active_projects || []).reduce((sum, project) => {
        return sum + (project.total_cost || 0);
      }, 0);

      const sharesValue = Object.values(u.game_stats?.owned_shares || {}).reduce((sum, share) => {
        return sum + (share.value || 0);
      }, 0);
      
      const loansTotal = (u.game_stats?.loans || []).reduce((sum, loan) => {
        return sum + loan.amount * (1 + loan.interest);
      }, 0);
      
      const netWorth = Math.round(xp + cash + assetsValue + investmentsValue + projectsValue + sharesValue - loansTotal);
      
      return {
        username: u.full_name || u.email,
        email: u.email,
        xp_points: xp,
        net_worth: netWorth,
        rank: u.game_stats?.player_rank || "Junior Tycoon"
      };
    }).sort((a, b) => b.net_worth - a.net_worth);
    
    return Response.json({ leaderboard });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});