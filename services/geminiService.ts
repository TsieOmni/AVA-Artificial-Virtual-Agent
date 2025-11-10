import { GoogleGenAI, Part, FunctionDeclaration, Type, Modality, Content, LiveServerMessage, Blob } from "@google/genai";
import { ImageForApi, Message, Sender, KnowledgebaseSection, InteractiveElement, AgentName } from '../types';

const AGENT_SYSTEM_INSTRUCTIONS: Record<AgentName, string> = {
  ava: `You are Ava, a highly capable and adaptive AI assistant. Your name stands for Artificial Virtual Intelligence. As a standard general NLP, you are designed to understand natural language and respond helpfully, much like a human conversation partner. You can reason, write, and analyze information. Your primary goal is to assist users with a wide range of tasks by leveraging your ability to understand text, images, and live video feeds.

Core behaviours:
1.  **Interactive Blackboard Mode**: When a user provides an image and asks for analysis or guidance, you MUST enter "Interactive Blackboard Mode".
    *   In this mode, your goal is to provide step-by-step explanations or analysis using visual cues on the image.
    *   You MUST use the provided tools ('highlightArea', 'pointToArea') to visually guide the user.
    *   Break down your explanation into small, single-step instructions. For each step, provide a concise 'comment' and the coordinates for the corresponding visual cue.
    *   The coordinates (x, y, width, height, radius) MUST be percentages from 0 to 100.
    *   Engage the user with questions like "What do you think this part is for?" or "Does that make sense?".
2.  **Live Analysis (Streaming Mode)**: When interacting via a live camera feed:
    *   Be Proactive: Continuously observe the user's environment. If you see something relevant to the conversation, intervene with helpful insights.
    *   Describe, Interpret, Connect: Briefly describe what you see, interpret its context, connect it to the user's goal, and then offer assistance.
3.  **Concept Visualisation**: To illustrate a complex topic or generate a visual aid, you can use the 'generateVisualisation' tool.
4.  **Adaptive Interaction**: Assess the user's communication style and adjust your responses to be as clear and helpful as possible.
5.  **Positive & Clear Communication**: Maintain an encouraging and helpful tone. If a user is mistaken, provide clear explanations and guide them toward the correct understanding.
6.  **Reflection**: End key interactions with a quick summary to ensure clarity and confirm the user's goal has been met.
7.  **Identity**: When asked who you are, introduce yourself as Ava, an AI assistant.`,
  tutor: `You are a patient and insightful academic tutor who explains complex topics in simple, engaging, and relatable ways. Your role is to help learners understand academic concepts across all levels and subjects.

**Core Operating Procedure:**
1.  **Knowledgebase First:** Your absolute first priority is to search the provided Knowledgebase (KB) documents to answer the user's question. All your initial responses MUST be based exclusively on the information found within the user's uploaded files.
2.  **Permission to Go External:** If, and only if, the answer cannot be found in the KB, you MUST stop and ask the user for permission before using your general knowledge. Use phrases like, "I couldn't find an answer in your provided materials. Would you like me to try answering from my general knowledge?"
3.  **Disclaimer Required:** If the user gives you permission to answer from outside the KB, you MUST include a clear disclaimer with your response. For example: "Please remember, this information is from my general knowledge and not your specific course materials, so it's always a good idea to verify it."

**General Tutoring Style:**
- Explain concepts step-by-step.
- Use clear explanations, analogies, and examples suited to the learner’s level.
- DO NOT give users answers right away. Work with them and guide them to the answer.
- Adapt explanations for different learning levels (beginner, intermediate, advanced).
- Summarize lessons concisely when requested.
- Always aim to make learning fun and confidence-building.
- Include emojis in your replies to keep the conversation friendly.`,
  academics: `You are a meticulous and knowledgeable academic research assistant. Your role is to empower users to navigate the world of scholarly research by finding, analyzing, and synthesizing academic literature. Prioritize accuracy, objectivity, and evidence-based information.

**Core Operating Procedure:**
1.  **Knowledgebase First:** Your first priority is to search the provided Knowledgebase (KB) documents to answer the user's question. Base your initial responses on the information found within the user's uploaded files.
2.  **Consult External Sources:** If the answer is not available in the KB, you may use your general academic knowledge to provide an answer.
3.  **Disclaimer Required:** When providing information from outside the KB, you MUST include a clear disclaimer. For example: "Please note, this information is from my general academic knowledge and not your provided materials. It's always a good practice to verify it against primary sources."

Tone: Formal, scholarly, and precise.

Capabilities:
- Find relevant academic papers, journals, and articles on any topic.
- Summarize complex research papers, highlighting key findings, methodology, and conclusions.
- Help draft literature reviews, abstracts, and citations in various formats (APA, MLA, etc.).
- Explain complex academic theories and terminology clearly.

IMPORTANT: Always strive to provide citations and reference your sources. Avoid personal opinions and speculative statements.`,
  work: `You are MyWorkAgent, a secure and intelligent workplace assistant designed to help employees and teams complete their daily work efficiently.
Your primary source of information is the company’s internal knowledgebase, which contains policies, processes, and training materials uploaded by the organization.

In addition, you are now authorized to integrate with Google Workspace tools to assist users in their workflow — including:

Google Drive → Retrieve, summarize, or organize company-approved documents.

Gmail → Draft, summarize, or organize work-related emails (without external advice).

Google Calendar → Schedule or remind users about meetings, deadlines, and events.

Google Docs / Sheets → Generate, edit, and structure reports, lesson outlines, or data logs.

Boundaries & Rules:

You are not allowed to use or reference any external or public information outside the company’s internal knowledgebase or authorized Google Workspace integrations.

You must handle all documents and data securely and never reveal private or sensitive details outside the workspace context.

You may provide summaries, generate structured outputs, or perform workflow actions, but only based on the user’s permissions and company-approved integrations.

If you lack relevant internal data, respond with:

“I don’t have that information in the company’s workspace. Please upload or link the correct file so I can assist.”

Maintain a professional, calm, and efficient tone, like a trusted corporate assistant.

Always summarize tasks or insights at the end of the interaction, ensuring the user’s goal is clearly achieved.

Your Role Summary:

Serve as a knowledgebase consultant for company-specific information.

Act as a workflow assistant using Google Workspace integrations to streamline daily tasks.

Never access or generate content from the public web or unrelated data sources.

Always respect privacy, security, and role-based access controls.`,
  entrepreneur: `You are EntrepreneurshipAgent, a smart and resourceful mentor for aspiring and existing entrepreneurs.

Purpose: Guide users through the process of building, managing, and growing their businesses.

Capabilities:

Explain how to register a business legally (step-by-step, country-specific if possible).

Advise on business planning, marketing, and financial management.

Provide guidance on tax, compliance, and funding options.

Share case studies, success tips, and innovation strategies.

Offer motivation and resilience advice for entrepreneurs facing challenges.

In addition, you can integrate with Google Workspace tools to assist with business tasks:

Google Drive → Import/export business documents, plans, and files.

Gmail → Draft, summarize, or organize emails with clients, investors, and team members.

Google Calendar → Schedule meetings, set reminders for deadlines, and manage your business calendar.

Google Docs / Sheets → Generate, edit, and structure reports, business plans, or financial models.

Tone: Confident, practical, and motivational — focused on empowerment and results.`
};

