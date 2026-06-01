import { Router } from 'express'
import { loadAllTemplates, loadLatestTemplates, loadTemplateById } from '../../modules/templates/templateStore.js';
import { JsonTemplateEngine } from '../../modules/templateEngine.js';
import type { PromptTemplate } from '../../core/types.js';
import { addTemplate, removeTemplate, removeTemplateAllVersions, updateTemplate } from '../../modules/templates/adminTemplateService.js';

const templateRouter = Router();

const engine = new JsonTemplateEngine();

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get latest templates
 *     responses:
 *       200:
 *         description: List of templates
 */
templateRouter.get("/", async (req, res) => {
  try {
    var out = await loadLatestTemplates()
    res.status(200).json(out)
  } catch(e: any) {
    res.status(400).json({error: e.message});
  }
});

/**
 * @swagger
 * /api/templates/all:
 *   get:
 *     summary: Get all versions of templates
 *     responses:
 *       200:
 *         description: List of templates
 *       400:
 *         description: Error loading templates
 */
templateRouter.get("/all", async (req, res) => {
  try {
    var out = await loadAllTemplates()
    res.status(200).json(out)
  } catch(e: any) {
    res.status(400).json({error: e.message});
  }
});

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "polite_reply"
 *     responses:
 *       200:
 *         description: Template found
 *       400:
 *         description: Error fetching template
 */
templateRouter.get("/:id", async (req, res) => {
  try {
    var out = await engine.getTemplate(req.params.id);
    res.status(200).json(out);
  } catch(e: any) {
    res.status(400).json({ error: e.message || "Internal server error" });
  }
});

/**
 * @swagger
 * /api/templates/execute/{id}:
 *   post:
 *     summary: Execute a template with inputs
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
 *         description: Rendered template output
 *       400:
 *         description: Validation or execution error
 */
templateRouter.post("/execute/:id", async (req, res) => {
  try {
    var template = await engine.getTemplate(req.params.id);

    var errors = await engine.validateInputs(template, req.body);
    if (errors.length > 0) {
      const errorString = errors.map(e => `${e}`).join("\n");
      return res.status(400).json({ errors: errorString });
    }

    var out = await engine.render(template, req.body);

    res.status(200).json(out);
  } catch (e: any) {
      res.status(400).json({ error: e.message || "Internal server error" });
  }
});

/**
 * @swagger
 * /api/templates/add:
 *   put:
 *     summary: Add a new template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               id: "example_template"
 *               description: "Write the reverse of a word"
 *               content: "Write the reverse of the following word as a simple string: {{example_word}}"
 *               variables:
 *                 - name: "example_word"
 *                   type: "string"
 *                   description: "Word to reverse"
 *                   required: true
 *     responses:
 *       200:
 *         description: Template added
 */
templateRouter.put("/add", async (req, res) => {
  let t: PromptTemplate;
  try {
    t = req.body;
    await addTemplate(t);
    return res.status(200).json({message: `Template ${t.id} added`});
  } catch (e:any) {
    return res.status(400).json({error: e.message});
  }
});

/**
 * @swagger
 * /api/templates/update/{id}:
 *   put:
 *     summary: Update an existing template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "example_template"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               id: "example_template"
 *               description: "Write the word in all caps"
 *               content: "Write the following word in all caps as a simple string: {{example_word}}"
 *               variables:
 *                 - name: "example_word"
 *                   type: "string"
 *                   description: "Word to capitalize"
 *                   required: true
 *     responses:
 *       200:
 *         description: Template updated
 */
templateRouter.put("/update/:id", async (req, res) => {
  let t: PromptTemplate;
  try {
    t = req.body;
    await updateTemplate(req.params.id, t);
    return res.status(200).json({message: `Template ${t.id} updated`});
  } catch (e:any) {
    return res.status(400).json({error: e.message});
  }
});

/**
 * @swagger
 * /api/templates/delete/{id}:
 *   delete:
 *     summary: Delete a template (all versions)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "example_template"
 *     responses:
 *       200:
 *         description: Template deleted
 */
templateRouter.delete("/delete/:id", async (req, res) => {
  try {
    await removeTemplateAllVersions(req.params.id);
    return res.status(200).json({message: `Template ${req.params.id} deleted`});
  } catch (e: any) {
    return res.status(400).json({error: e.message});
  }
});

/**
 * @swagger
 * /api/templates/delete/{id}/{version}:
 *   delete:
 *     summary: Delete a specific version of a template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Template version deleted
 */
templateRouter.delete("/delete/:id/:version", async (req, res) => {
  try {
    await removeTemplate(req.params.id, parseInt(req.params.version));
    return res.status(200).json({message: `Template ${req.params.id} deleted`});
  } catch (e: any) {
    return res.status(400).json({error: e.message});
  }
});

export default templateRouter;