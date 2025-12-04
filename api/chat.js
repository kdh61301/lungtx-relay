// api/chat.js

function splitTextNatural(text, limit = 900) {
  const result = [];

  while (text.length > limit) {
    let slice = text.slice(0, limit);
    let cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("\n")
    );

    if (cut === -1) cut = limit;
    result.push(text.slice(0, cut + 1).trim());
    text = text.slice(cut + 1).trim();
  }

  result.push(text);
  return result;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const userMessage = req.body?.userRequest?.utterance || "";
    const botUserKey =
      req.body?.userRequest?.user?.properties?.botUserKey ||
      req.body?.userRequest?.user?.id;

    // -----------------------------
    // ① 즉시 응답 (타임아웃 방지)
    // -----------------------------
    res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "답변을 준비 중입니다. 잠시만 기다려주세요..."
            }
          }
        ]
      }
    });

    // -----------------------------
    // ② 백그라운드에서 OpenAI 호출
    // -----------------------------
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: userMessage + "\n\n(300자 이하로 요약해서 답변해줘)"
          }
        ]
      })
    });

    const data = await openaiRes.json();
    const answer = data?.choices?.[0]?.message?.content || "답변을 불러올 수 없습니다.";

    const parts = splitTextNatural(answer, 900);

    // -----------------------------
    // ③ Server-side Push 전송
    // -----------------------------
    await fetch("https://kapi.kakao.com/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`
      },
      body: JSON.stringify({
        user_key: botUserKey,
        template_object: {
          object_type: "text",
          text: parts.join("\n\n")
        }
      })
    });

  } catch (err) {
    console.error("ERROR:", err);
  }
};
