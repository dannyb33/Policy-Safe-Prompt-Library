import axios from 'axios';

const LLM_KEY = process.env.LLM_KEY;
const LLM_URL = process.env.LLM_URL;

if (!LLM_URL) throw new Error("LLM URL not set in environment variables (.env file)");
if (!LLM_KEY) throw new Error("LLM Key not set in environment variables (.env file)");


const LLM_CONFIG = {
    url: LLM_URL + "/chat/completions",
    model: "gpt-oss-120b",
    key: LLM_KEY
};

async function sendToLLM(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
            LLM_CONFIG.url,
            {
                model: LLM_CONFIG.model,
                messages: [{ role: "user", content: prompt }],
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${LLM_CONFIG.key}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error: any) {
        throw new Error(`LLM Error: ${error.message}`);
    }
}  

export async function testLLMConnection(): Promise<boolean> {
    console.log("LLM");

    try {
        console.log(LLM_CONFIG.url)
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
