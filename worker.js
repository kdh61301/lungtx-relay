export default {
  async fetch(request, env) {
    const { OPENAI_API_KEY } = env;
    const body = await request.json();
    const text = body.userRequest?.utterance || "";

    if (!text) {
      return Response.json({
        version: "2.0",
        template: { outputs: [ { simpleText: { text: "입력된 문장이 없습니다." } } ] }
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "폐이식 교육 챗봇" },
          { role: "user", content: text }
        ]
      })
    });

    const json = await openaiRes.json();
    const answer = json.choices?.[0]?.message?.content || "응답 오류입니다.";

    return Response.json({
      version: "2.0",
      template: { outputs: [ { simpleText: { text: answer } } ] }
    });
  }
};
