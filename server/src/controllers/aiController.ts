import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export class AIController {
  async chat(req: Request, res: Response) {
    try {
      const question = req.body.question || req.body.message || req.body.prompt;

      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Question prompt cannot be empty',
        });
      }

      const result = await aiService.askAssistant(question.trim());

      res.json({
        success: true,
        answer: result.answer,
        confidence: result.confidence,
        sources: result.sources,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'AI Assistant could not process question',
      });
    }
  }
}

export const aiController = new AIController();
export default aiController;
