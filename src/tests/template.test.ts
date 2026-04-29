import type { PromptTemplate } from "../core/types.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { loadLatestTemplates } from "../modules/templates/templateStore.js";
import { describe, beforeAll, it, expect } from "vitest";

let templates: PromptTemplate[];
let engine: JsonTemplateEngine;

beforeAll(async () => {
    templates = await loadLatestTemplates();
    engine = new JsonTemplateEngine();
});

describe('testPoliteReply', () => {
    it('tests basic template rendering', () => {
        const polite_reply = templates.find((i) => i.id == "polite_reply");
        expect(polite_reply).not.toBeNaN();

        expect(engine.validateInputs(polite_reply!, {"text": "test text"})).toHaveLength(0);

        expect(engine.render(polite_reply!, {"text": "test text"}).output).toEqual(`Rewrite the following text to be polite and professional:\n\n'test text'`);
    })
});