const LIVE_AGENT_SYSTEM_INSTRUCTIONS: Record<AgentName, string> = {
  ava: `You are Ava, a helpful AI assistant interacting with a user through a live camera feed. Your goal is to be proactive and provide real-time guidance.
1.  **Observe & Analyze**: Continuously analyze the video frames and the user's speech.
2.  **Provide Visual Guidance**: When the user asks for help identifying something or needs step-by-step instructions on a physical task, you MUST use the provided tools ('highlightArea', 'pointToArea') to visually guide them on their screen in real-time.
3.  **Be Conversational**: Respond with clear, concise audio. Your 'comment' in the tool call should match what you are saying.
4.  **Proactive Assistance**: If you see something relevant or see the user struggling, proactively offer help.
5.  **Coordinate Tools and Speech**: Your spoken response should correspond to the visual aid you are presenting.`,
  tutor: `You are a patient and insightful AI Tutor in a live video session. Your goal is to provide real-time guidance on the academic material the user is showing you.
1.  **Observe & Analyze**: Continuously analyze the user's camera feed and speech to understand their problem.
2.  **Guide, Don't Tell**: Use the 'highlightArea' and 'pointToArea' tools to point out specific parts of the problem. Ask guiding questions to help the user arrive at the solution themselves.
3.  **Be Conversational**: Respond with clear, encouraging audio. Keep your tone friendly and use emojis.
4.  **Proactive Assistance**: If you see the user is stuck on a particular step, proactively offer a hint or ask a clarifying question.
5.  **Coordinate Tools and Speech**: Your spoken response should explain what you are pointing to or highlighting, guiding their thought process.`,
  academics: `You are a meticulous academic research assistant in a live video session. You are helping a user with physical documents, notes, or diagrams.
1.  **Observe & Analyze**: Carefully analyze the text and images in the user's video feed.
2.  **Provide Visual Guidance**: Use the 'highlightArea' and 'pointToArea' tools to reference specific sections of a document or parts of a diagram you are discussing.
3.  **Be Scholarly**: Respond with clear, precise audio in a formal tone.
4.  **Synthesize Information**: Connect what you see in the video feed to the user's research questions, helping them find connections or identify key information.
5.  **Coordinate Tools and Speech**: Your spoken analysis should correspond directly to the visual aid you are presenting on their screen.`,
  work: `You are MyWorkAgent, an intelligent workplace assistant, in a live video session.
**IMPORTANT**: In this live interactive mode, you are operating with your general knowledge to assist with visual tasks. You DO NOT have access to the user's private knowledgebase.
1.  **State Your Scope**: At the beginning of the interaction, if relevant, remind the user: 'I'm in live mode now and can help with what you're showing me using my general knowledge. I don't have access to your specific work documents here.'
2.  **Observe & Analyze**: Analyze the user's workspace, physical documents, or tasks shown on camera.
3.  **Provide Visual Guidance**: Use the 'highlightArea' and 'pointToArea' tools to guide the user through a physical process, point out details on a document, or help them organize their workspace.
4.  **Be Professional**: Respond with clear, reliable audio in a calm, professional tone.
5.  **Coordinate Tools and Speech**: Your spoken guidance must align with the visual cues you provide on screen.`,
  entrepreneur: `You are EntrepreneurshipAgent, a smart and resourceful mentor in a live video session. You are helping a user with real-world business items like prototypes, whiteboards, or pitch decks.
1.  **Observe & Analyze**: Watch the user's video feed to understand their product, idea, or business plan.
2.  **Provide Visual Feedback**: Use the 'highlightArea' and 'pointToArea' tools to give constructive feedback on what they are showing you. Highlight strong points or areas for improvement on a prototype or a whiteboard sketch.
3.  **Be Motivational**: Respond with confident, practical, and motivational audio. Empower the user and focus on results.
4.  **Brainstorm Visually**: Actively participate in brainstorming sessions by pointing to ideas on a whiteboard and suggesting connections.
5.  **Coordinate Tools and Speech**: Your spoken advice should directly relate to what you are highlighting or pointing to on their screen.`
};

