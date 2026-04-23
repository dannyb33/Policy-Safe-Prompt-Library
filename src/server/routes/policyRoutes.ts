import { Router } from 'express'
import { loadLatestTemplates, loadTemplateById } from '../../modules/templates/templateStore.js';
import { JsonTemplateEngine } from '../../modules/templateEngine.js';
import { getDefaultPolicyRules } from '../../modules/policies/defaultPolicies.js';
import { checkPolicies } from '../../modules/policies/policyChecker.js';
import type { PolicyCheckInput } from '../../core/types.js';

const policyRouter = Router();

/**
 * @swagger
 * /api/policies/check:
 *   post:
 *     summary: Run policy check
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Is this content safe?"
 *     responses:
 *       200:
 *         description: Successful policy check summary
 *       400:
 *         description: Failed policy check summary
 *       500:
 *         description: Error in policy checking
 */
policyRouter.post("/check", (req, res) => {
  try {
    const prompt = req.body as PolicyCheckInput;

    const summary = checkPolicies(prompt.prompt, getDefaultPolicyRules());

    return res.status(summary.passed ? 200 : 400).json(summary);

  } catch (e: any) {
    return res.status(500).json({
      error: e.message || "Policy check failed"
    });
  }
});

export default policyRouter;