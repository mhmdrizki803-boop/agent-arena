(function () {
    const el = (id) => document.getElementById(id);
    const polli = window.PolliClient;

    // BYOP: the scoped key the official <polli-connect> widget returns after consent.
    function getKey() {
        const c = document.querySelector("polli-connect");
        return (c && c.apiKey) || sessionStorage.getItem("polli_byop_key") || "";
    }

    function setStatus(text, cls) {
        const s = el("status");
        s.textContent = text || "";
        s.className = cls || "";
    }

    function agentPrompt(prompt) {
        return [
            "You are competing in an arena. Several AI models get the same question.",
            `Question: ${prompt}`,
            "Answer directly and take a clear position. At most 3 sentences, under 60 words.",
            "No preamble, no meta-commentary, no lists. Only your answer.",
        ].join(" ");
    }

    function judgePrompt(prompt, answers) {
        const lines = answers.map((a, i) => `AGENT ${i + 1} (${a.model}):\n${a.text}`).join("\n\n");
        return [
            "You are the judge of an arena. Score each agent's answer to this question:",
            `"${prompt}"`,
            "",
            lines,
            "",
            "Score each on clarity, correctness and directness, 0-100.",
            "Reply with JSON only, no markdown fence:",
            '{"scores":[{"agent":1,"score":85,"note":"one short sentence"}],"winner":1}',
            "One entry per agent, in order. The winner must be the highest score.",
        ].join("\n");
    }

    function parseJudge(text, count) {
        const cleaned = text.replace(/```json|```/g, "").trim();
        try {
            const j = JSON.parse(cleaned);
            const scores = Array.isArray(j.scores) ? j.scores : [];
            if (scores.length !== count) return null;
            for (const s of scores) {
                if (typeof s.score !== "number" || s.score < 0 || s.score > 100) return null;
            }
            const best = scores.reduce((a, b) => (b.score > a.score ? b : a));
            return { scores, winner: best.agent };
        } catch (_e) {
            return null;
        }
    }

    function render(answers, verdict) {
        const arena = el("arena");
        arena.innerHTML = "";
        arena.style.display = "block";

        const scoreOf = (i) => {
            if (!verdict) return null;
            const s = verdict.scores.find((x) => x.agent === i + 1);
            return s ? s.score : null;
        };

        answers.forEach((a, i) => {
            const isWinner = verdict && verdict.winner === i + 1;
            const card = document.createElement("div");
            card.className = "agent" + (isWinner ? " winner" : "");

            const head = document.createElement("div");
            head.className = "agent-head";

            const left = document.createElement("div");
            const name = document.createElement("div");
            name.className = "agent-name";
            name.textContent = "Agent " + (i + 1);
            const model = document.createElement("div");
            model.className = "agent-model";
            model.textContent = a.model;
            left.appendChild(name);
            left.appendChild(model);

            const right = document.createElement("div");
            if (scoreOf(i) !== null) {
                const sc = document.createElement("div");
                sc.className = "score";
                sc.textContent = scoreOf(i);
                sc.style.color = isWinner ? "var(--win)" : "var(--txt)";
                right.appendChild(sc);
            }
            if (isWinner) {
                const b = document.createElement("span");
                b.className = "badge win";
                b.textContent = "winner";
                right.appendChild(b);
            }
            head.appendChild(left);
            head.appendChild(right);

            const ans = document.createElement("div");
            ans.className = "answer";
            ans.textContent = a.text;

            card.appendChild(head);
            card.appendChild(ans);

            if (verdict) {
                const s = verdict.scores.find((x) => x.agent === i + 1);
                if (s && s.note) {
                    const note = document.createElement("div");
                    note.className = "judge";
                    note.textContent = s.note;
                    card.appendChild(note);
                }
            }
            arena.appendChild(card);
        });
    }

    async function run() {
        const apiKey = getKey();
        if (!apiKey) {
            setStatus("Approve a Pollinations key first — press Connect in the panel below.", "err");
            return;
        }
        const prompt = el("prompt").value.trim();
        if (!prompt) {
            setStatus("Write a prompt for the agents first.", "err");
            return;
        }

        const models = [el("m1").value, el("m2").value, el("m3").value].filter(Boolean);
        const judge = el("judge").value;
        const btn = el("go");
        btn.disabled = true;
        el("arena").style.display = "none";

        try {
            // Each agent answers independently, in parallel, on its own model.
            setStatus(`Running ${models.length} agents in parallel…`);
            const answers = await Promise.all(
                models.map(async (model) => {
                    const text = await polli.chatCompletion(
                        [{ role: "user", content: agentPrompt(prompt) }],
                        { apiKey, model, maxTokens: 300, temperature: 0.8 },
                    );
                    return { model, text };
                }),
            );

            // Show the answers before judging, so a judge failure still leaves a usable result.
            render(answers, null);

            setStatus("Judging…");
            let verdict = null;
            try {
                const raw = await polli.chatCompletion(
                    [{ role: "user", content: judgePrompt(prompt, answers) }],
                    { apiKey, model: judge, maxTokens: 500, temperature: 0.2 },
                );
                verdict = parseJudge(raw, answers.length);
            } catch (_e) {
                verdict = null;
            }

            if (verdict) {
                render(answers, verdict);
                const w = verdict.scores.find((s) => s.agent === verdict.winner);
                setStatus(`Agent ${verdict.winner} wins with ${w.score}/100. ${models.length + 1} requests billed to your Pollen.`, "ok");
            } else {
                setStatus(`Answers are in, but the judge reply could not be parsed. ${models.length} requests billed.`, "err");
            }
        } catch (err) {
            setStatus(err.message, "err");
        } finally {
            btn.disabled = false;
        }
    }

    el("go").addEventListener("click", run);
})();