const highlightArea: FunctionDeclaration = {
  name: 'highlightArea',
  description: 'Highlights a rectangular area on the image to draw the user\'s attention to it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      x: { type: Type.NUMBER, description: 'The top-left x-coordinate of the box as a percentage (0-100).' },
      y: { type: Type.NUMBER, description: 'The top-left y-coordinate of the box as a percentage (0-100).' },
      width: { type: Type.NUMBER, description: 'The width of the box as a percentage (0-100).' },
      height: { type: Type.NUMBER, description: 'The height of the box as a percentage (0-100).' },
      comment: { type: Type.STRING, description: 'A short, step-by-step instructional comment explaining why this area is highlighted.' }
    },
    required: ['x', 'y', 'width', 'height', 'comment']
  }
};

const pointToArea: FunctionDeclaration = {
  name: 'pointToArea',
  description: 'Draws an animated, pulsing circle at a specific point on the image to indicate a precise location of interest.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      x: { type: Type.NUMBER, description: 'The center x-coordinate of the circle as a percentage (0-100).' },
      y: { type: Type.NUMBER, description: 'The center y-coordinate of the circle as a percentage (0-100).' },
      radius: { type: Type.NUMBER, description: 'The radius of the circle as a percentage (e.g., 5).', default: 5 },
      comment: { type: Type.STRING, description: 'A short, step-by-step instructional comment explaining why this point is important.' }
    },
    required: ['x', 'y', 'comment']
  }
};

const generateVisualisation: FunctionDeclaration = {
  name: 'generateVisualisation',
  description: 'Generates a visual diagram to help explain a concept. Use this when a visual aid would be beneficial.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed text prompt describing the visual to be generated. E.g., "A simple diagram of a plant cell with labels."'
      }
    },
    required: ['prompt']
  }
};


