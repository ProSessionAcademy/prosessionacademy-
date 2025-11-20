import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assetName, assetCost, offerAmount, persuasionText, reputation } = body;

    const prompt = `You are an AI business seller evaluating a negotiation offer for ${assetName}.

Asset Details:
- List Price: ${assetCost} Cash
- Offer Amount: ${offerAmount} Cash
- Discount Requested: ${Math.round(((assetCost - offerAmount) / assetCost) * 100)}%

Buyer Details:
- Reputation Score: ${reputation}/100
- Persuasion Message: "${persuasionText || 'No message provided'}"

Evaluate this offer and persuasion. Analyze:
1. Is the offer reasonable? (closer to list price = better)
2. Is the persuasion text convincing, professional, and sincere?
3. Does the buyer's reputation support trust?

Harsh rules:
- Offers below 70% of list price are almost always rejected unless persuasion is EXCEPTIONAL
- Empty or generic persuasion = low chance
- Threats, rudeness, or nonsense = automatic rejection
- Good persuasion mentions: partnership, loyalty, bulk future purchases, specific business reasons

Return your decision as JSON with:
{
  "accepted": true/false,
  "reason": "brief explanation of why accepted or rejected",
  "acceptance_probability": 0-100 (the calculated chance)
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          accepted: { type: "boolean" },
          reason: { type: "string" },
          acceptance_probability: { type: "number" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});