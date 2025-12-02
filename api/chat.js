// api/chat.js

module.exports = async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }
  
    try {
      const body = req.body || {};
      const userText = body.userRequest?.utterance || "";
  
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
  
      // OpenAI API 호출
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
      const answer = data.choices?.[0]?.message?.content || "답변 생성 오류";
  
      return res.status(200).json({
        version: "2.0",
        template: {
          outputs: [
            { simpleText: { text: answer } }
          ]
        }
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        version: "2.0",
        template: {
          outputs: [
            { simpleText: { text: "오류가 발생했습니다. 다시 시도해주세요." } }
          ]
        }
      });
    }
  };
  