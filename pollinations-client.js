/**
 * pollinations-client.js — Pollinations text chat (BYOP).
 *
 * Used by this app to let two agents talk to each other. The visitor approves a
 * scoped key through the official <polli-connect> widget and every completion is
 * billed to their own Pollen; no general-purpose secret key is pasted anywhere.
 *
 * Reference: https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md
 */
(function (root) {
    const API_URL = "https://gen.pollinations.ai/v1/chat/completions";
    const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

    /**
     * Send a full message history and return the assistant text.
     * @param {{role:string, content:string}[]} messages
     * @param {{apiKey:string, model?:string, maxTokens?:number, temperature?:number}} opts
     */
    async function chatCompletion(messages, opts) {
        const { apiKey, model = DEFAULT_MODEL, maxTokens = 300, temperature } = opts || {};
        if (!apiKey) {
            throw new Error("Missing Pollinations key — approve one with the Connect button first.");
        }
        const body = {
            model,
            messages: messages.map((m) => ({
                role: m.role,
                content: String(m.content).slice(0, 8000),
            })),
            max_tokens: maxTokens,
        };
        if (typeof temperature === "number") body.temperature = temperature;

        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            let detail = "";
            try {
                const j = await res.json();
                detail = (j.error && (j.error.message || j.error)) || "";
            } catch (_err) { /* body was not JSON */ }
            throw new Error("Pollinations API error " + res.status + (detail ? " — " + detail : ""));
        }
        const data = await res.json();
        const choice = (data.choices && data.choices[0]) || {};
        const text = choice.message && choice.message.content;
        if (text === undefined || text === null || text === "") {
            throw new Error("Pollinations returned an empty reply.");
        }
        return String(text).trim();
    }

    root.PolliClient = { API_URL, DEFAULT_MODEL, chatCompletion };
})(typeof self !== "undefined" ? self : globalThis);
