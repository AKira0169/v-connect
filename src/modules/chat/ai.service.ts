// ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Message } from '../messages/entities/message.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private model: string;
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.model = this.configService.getOrThrow<string>('OPENAI_MODEL');
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateChatInsights(messages: Message[]) {
    const prompt = `
      Analyze the following chat conversation. 
      Return JSON with:
      - summary: one-sentence summary
      - sentiment: positive, negative, or neutral
      - keywords: list of 3–5 main keywords.

      Messages:
      ${messages.map((m) => `${m.sender.firstName}: ${m.content}`).join('\n')}
    `;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    try {
      const raw = response.choices[0].message.content || '{}';
      return JSON.parse(raw) as {
        summary: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        keywords: string[];
      };
    } catch {
      return {
        summary: 'No insights available',
        sentiment: 'neutral',
        keywords: [],
      };
    }
  }
}
