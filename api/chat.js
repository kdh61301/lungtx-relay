// api/chat.js

// 🔥 0) 긴 텍스트를 자연스럽게 900자 이하로 나누는 함수 추가
function splitTextNatural(text, limit = 900) {
  const result = [];

  while (text.length > limit) {
    let slice = text.slice(0, limit);

    // 문장 단위로 끊기
    let cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("\n")
    );

    if (cut === -1) cut = limit;
    result.push(text.slice(0, cut + 1));
    text = text.slice(cut + 1).trim();
  }

  result.push(text);
  return result;
}

module.exports = async (req, res) => {
  // 1) GET 요청 차단, POST만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const body = req.body || {};
    const userText = body.userRequest?.utterance || "";

    // 2) 발화가 비었을 때
    if (!userText) {
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "입력된 내용이 없습니다."
              }
            }
          ]
        }
      });
    }

    // 3) OpenAI 호출
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400,   // 🔥 OpenAI 답변 길이 제한 (900자 근처)
        messages: [
          {
            role: "user",
            content: userText + "\n\n(900자 이내로 답변해주세요)"
          }
        ]
      })
    });

    // 4) API 오류 처리
    if (!openaiRes.ok) {
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: `OpenAI 오류가 발생했습니다. (status: ${openaiRes.status})`
              }
            }
          ]
        }
      });
    }

    const data = await openaiRes.json();
    const answer = data.choices?.[0]?.message?.content || "응답을 불러올 수 없습니다.";

    // 🔥 5) 긴 답변을 여러 말풍선으로 분할
    const parts = splitTextNatural(answer, 900);

    // 🔥 6) 카카오톡 메시지 여러 개로 전송
    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: parts.map((textChunk) => ({
          simpleText: { text: textChunk }
        }))
      }
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: { text: "서버 내부 오류가 발생했습니다." }
          }
        ]
      }
    });
  }
};

// api/chat.js

// ---------------------------------------------------
// 🔥 0) 긴 텍스트를 자연스럽게 900자 이하로 나누는 함수
// ---------------------------------------------------
function splitTextNatural(text, limit = 900) {
  const result = [];

  while (text.length > limit) {
    let slice = text.slice(0, limit);

    // 문장 단위로 끊기
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

// ---------------------------------------------------
// 🔥 1) 메인 API 엔드포인트
// ---------------------------------------------------
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const userMessage = req.body?.userRequest?.utterance || "";

    if (!userMessage) {
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: { text: "입력된 내용이 없습니다." }
            }
          ]
        }
      });
    }

    // ---------------------------------------------------
    // 🔥 2) OpenAI 호출
    // ---------------------------------------------------
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400, // 900자 근처로 제한
        messages: [
          {
            role: "user",
            content: userMessage + "\n\n(900자 이내로 간략하게 답하세요.)"
          }
        ]
      })
    });

    if (!openaiRes.ok) {
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: `OpenAI 요청 실패 (status: ${openaiRes.status})`
              }
            }
          ]
        }
      });
    }

    const data = await openaiRes.json();
    const answer = data?.choices?.[0]?.message?.content || "답변을 가져올 수 없습니다.";

    // ---------------------------------------------------
    // 🔥 3) 긴 답변 분할
    // ---------------------------------------------------
    const parts = splitTextNatural(answer, 900);

    // ---------------------------------------------------
    // 🔥 4) 카카오톡 말풍선 여러 개로 전송
    // ---------------------------------------------------
    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: parts.map(text => ({
          simpleText: { text }
        }))
      }
    });

  } catch (err) {
    console.error("Server Error:", err);

    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            }
          }
        ]
      }
    });
  }
};
