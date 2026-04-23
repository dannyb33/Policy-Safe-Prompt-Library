import { Router } from 'express'
import { getDefaultPolicyRules } from '../../modules/policies/defaultPolicies.js';
import { checkPolicies } from '../../modules/policies/policyChecker.js';
import { loadMongoPolicyRules } from '../../modules/policies/mongoPolicyRules.js';
import type { PolicyCheckInput } from '../../core/types.js';

const policyRouter = Router();

policyRouter.post("/check", async (req, res) => {
  try {
    const prompt = req.body as PolicyCheckInput;

    let rules = getDefaultPolicyRules();
    let rulesSource = "local defaults";
    try {
      const mongoRules = await loadMongoPolicyRules();
      if (mongoRules.length > 0) {
        rules = mongoRules;
        rulesSource = `MongoDB (${mongoRules.length} rules)`;
      }
    } catch (e: any) {
      console.warn("[policy-check] MongoDB rules unavailable, using local defaults:", e.message);
    }
    console.log(`[policy-check] Rules source: ${rulesSource}`);

    const summary = checkPolicies(prompt.prompt, rules);

    return res.status(summary.passed ? 200 : 400).json(summary);

  } catch (e: any) {
    return res.status(500).json({
      error: e.message || "Policy check failed"
    });
  }
});

export default policyRouter;