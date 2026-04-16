//npm install @anthropic-ai/sdk
//npm install axios
//import { Anthropic } from "@anthropic-ai/sdk";
import axios from 'axios';


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: "claude-2",
  max_tokens: 1024,
  messages: [{role: "user", content: "What is the meaning of life?"}],
});

console.log(message.content[0].text);

const LLM_CONFIG = {
    custom: {
        url: "https://your-llm-api.com/generate",
        //key: process.env.YOUR_API_KEY,
        model: "your-model"
    }
};

//choose LLM to use
const ACTIVE_LLM = "custom"; // or "anthropic" etc...

async function sendToLLM(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
            LLM_CONFIG.custom.url,
            {
                model: LLM_CONFIG.custom.model,
                prompt: prompt,
                stream: false, // get complete response at once 
                //ADD OTHER LLM PARAMETERS AS NEEDED
            },
            // {
            //     headers: {
            //         "content-type": "application/json",
            //         "Authorization": LLM_CONFIG.custom.key ? `Bearer ${LLM_CONFIG.custom.key}` : undefined
            //     }
            // }
        );

        return response.data.output || response.data.text || response.data.response;

    } catch (error: any) {
        throw new Error(`Custom LLM Error: ${error.message}`);
    }
};   

export async function testLLMConnection(): Promise<boolean> {
    try {
        console.log("> Testing LLM connection...");
        const response = await sendToLLM("Say 'Connection successful' in exactly 5 words.");
        console.log(`> SUCCESS! LLM responded: "${response}"`);
        return true;
    } catch (error: any) {
        console.error(`> FAILED: ${error.message}`);
        return false;
    }
}

// CLI cmds?????

// Add this import at the top of main.ts
import { sendToLLM, testLLMConnection } from "../modules/llmConnector.js";

// Add this function to main.ts
async function cmdRunWithLLM() {
    const id = process.argv[3];
    if (!id) {
        console.error("[ERROR] Missing <template-id>");
        console.error("Usage: policy-cli run-llm <template-id> --data '<json-string>'");
        process.exit(1);
    }
    
    const dataStr = parseArg("--data");
    if (!dataStr) {
        console.error("[ERROR] Missing --data '<json-string>'");
        console.error("Example: policy-cli run-llm summarize_email --data '{\"text\":\"Hello\",\"length\":\"short\"}'");
        process.exit(1);
    }
    
    let inputs: Record<string, unknown>;
    try {
        inputs = JSON.parse(dataStr);
    } catch {
        console.error("[ERROR] --data is not valid JSON");
        process.exit(1);
    }
    
    const engine = new JsonTemplateEngine();
    
    try {
        // Step 1: Get the template
        console.log(`> Loading template '${id}'...`);
        const template = await engine.getTemplate(id);
        
        // Step 2: Validate inputs (this checks your prohibited words!)
        console.log(`> Validating inputs...`);
        const validationErrors = engine.validateInputs(template, inputs);
        
        if (validationErrors.length > 0) {
            console.error("> Validation failed:");
            validationErrors.forEach((e) => console.error(`>   • ${e}`));
            process.exit(1);
        }
        
        // Step 3: Render the template
        console.log(`> Rendering template...`);
        const renderedPrompt = engine.render(template, inputs);
        
        console.log(`> Rendered prompt:`);
        console.log(`> ----------------------------------------`);
        console.log(renderedPrompt);
        console.log(`> ----------------------------------------`);
        
        // Step 4: Send to LLM
        console.log(`> Sending to LLM...`);
        const llmResponse = await sendToLLM(renderedPrompt);
        
        console.log(`> LLM Response:`);
        console.log(`> ----------------------------------------`);
        console.log(llmResponse);
        console.log(`> ----------------------------------------`);
        
    } catch (error: any) {
        console.error("[ERROR]", error.message);
        process.exit(1);
    }
}

// Add test command
async function cmdTestLLM() {
    const success = await testLLMConnection();
    if (success) {
        console.log("✅ LLM is ready to use!");
    } else {
        console.log("❌ LLM connection failed. Check your setup.");
    }
}

// Add these to your main() function's command list
if (command === "run-llm") return cmdRunWithLLM();
if (command === "test-llm") return cmdTestLLM();

// Update the usage help text
console.log("  policy-cli run-llm <template-id> --data '<json-string>'   Send rendered template to LLM");
console.log("  policy-cli test-llm                                       Test LLM connection");


// Prohibited words management