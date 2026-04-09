import { Router } from 'express'
import { loadLatestTemplates, loadTemplateById } from '../../modules/templates/templateStore.js';
import { JsonTemplateEngine } from '../../modules/templateEngine.js';

const router = Router();

const engine = new JsonTemplateEngine();

router.get("/", async (req, res) => {
  try {
      var out = await loadLatestTemplates()
      res.status(200).json(out)
  } catch(e) {
    res.status(400).json(e);
  }
});

router.get("/:id", async (req, res) => {
  try {
    var out = await engine.getTemplate(req.params.id);
    res.status(200).json(out);
  } catch(e: any) {
    res.status(400).json({ error: e.message || "Internal server error" });
  }
});

router.post("/:id/execute", async (req, res) => {
  try {
    var template = await engine.getTemplate(req.params.id);

    console.log(req.body);

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


export default router;