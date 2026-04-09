import { Router } from 'express'
import { loadLatestTemplates, loadTemplateById } from '../../modules/templates/templateStore.js';
import { JsonTemplateEngine } from '../../modules/templateEngine.js';
import type { PromptTemplate } from '../../core/types.js';
import { addTemplate, removeTemplate, updateTemplate } from '../../modules/templates/adminTemplateService.js';

const templateRouter = Router();

const engine = new JsonTemplateEngine();

templateRouter.get("/", async (req, res) => {
  try {
      var out = await loadLatestTemplates()
      res.status(200).json(out)
  } catch(e: any) {
    res.status(400).json({error: e.message});
  }
});

templateRouter.get("/:id", async (req, res) => {
  try {
    var out = await engine.getTemplate(req.params.id);
    res.status(200).json(out);
  } catch(e: any) {
    res.status(400).json({ error: e.message || "Internal server error" });
  }
});

templateRouter.post("/execute/:id", async (req, res) => {
  try {
    console.log("start");
    var template = await engine.getTemplate(req.params.id);

    console.log(req.body);

    var errors = await engine.validateInputs(template, req.body);
    if (errors.length > 0) {
      const errorString = errors.map(e => `${e}`).join("\n");
      console.log(errorString);
      return res.status(400).json({ errors: errorString });
    }

    console.log("validated");

    var out = await engine.render(template, req.body);

    res.status(200).json(out);
  } catch (e: any) {
      res.status(400).json({ error: e.message || "Internal server error" });
  }
});

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

templateRouter.delete("/delete/:id", async (req, res) => {
    try {
      await removeTemplate(req.params.id);
      return res.status(200).json({message: `Template ${req.params.id} deleted`});
    } catch (e: any) {
      return res.status(400).json({error: e.message});
    }
});

templateRouter.delete("/delete/:id/:version", async (req, res) => {
    try {

      await removeTemplate(req.params.id, parseInt(req.params.version));
      return res.status(200).json({message: `Template ${req.params.id} deleted`});
    } catch (e: any) {
      return res.status(400).json({error: e.message});
    }
});

export default templateRouter;