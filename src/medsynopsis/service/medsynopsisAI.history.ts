import { Injectable } from '@nestjs/common';
import { isWithinTokenLimit } from 'gpt-tokenizer';
import { ChattHistory } from 'src/utilities/interface/interface';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class MedSynopsisChatHistoryService {
  private readonly maxReqTokens: number;
  private chatHistory: Map<string, ChatCompletionMessageParam[]> = new Map();

  constructor() {
    this.maxReqTokens = 12000;
  }

  // Add human message to the chat history
  setChatHistory(userUUID: string, message: ChattHistory) {
    const messages = this.chatHistory.get(userUUID) || [];

    messages.push(message);
    this.chatHistory.set(userUUID, messages);
  }

  // Get chat history
  getChatHistory(userUUID: string): ChatCompletionMessageParam[] {
    return this.chatHistory.get(userUUID) || [];
  }

  // Clear chat history
  clearChatHistory(userUUID: string) {
    this.chatHistory.delete(userUUID);
  }

  // Method to count tokens in a message
  countTokens(
    tokenLimit: number,
    contest?: string,
    chatHistory?: ChatCompletionMessageParam[],
  ): number | boolean {
    // Concatenate all content fields from the chat array if contest is not passed
    const text = contest
      ? contest
      : chatHistory.reduce((acc, entry) => acc + entry.content, '');
    return isWithinTokenLimit(text, tokenLimit);
  }

  // Truncate older messages to stay within a token limit
  reduceChatHistory(
    userUUID: string,
    chatHistory: ChatCompletionMessageParam[],
  ) {
    let totalTokens = this.countTokens(this.maxReqTokens, '', chatHistory);

    while (!totalTokens && chatHistory.length > 0) {
      chatHistory.shift();
      totalTokens = this.countTokens(this.maxReqTokens, '', chatHistory);
    }

    this.chatHistory.set(userUUID, chatHistory);

    return totalTokens;
  }
}