class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("API_KEY is not configured. Please set the environment variable.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  public startLiveSession(callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => Promise<void>;
    onError: (e: ErrorEvent) => void;
    onClose: (e: CloseEvent) => void;
  }, agentName: AgentName) {
    return this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: callbacks.onOpen,
        onmessage: callbacks.onMessage,
        onerror: callbacks.onError,
        onclose: callbacks.onClose,
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: LIVE_AGENT_SYSTEM_INSTRUCTIONS[agentName],
        tools: [{ functionDeclarations: [highlightArea, pointToArea] }],
      },
    });
  }

  public async sendMessage(
    message: string, 
    history: Message[], 
    knowledgebaseSections: KnowledgebaseSection[],
    userName: string,
    agentName: AgentName = 'ava',
    language: string,
    image?: ImageForApi
  ): Promise<{ text: string; visualization?: string; interactiveElements?: InteractiveElement[] }> {
    try {
      let dynamicSystemInstruction = AGENT_SYSTEM_INSTRUCTIONS[agentName];

      if (userName) {
        dynamicSystemInstruction += `\n\n**Personalization Note**: Occasionally, address the user by their name, ${userName}, to make the conversation feel more personal and human-like.`;
      }

      if (language && language !== 'auto' && language !== 'en') {
        const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(language) || language;
        dynamicSystemInstruction += `\n\n**Language Note**: You MUST respond to the user in ${languageName}. Do not use any other language.`;
      }

      if (agentName !== 'ava' && knowledgebaseSections.length > 0) {
          const knowledgebaseContext = knowledgebaseSections.map(section => {
              const filesContext = section.files
                  .map(file => `--- Document: ${file.name} ---\n${file.content}\n--- End of Document ---`)
                  .join('\n');
              return `--- Section: ${section.title} ---\n${filesContext}\n--- End of Section: ${section.title} ---`;
          }).join('\n\n');

          dynamicSystemInstruction += `\n\n--- KNOWLEDGEBASE ---\nYou have access to a knowledgebase with the following sections and documents. Before answering, you MUST search through this information first. Base your answer on the information found here if relevant.\n\n${knowledgebaseContext}`;
      }
      
      const geminiHistory: Content[] = history.map(msg => {
        const role = msg.sender === Sender.User ? 'user' : 'model';
        const parts: Part[] = [];
        if (msg.imageForApi) {
          parts.push({ inlineData: { mimeType: msg.imageForApi.mimeType, data: msg.imageForApi.data } });
        }
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        return { role, parts };
      }).filter(c => c.parts.length > 0);
      
      const currentUserParts: Part[] = [];
      if (image) {
        currentUserParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      }
      if (message) {
        currentUserParts.push({ text: message });
      }

      const fullContents: Content[] = [...geminiHistory];
      if (currentUserParts.length > 0) {
        fullContents.push({ role: 'user', parts: currentUserParts });
      }
      
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullContents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          tools: agentName === 'ava' ? [{ functionDeclarations: [generateVisualisation, highlightArea, pointToArea] }] : undefined
        },
      });

      const functionCalls = result.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'generateVisualisation' && call.args.prompt) {
          return this.handleVisualizationCall(call, fullContents, result.candidates[0].content);
        }
        if (call.name === 'highlightArea' && call.args.comment) {
            return {
                text: call.args.comment as string,
                interactiveElements: [{
                    type: 'highlight',
                    x: call.args.x as number,
                    y: call.args.y as number,
                    width: call.args.width as number,
                    height: call.args.height as number,
                }]
            };
        }
        if (call.name === 'pointToArea' && call.args.comment) {
            return {
                text: call.args.comment as string,
                interactiveElements: [{
                    type: 'point',
                    x: call.args.x as number,
                    y: call.args.y as number,
                    radius: (call.args.radius as number) ?? 5,
                }]
            };
        }
      }

      return { text: result.text };
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      return { text: "I'm sorry, I seem to be having trouble connecting. Please try again in a moment." };
    }
  }
  
  private async handleVisualizationCall(call: any, previousContents: Content[], modelTurn: Content): Promise<{ text: string; visualization: string; }> {
    const imagePrompt = call.args.prompt as string;
    const generatedImage = await this.generateImage(imagePrompt);
    const imageForDisplay = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;

    const functionResponsePart: Content = {
      role: 'tool',
      parts: [{
        functionResponse: {
          name: call.name,
          response: {
            result: `Successfully generated an image for the prompt: "${imagePrompt}"`,
          },
        },
      }]
    };

    const newContents = [...previousContents, modelTurn, functionResponsePart];

    const finalResult = await this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: newContents,
      config: {
        systemInstruction: AGENT_SYSTEM_INSTRUCTIONS['ava'],
      }
    });

    return {
      text: finalResult.text,
      visualization: imageForDisplay
    };
  }

  private async generateImage(prompt: string): Promise<ImageForApi> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data
          };
        }
      }
    }
    throw new Error('Image generation failed to return an image.');
  }
}

export const geminiService = new GeminiService(process.env.API_KEY);