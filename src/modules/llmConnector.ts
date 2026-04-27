// download https://ollama.com/download 
// then run ollama serve in terminal to start the server
    // "ollama pull llama3.2"
// you may also have to run npm install axios
// then run  "policy-cli test-llm" to test the connection

import axios from 'axios';

const LLM_CONFIG = {
    url: "http://localhost:11434/api/chat",
    model: "llama3.2"
};

async function sendToLLM(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
            LLM_CONFIG.url,
            {
                model: LLM_CONFIG.model,
                messages: [{ role: "user", content: prompt }],
                stream: false,
            }
        );
        return response.data.message.content;
    } catch (error: any) {
        throw new Error(`LLM Error: ${error.message}`);
    }
}  

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
export { sendToLLM };
