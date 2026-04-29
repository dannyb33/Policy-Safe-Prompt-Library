import { Router } from 'express'
import { loadAllTemplates, loadLatestTemplates, loadTemplateById } from '../../modules/templates/templateStore.js';
import { JsonTemplateEngine } from '../../modules/templateEngine.js';
import type { PromptTemplate } from '../../core/types.js';
import { addTemplate, removeTemplate, removeTemplateAllVersions, updateTemplate } from '../../modules/templates/adminTemplateService.js';
import { sendToLLM, testLLMConnection } from '../../modules/llmConnector.js';
import { getDefaultPolicyRules } from '../../modules/policies/defaultPolicies.js';
import { loadMongoPolicyRules } from '../../modules/policies/mongoPolicyRules.js';
import { checkPolicies } from '../../modules/policies/policyChecker.js';

const llmRouter = Router();

const engine = new JsonTemplateEngine();

/**
 * @swagger
 * /api/llm/test:
 *   get:
 *     summary: Test local LLM
 *     responses:
 *       200:
 *         description: Successfully connected to llm
 *       400:
 *         description: Connection error
 */
llmRouter.get("/test", async (req, res) => {
    try {
        const success = await testLLMConnection();
        
        if (!success) {
            res.status(400).json({error: "LLM Connection failed."});
        }
        else {
            res.status(200).json({message: "LLM connection successful!"});
        }
    } catch(e: any) {
        res.status(400).json({error: e.message});
    }
});

/**
 * @swagger
 * /api/llm/run/{id}:
 *   post:
 *     summary: Render a template with inputs and send to LLM
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             example:
 *               name: "John"
 *               product: "Policy CLI"
 *     responses:
 *       200:
 *         description: LLM output
 *       400:
 *         description: Validation or execution error
 */
llmRouter.post("/run/:id", async (req, res) => {
  try {
    var template = await engine.getTemplate(req.params.id);

    var errors = await engine.validateInputs(template, req.body);
    if (errors.length > 0) {
      const errorString = errors.map(e => `${e}`).join("\n");
      return res.status(400).json({ errors: errorString });
    }

    var rendered = await engine.render(template, req.body);

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

    const summary = checkPolicies(rendered.output, rules);

    if (!summary.passed) throw new Error(summary.blockedReasons.join());

    const llmResponse = await sendToLLM(rendered.output);

    res.status(200).json({response: llmResponse});
  } catch (e: any) {
      res.status(400).json({ error: e.message || "Internal server error" });
  }
});

export default llmRouter;