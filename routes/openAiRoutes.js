import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import HistoryModel from '../mongodb/models/historyModel.js';
const openAI = axios.create({
  baseURL: 'https://api.openai.com/v1/',
});
dotenv.config();

const router = express.Router();

router.route('/history').post(async function (req, res) {
  try {
    const { userID } = req.body;

    const history = await HistoryModel.findOne({ user: userID });
    try {
      const messages = Object.values(history.messages);
      return res.status(201).send(messages);
    } catch (error) {
      console.log(error);
      return res.status(501).send('loi');
    }
  } catch (error) {
    console.log(error);
    return res.status(502).send('loi1');
  }
});

router.route('/chatgpt/confide').post(async function (req, res) {
  try {
    const { message, userID } = req.body;

    const history = await HistoryModel.findOne({ user: userID });

    console.log('chua loi');
    console.log('====================================');
    console.log(history);
    console.log('====================================');
    let messages = [{
      role: 'user',
      content: '(Bạn là EmotiBot, một trợ lý ảo của nền tảng AI-CARE. Hãy trả lời câu hỏi sau dấu hai chấm như một chuyên gia tâm lý thực thụ, hãy trả lời theo dạng đoạn văn nói liền mạch, không được trả lời dạng liệt kê con số):' + message,
    }];
    if (history) {
      const { _id, ...messagesObject } = history.messages;
      messages = Object.values(messagesObject);

      const firstThreeMessages = messages.slice(0, 3);

      messages.push(
        {
        role: 'user',
        content: '' + message,
      });
    }

    const completion = await openAI.post(
      '/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const completion_text = completion.data.choices[0].message.content;
    // if (history) {
      try {
        messages.push({ role: 'assistant', content: completion_text });
        const update = await HistoryModel.updateOne(
          { user: userID },
          { messages: messages }
        );
        return res.status(200).send({ data: completion_text, status: 200 });
      } catch (error) {
        console.log(error);
        return res.status(503).send('loi');
      }
    // }
  } catch (error) {
    console.log(error);
    return res.status(505).send('loi');
  }
});
export default router;
