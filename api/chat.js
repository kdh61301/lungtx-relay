// api/chat.js

module.exports = async (req, res) => {
  // 1) GET 요청 막고, POST만 받기
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
            { simpleText: { text: "입력된 문장이 없습니다. 다시 질문해주세요." } }
          ]
        }
      });
    }

    // 3) OPENAI_API_KEY 설정 안 되어 있을 때
    if (!process.env.OPENAI_API_KEY) {
      console.error("⚠ OPENAI_API_KEY가 설정되어 있지 않습니다.");
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            { simpleText: { text: "서버 설정 오류: OPENAI_API_KEY가 없습니다." } }
          ]
        }
      });
    }

    // 4) OpenAI API 호출
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "양산부산대학교병원 폐이식 프로그램에 대해 교육용으로 설명하는 챗봇이다. " +
              "환자에게 진단/약물 처방/응급 판단을 하지 말고 필요 시 외래 진료 또는 병원 방문을 권유한다."
          },
          { role: "user", content: userText }
        ]
      })
    });

    const data = await openaiRes.json();

    // 5) OpenAI 쪽에서 에러 응답일 때 (401, 400 등)
    if (!openaiRes.ok) {
      console.error("⚠ OpenAI 응답 에러:", openaiRes.status, data);
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

    // 6) 정상 응답
    const answer = data.choices?.[0]?.message?.content || "답변을 생성하지 못했습니다.";

    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          { simpleText: { text: answer } }
        ]
      }
    });

  } catch (err) {
    console.error("🔥 서버 내부 오류:", err);
    return res.status(200).json({
      version: "2.0",
      template: {
        outputs: [
          { simpleText: { text: "서버 내부 오류가 발생했습니다." } }
        ]
      }
    });
  }
};
