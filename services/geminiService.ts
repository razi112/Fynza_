import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { Message, AppSettings, DEFAULT_SETTINGS } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat | null = null;
  private currentSettings: AppSettings = DEFAULT_SETTINGS;

  constructor() {
    this.startNewChat();
  }

  private getSystemInstruction(settings: AppSettings): string {
    const baseInstruction = "You are a helpful, clever, and concise AI assistant named Gemini Clone. Format your responses with Markdown.";
    
    let toneInstruction = "";
    switch (settings.personality) {
      case 'professional': toneInstruction = "Maintain a strictly professional, objective, and formal tone."; break;
      case 'friendly': toneInstruction = "Be warm, approachable, and friendly. Use emojis occasionally if appropriate."; break;
      case 'creative': toneInstruction = "Be imaginative and creative. Use colorful language and metaphors."; break;
      case 'humorous': toneInstruction = "Be witty and humorous. Feel free to crack jokes where appropriate."; break;
      case 'strict': toneInstruction = "Be concise, direct, and strict. Avoid filler words and pleasantries."; break;
    }

    const parts = [baseInstruction, toneInstruction, settings.customSystemInstruction].filter(Boolean);
    return parts.join("\n\n");
  }

  public startNewChat(settings: AppSettings = DEFAULT_SETTINGS, history?: Message[]) {
    this.currentSettings = settings;
    
    const config: any = {
      systemInstruction: this.getSystemInstruction(settings),
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
    };

    // Apply thinking config if enabled and using a supported model
    if (settings.enableThinking) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
    }

    // Convert internal message format to SDK Content format
    let sdkHistory: Content[] | undefined = undefined;
    if (history && history.length > 0) {
      sdkHistory = history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
    }

    this.chat = ai.chats.create({
      model: settings.model,
      config: config,
      history: sdkHistory
    });
  }

  // Called when settings change mid-chat to update the session context
  public updateSettings(newSettings: AppSettings, currentHistory: Message[]) {
    this.startNewChat(newSettings, currentHistory);
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chat) {
      this.startNewChat(this.currentSettings);
    }

    if (!this.chat) throw new Error("Failed to initialize chat");

    try {
      // The sendMessageStream method does not allow overriding config per message easily in this SDK version
      // without creating a new chat, so we rely on the chat being initialized with the correct config.
      const result = await this.chat.sendMessageStream({ message });
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
