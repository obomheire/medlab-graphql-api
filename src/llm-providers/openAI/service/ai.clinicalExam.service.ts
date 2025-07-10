import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AsstThreadService } from './ai.thread.service';
import { assistants, caseFiles } from '../constant/assistant.constant';
import {
  GenderType,
  ClinicalExamPromptType,
  CaseType,
} from 'src/clinicalExam/enum/clinicalExam.enum';
import { SpeechAIService } from './ai.speech.service';
import { isValidJSON } from 'src/utilities/service/helpers.service';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { AIFeedbackInput, AIgradingInput } from '../dto/clinicalExam.input';
import { ConversationService } from 'src/clinicalExam/service/conversation.service';
import {
  ConversationDocument,
  ConversationEntity,
} from 'src/clinicalExam/entity/conversation.entity';
import { ComponentType } from '../enum/assistantAI.enum';
import { UserDocument } from 'src/user/entity/user.entity';
import { PractCaseCatService } from 'src/clinicalExam/service/practCaseCat.service';

@Injectable()
export class ClinicalExamAIService {
  private readonly openai: OpenAI;
  private readonly clinicalExamAssistantId: string;

  constructor(
    private configService: ConfigService,
    private readonly asstThreadService: AsstThreadService,
    private readonly speechAIservice: SpeechAIService,
    private readonly conversationService: ConversationService,
    private readonly practCaseCatService: PractCaseCatService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.clinicalExamAssistantId = assistants.CLINICAL_EXAM_ASSISTANT_ID;
  }

  // Submit presentation for short case
  async submitPresentation(
    user: UserDocument,
    practCaseCatUUID: string,
    file: FileUpload,
  ) {
    try {
      const { _id, caseType } = await this.practCaseCatService.getPractCaseCat(
        practCaseCatUUID,
      );

      if (caseType !== CaseType.SHORT_CASE) {
        throw new BadRequestException(
          'The practCaseCatUUID is not a short case',
        );
      }

      const transcript = await this.asstThreadService.transcribeFileGroqAI(
        file,
      );

      const payload: ConversationEntity = {
        userId: user._id,
        transcript,
        practCaseCatId: _id,
      };

      const { conversationUUID } =
        await this.conversationService.createConversation(payload);

      return {
        conversationUUID,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI grading
  async getAIgrading(user: UserDocument, aiGradingInput: AIgradingInput) {
    try {
      const { caseType, caseNo, conversationUUID, isTrial } = aiGradingInput;

      const conversation = await this.conversationService.getConversation(
        conversationUUID,
      ); // Get conversation

      const practCaseCatUUID = conversation.practCaseCatId.practCaseCatUUID;

      if (caseType === CaseType.SHORT_CASE) {
        if (conversation.practCaseCatId.caseType !== CaseType.SHORT_CASE) {
          throw new BadRequestException(
            'CaseType and Conversation caseType do not match',
          );
        }

        return await this.getAIgradingSC(
          user,
          caseNo,
          conversation as unknown as ConversationDocument,
          practCaseCatUUID,
          isTrial,
        );
      }

      if (conversation.practCaseCatId.caseType !== CaseType.LONG_CASE) {
        throw new BadRequestException(
          'CaseType and Conversation caseType do not match',
        );
      }

      return await this.getAIgradingLC(
        user,
        caseNo,
        conversation as unknown as ConversationDocument,
        practCaseCatUUID,
        isTrial,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI grading short case
  async getAIgradingSC(
    user: UserDocument,
    caseNo: string,
    conversation: ConversationDocument,
    practCaseCatUUID: string,
    isTrial: boolean,
  ) {
    try {
      const caseName = `SHORT_CASE-${caseNo.replace(/\s+/g, '').toLowerCase()}`;

      const caseFileId = caseFiles[caseName];

      if (!caseFileId) {
        throw new BadRequestException('Invalid case number');
      }

      const gradingFileId = caseFiles['SHORT_CASE-grading'];

      if (!gradingFileId) {
        throw new BadRequestException('File not found');
      }

      // Add file to vector store
      const { vs_id }: any = await this.asstThreadService.createVSfiles(
        caseName,
        [caseFileId, gradingFileId],
      );

      const { threadId } = await this.asstThreadService.createThread(vs_id);

      const attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] =
        [
          { file_id: gradingFileId, tools: [{ type: 'file_search' }] },
          { file_id: caseFileId, tools: [{ type: 'file_search' }] },
        ];

      const prompt = this.getPrompt(
        ClinicalExamPromptType.AI_GRADING_SC,
        conversation?.transcript,
      );

      const { message } = await this.assistantMessage(
        user,
        threadId,
        prompt,
        attachments,
      );

      const grading = isValidJSON(message)
        ? JSON.parse(message)
        : await this.asstThreadService.getValidateJSON(message);

      const average = this.averageNumerators(grading); // Get average grading
      const aiGrading = {
        ...grading,
        techniques: 'n/a',
        accuracy: 'n/a',
        interaction: 'n/a',
        average,
      };

      if (isTrial && !user?.clinExSub?.isTrialLC) {
        user.clinExSub.tokenBalance = 0;
        user.clinExSub.topUpCredits = 0;
        user.clinExSub.isTrialSC = false;
      } else if (isTrial && user?.clinExSub?.isTrialLC) {
        user.clinExSub.isTrialSC = false;
      }

      conversation.aiGrading = aiGrading;
      conversation.threadId = threadId;
      await conversation.save();

      if (!user.completedSC.includes(practCaseCatUUID)) {
        user.completedSC.push(practCaseCatUUID);
      }

      user.markModified('clinExSub');
      await user.save();

      return { aiGrading, threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI grading long case
  async getAIgradingLC(
    user: UserDocument,
    caseNo: string,
    conversation: ConversationDocument,
    practCaseCatUUID: string,
    isTrial: boolean,
  ) {
    try {
      const caseName = `LONG_CASE-${caseNo.replace(/\s+/g, '').toLowerCase()}`; // Pick case detail file

      const caseFileId = caseFiles[caseName];

      if (!caseFileId) {
        throw new BadRequestException('Invalid case number');
      }

      const gradingFileId = caseFiles['LONG_CASE-grading'];

      if (!gradingFileId) {
        throw new BadRequestException('File not found');
      }

      // Add file to vector store
      const { vs_id }: any = await this.asstThreadService.createVSfiles(
        caseName,
        [caseFileId, gradingFileId],
      );

      const { threadId } = await this.asstThreadService.createThread(vs_id);

      const attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] =
        [
          { file_id: caseFileId, tools: [{ type: 'file_search' }] },
          { file_id: gradingFileId, tools: [{ type: 'file_search' }] },
        ];

      const prompt = this.getPrompt(
        ClinicalExamPromptType.AI_GRADING_LC,
        conversation?.transcript,
      );

      const { message } = await this.assistantMessage(
        user,
        threadId,
        prompt,
        attachments,
      );

      const grading = isValidJSON(message)
        ? JSON.parse(message)
        : await this.asstThreadService.getValidateJSON(message);

      const average = this.averageNumerators(grading);

      if (isTrial && !user?.clinExSub?.isTrialSC) {
        user.clinExSub.tokenBalance = 0;
        user.clinExSub.topUpCredits = 0;
        user.clinExSub.isTrialLC = false;
      } else if (isTrial && user?.clinExSub?.isTrialSC) {
        user.clinExSub.isTrialLC = false;
      }

      const aiGrading = { ...grading, average };

      conversation.aiGrading = aiGrading;
      conversation.threadId = threadId;
      await conversation.save();

      if (!user.completedLC.includes(practCaseCatUUID)) {
        user.completedLC.push(practCaseCatUUID);
      }

      user.markModified('clinExSub');
      await user.save();

      return { aiGrading, threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI grading
  async getAIfeedback(user: UserDocument, aIFeedbackInput: AIFeedbackInput) {
    try {
      const { conversationUUID, caseType, threadId } = aIFeedbackInput;

      const conversation = await this.conversationService.getConversation(
        conversationUUID,
      ); // Get conversation

      if (caseType === CaseType.SHORT_CASE) {
        if (conversation.practCaseCatId.caseType !== CaseType.SHORT_CASE) {
          throw new BadRequestException(
            'CaseType and Conversation caseType do not match',
          );
        }

        return await this.getAIfeedbackSC(
          user,
          threadId,
          conversation as unknown as ConversationDocument,
        );
      }

      if (conversation.practCaseCatId.caseType !== CaseType.LONG_CASE) {
        throw new BadRequestException(
          'CaseType and Conversation caseType do not match',
        );
      }

      return await this.getAIfeedbackLC(
        user,
        threadId,
        conversation as unknown as ConversationDocument,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI feedback short case
  async getAIfeedbackSC(
    user: UserDocument,
    threadId: string,
    conversation: ConversationDocument,
  ) {
    try {
      // const feedbackFileId =
      //   caseFiles['SHORT_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'];

      // if (!feedbackFileId) {
      //   throw new BadRequestException('File not found');
      // }

      // const attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] =
      //   [{ file_id: feedbackFileId, tools: [{ type: 'file_search' }] }];

      const prompt = this.getPrompt(ClinicalExamPromptType.AI_FEEDBACK_SC);

      const { message } = await this.assistantMessage(
        user,
        threadId,
        prompt,
        // attachments,
      );

      conversation.aiFeedback = message;
      await conversation.save();
      await user.save();

      return { aiFeedback: message, threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get AI feedback long case
  async getAIfeedbackLC(
    user: UserDocument,
    threadId: string,
    conversation: ConversationDocument,
  ) {
    try {
      // const feedbackFileId =
      //   caseFiles['LONG_CASE-AI-EXAMINERS-FEEDBACK-TEMPLATE'];

      // if (!feedbackFileId) {
      //   throw new BadRequestException('File not found');
      // }

      // const attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] =
      //   [{ file_id: feedbackFileId, tools: [{ type: 'file_search' }] }];

      const prompt = this.getPrompt(ClinicalExamPromptType.AI_FEEDBACK_LC);

      const { message } = await this.assistantMessage(
        user,
        threadId,
        prompt,
        // attachments,
      );

      conversation.aiFeedback = message;
      await conversation.save();
      await user.save();

      return { aiFeedback: message, threadId };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Voice conversation
  async voiceConversation(
    user: UserDocument,
    file: Express.Multer.File,
    gender: GenderType,
    threadId: string,
    attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[],
    promptType: ClinicalExamPromptType | null,
  ) {
    try {
      let transcript: string;

      if (file) {
        transcript = await this.asstThreadService.transcribeFileGroqAI(file);
      }

      const prompt = this.getPrompt(promptType, transcript);

      const { message } = await this.assistantMessage(
        user,
        threadId,
        prompt,
        attachments,
      );

      const speech = await this.speechAIservice.synthesizeSpeech(
        message,
        gender,
      );

      return {
        threadId,
        speech,
        promptType,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Assistant message
  async assistantMessage(
    user: UserDocument,
    threadId: string,
    prompt: string,
    attachments: OpenAI.Beta.Threads.Messages.MessageCreateParams.Attachment[] = [],
  ): Promise<{ message: string }> {
    try {
      // Create message
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: prompt,
        attachments,
      });

      // Run assistant
      const message: any = await this.asstThreadService.runAssistant(
        threadId,
        this.clinicalExamAssistantId,
        user,
        ComponentType.CLINICAL_EXAM,
      );

      if (!message) {
        throw new BadRequestException('System busy. Please try again later.');
      }

      await user.save();
      return { message: message?.content?.[0]?.text?.value };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get prompt for assistant AI
  getPrompt(promptType: ClinicalExamPromptType, prompt?: string): string {
    let promptMessage: string;

    switch (promptType) {
      case ClinicalExamPromptType.START_EXAM_BOT_LC:
      case ClinicalExamPromptType.START_EXAM_BOT_SC:
        promptMessage = `You are assigned the role of a **Physical Examination Assistant** with access to the **detailed Physical Examination Findings** of the patient.

      - This is a **simulated physical examination** since the candidate (doctor) is unable to perform a real physical exam virtually.
      - The doctor will talk through the sequence of the examination they want to perform **step by step**, and you will provide them with the corresponding physical examination findings.
      - A reference file containing the **patient’s Physical Examination Findings** has been uploaded. Use this file as your primary source of information.

      **Doctor's Request:**  
      "${prompt}"  

      **Instructions:**  
      - **Provide physical examination findings directly** without referencing the uploaded document i.e avoid phrases like "According to the uploaded document" in your response. 
      - **If the doctor asks for findings on areas like Hand or Back Examination that are not explicitly provided in the reference document, assume they are normal and state this in your response (e.g., "Hand examination is normal" or "Back examination is normal").**  
      - If the doctor makes a broad request (e.g., “I want to do a cardiovascular examination”), ask them to specify the exact aspect of the examination they want to perform.  
      - Indicate that you will provide **step-by-step findings** as they request specific parts of the physical examination.  
      - Use the **uploaded document** as a guide for the step-by-step examination while also applying your general knowledge of physical examinations.  
      - Ensure your responses align with **standard medical practices and clinical reasoning**.  
      - **Do not provide a direct diagnosis**; instead, guide the doctor through logical steps using the examination findings from the uploaded document.  
      - Maintain a **professional and concise** tone while assisting.`;
        break;

      case ClinicalExamPromptType.START_PATIENT_EXAMINATION:
        promptMessage = `You are acting as a **hospital patient** in a simulated medical examination.
      - A **reference file containing the Patient Storytelling** has been uploaded. This file includes details such as the patient's **profile, medical history, surgical history, and other relevant information**.
      - Use this file as your sole source of truth when responding to the doctor.  
      - Remain in character as a **real patient**, answering questions naturally based on the provided details.  

      **Doctor's Interaction:**  
      ${prompt}  

      **Instructions:**  
      - **explicitly provide response** without referencing the uploaded document i.e avoid phrases like "According to the uploaded document" in your response. 
      - Do **not** offer a diagnosis—only provide information relevant to the doctor's questions.  
      - Do **not** volunteer details unless explicitly asked.  
      - Respond realistically, mimicking a patient's knowledge level and communication style.  
      - Ensure consistency in your responses, aligning with the uploaded patient details.`;
        break;

      case ClinicalExamPromptType.SUBMIT_PRESENTATION:
        promptMessage = `
      **Simulated Clinical Assessment - Presentation Submission**  

      A doctor is participating in a simulated clinical assessment. They have reviewed a patient case, and the case details have been uploaded to you as a reference file. Based on this information, the doctor has prepared and submitted a presentation outlining their proposed treatment plan.  

      **Doctor's Presentation:**  
      - Below is the presentation submitted by the doctor:  
        ${prompt}  

      **Instructions:**  
      - The uploaded reference file contains the patient case details reviewed by the doctor.  
      - The doctor's presentation is expected to provide an analysis and a proposed treatment plan based on the case.  
      - Retain both the reference file and the doctor's presentation, as they will be used for grading the doctor's performance in a future evaluation request.  

      Please confirm once the submission has been successfully recorded.`;
        break;

      case ClinicalExamPromptType.EXAMINAL_1:
        promptMessage = `The Doctor has responded:  
      **"${prompt}"**  

      Ask the next question from the **Examiner 1 question list** in the uploaded file.

      **Instructions:**  
      - Continue sequentially through the list.  
      - Ensure your questions remain structured and relevant.  
      - Wait for the doctor's response before proceeding to the next question.`;
        break;

      case ClinicalExamPromptType.EXAMINAL_2:
        promptMessage = `The Doctor has responded:  
      **"${prompt}"**  

       Ask the next question from the **Examiner 2 question list** in the uploaded file.

      **Instructions:**  
      - Continue sequentially through the list.  
      - Ensure your questions remain structured and relevant.  
      - Wait for the doctor's response before proceeding to the next question.`;
        break;

      case ClinicalExamPromptType.START_EXAMINALS:
        promptMessage = `You are now acting as an **Examiner** in a clinical assessment.  

      - Begin the examination by asking the first relevant question based on the context of the case.  
      - Ask **only one question at a time** and wait for the Doctor’s response before proceeding.  
      - Your questions should logically guide the Doctor through a structured clinical reasoning process.  
      - Do not follow a predefined script—generate questions dynamically based on the Doctor’s answers.  
      - Maintain professionalism and clarity in your communication.`;
        break;

      case ClinicalExamPromptType.NEXT_QUESTION:
        promptMessage = `The Doctor has responded:  
      **"${prompt}"**  

      Now, based on the Doctor's response, generate the **next logical question** to continue the assessment.  

      **Instructions:**  
      - Ask **only one question at a time** and wait for the Doctor's response.  
      - Ensure your question is relevant, structured, and follows a logical sequence.  
      - Avoid repeating previously asked questions or skipping essential aspects of the evaluation.`;
        break;

      case ClinicalExamPromptType.AI_GRADING_LC:
        promptMessage = `
      You are an AI examiner responsible for grading a doctor's performance in a simulated RACP clinical exam. Your role is to assess the doctor’s ability to evaluate and manage a patient based on their interactions, responses, and provided case details.  

      **Available Resources:**  
      1. **Case Detail File Document: Provides an overview of the patient's condition has been uploaded for your reference. This document includes the patient’s profile, medical condition, and findings from the physical examination that the doctor is expected to review.
      2. **Assessment Criteria Document: **"RACP ADULT MEDICINE - CRITERIA FOR ASSESSMENT OF PERFORMANCE (LONG CASE)"** has been uploaded for your reference. This document outlines the official grading criteria and should be used as the primary reference for evaluation.
      3. Below is the candidate's **12-minute presentation**, **responses and discussions with Examiner 1 and Examiner 2 agents*
      **"${prompt}"**  
        
      **Grading Rules:**  
      - **You must base your grading solely on:**  
        1. The doctor’s **12-minute presentation**. If the doctor did not give a presentation to Examiner 1, deduct points accordingly**—do not assume they presented if no evidence is found.
        2. The doctor’s **responses and discussions with Examiner 1 and Examiner 2 agents**.   

      **Evaluation Criteria:**  
      Assess the doctor based on their overall performance, considering:  
      - **Diagnostic reasoning**  
      - **Clinical skills**  
      - **Patient communication**  
      - **Time management**  

      Grade the doctor on a scale of **1 to 6** (1 = lowest, 6 = highest) across the following competency areas:  

      **Assessment Breakdown:**  
      1. **Accuracy of History** (accOfHistory)  
      2. **Synthesis & Prioritisation of Clinical Problems** (synthesis)  
      3. **Understanding the Impact of the Illness on the Patient and Family** (understanding)  
      4. **Accuracy of Clinical Examination** (accOfExam)  
      5. **Development and Discussion of an Appropriate Management Plan** (development)
      6. Assessment feedback (feedback)
      7. Examiner 1 feedback (examiner1Feedback)
      8. Examiner 2  feedback (examiner2Feedback)

      **Instructions:**  
      - Refer strictly to the uploaded document **"RACP ADULT MEDICINE - CRITERIA FOR ASSESSMENT OF PERFORMANCE (LONG CASE)"** for grading criteria.
      - Provide a short, **professional feedback** addressed directly to the candidate**. Speak in second person, as if you are speaking face to face. Highlights strengths, areas for improvement, and suggestions for further development.

      **Output Format:**  
      Return the grading results in valid **JSON format**, following this structure:  

      {
        "accOfHistory": x/6,
        "synthesis": x/6,
        "understanding": x/6,
        "accOfExam": x/6,
        "development": x/6
        "feedback": string
        "examiner1Feedback": string
        "examiner2Feedback": string
      } 

      **Important:**  
      - **Do NOT include any extra text, additonal comments, explanations, or code block formatting.**  
      - **Only return a valid JSON output of the given structure.**`;
        break;

      case ClinicalExamPromptType.AI_FEEDBACK_LC:
        promptMessage = `You are an examiner responsible for providing a comprehensive performance feedback report to a Doctor who participated in the simulated RACP examination (Long Case).

        **Available Resources:**
        1. **Feedback Template Structure:** You must strictly follow the section headings and structure provided below. Do not omit or rearrange any part.
        2. **Grading Output:** A structured assessment of the candidate’s performance has already been completed in this thread. You must use the average of the grading numerators, rounded down to the nearest whole number (e.g., '3/6', '4/6', '4/6' → (3 + 4 + 4)/3 = 3.666... → **3**). If the final average score is **greater than 3**, the **Final Grade** is **Pass**; otherwise, it is **Fail**.

        **Required Structure (must match exactly and completely):**
 
        ## 1. Overall Grade & Commentary

        - **Final Grade**: (e.g., Pass, Fail)
        - **Summary of Overall Performance**:  
          Provide a concise narrative summarizing the candidate’s performance. Mention overall strengths and challenges, noting how the candidate’s presentation compared to the calibration case details.  
          _Example_:  
          > "Your presentation demonstrated strong clarity in history-taking, but the synthesis of clinical problems needs further refinement. Overall, you showed solid clinical knowledge; however, the impact on patient and family was not fully explored."

        ---

        ## 2. Strengths

        Provide personalized feedback for each marking domain. Leave a section blank if not applicable.

        - **Accuracy of History**:  
          _Example_:  
          > "You clearly outlined the patient's main problem and provided detailed background information, matching the uploaded case details exceptionally well."

        - **Accuracy of Clinical Examination**:  
          _Example_:  
          > "Your description of the physical examination was accurate and thorough, with appropriate reference to expected findings."

        - **Synthesis and Prioritisation of Clinical Problems**:  
          _Example_:  
          > "You effectively synthesized the clinical information, and your prioritization of problems was mostly consistent with the model problem list. Your introduction and assessment summary provided a cohesive overview of the case."

        - **Understanding the Impact on Patient and Family**:  
          _Example_:  
          > "Your discussion included a thoughtful consideration of the patient’s emotional and social challenges, aligning well with the expected standards."

        - **Development and Discussion of a Management Plan**:  
          _Example_:  
          > "The management plan you proposed was evidence-based and well-structured, reflecting current clinical guidelines."

        ---

        ## 3. Weaknesses/Areas for Improvement

        Highlight areas where the candidate’s performance was lacking. Include examples and suggestions:

        - **Accuracy of History**:  
          _Example_:  
          > "There were some omissions in the patient’s past medical history. Consider rephrasing your introduction to include key details such as previous illnesses and relevant medications. For instance, instead of 'The patient has a history of several conditions,' try 'The patient has a documented history of hypertension and diabetes, which are critical in understanding the current presentation.'"

        - **Accuracy of Clinical Examination**:  
          _Example_:  
          > "Some physical examination findings were under-reported. You might improve by explicitly stating findings such as 'No evidence of edema or cyanosis was noted during the examination,' ensuring that all expected examination points are covered."

        - **Synthesis and Prioritisation of Clinical Problems**:  
          _Example_:  
          > "Your problem list did not follow the prioritized order as per the calibration model. Consider restructuring the list so that the most critical issues are mentioned first. For example, rephrase the summary to start with 'Primary concerns include acute chest pain and dyspnea, followed by secondary issues such as minor electrolyte imbalances.'"

        - **Understanding the Impact on Patient and Family**:  
          _Example_:  
          > "The impact on the patient’s family was not adequately addressed. Enhance your discussion by incorporating social and financial considerations. For instance, 'The patient’s condition has significantly affected family dynamics, with notable financial strain due to ongoing medical expenses.'"

        - **Development and Discussion of a Management Plan**:  
          _Example_:  
          > "The management plan could be more detailed. Incorporate step-by-step strategies and clarify how you would monitor and adjust treatment. For instance, 'Begin with initiating ACE inhibitors, followed by regular monitoring of renal function and electrolyte levels, adjusting therapy based on response over the subsequent weeks.'"

        ---

        ## 4. Personalized Success Tips

        Offer targeted advice to help the candidate improve in their weak areas:

        - **Focused Study**:  
          Review core clinical guidelines, especially in areas where you missed key details. Revisit your case notes to ensure no critical history or examination points are omitted.

        - **Targeted Practice**:  
          Engage in mock exams and role-playing scenarios to practice integrating clinical data and formulating comprehensive management plans.

        - **Mentorship & Peer Feedback**:  
          Seek feedback from experienced clinicians or mentors on your presentation structure and content. Discuss alternative phrasing and ordering strategies.

        - **Structured Approach**:  
          Develop a checklist for your patient assessments to ensure that every domain, from history to management planning, is addressed in a systematic manner.

        - **Reflection & Goal Setting**:  
          Reflect on the feedback provided and set clear, measurable goals.  
          _Example_:  
          > "In my next session, I will ensure my problem list prioritizes acute issues first, as per the model provided."

        ---

        ## 5. Action Plan & Next Steps

        Conclude with a clear, step-by-step plan for improvement:

        ### Immediate Action Items:
        - Review the calibration case details and re-read the relevant clinical guidelines.
        - Practice rephrasing your introduction and summary based on the suggestions given.
        - Organize a mock session focusing specifically on the synthesis and prioritization of clinical problems.

        ### Long-term Strategies:
        - Schedule regular peer review sessions to discuss clinical cases and receive constructive feedback.
        - Develop a personalized checklist for future exams, ensuring a systematic approach to covering all domains.
        - Attend additional workshops or online courses that focus on advanced clinical reasoning and management planning.

         **Instructions:**
        - You must use the above markdown structure **exactly**. Each heading, subheading, and bullet point **must be included**, even if a section is left intentionally blank.
        - Base your feedback strictly on the candidate's 12-minute presentation and follow-up discussion with examiner 1 and examiner 2 as captured in the conversation thread.
        - Use observations and grading results to provide personalized, specific, constructive, and structured feedback under each section.
        - **Return only the feedback content in raw markdown format.**
        - **Do not** include introductory remarks, explanations, or wrap the output in code blocks.
`;
        break;

      case ClinicalExamPromptType.AI_GRADING_SC:
        promptMessage = `You are an examiner responsible for grading the Doctor’s performance in the simulated RACP examination.  

         **Available Resources:**  
      1. **Case Detail File Document: Provides an overview of the patient's condition has been uploaded for your reference. This document includes the patient’s profile, medical condition, and findings from the physical examination that the doctor is expected to review.
      2. **Assessment Criteria Document:** **"RACP ADULT MEDICINE-CRITERIA FOR ASSESSMENT OF PERFORMANCE (SHORT CASE)"** has been uploaded for your reference. This document outlines the official grading criteria.Use it as the primary guide for evaluating and grading the Doctor.
      3. Below is the candidate's **12-minute presentation**, ** with Examiner 1 and Examiner 2 ai assistant*
      **"${prompt}"**  

        **Grading Rules:**  
      - **You must base your grading solely on:**  
      1. The doctor’s **12-minute presentation**. If the doctor did not give a presentation to the examiners assistant, score them 0/6**. Do not assume they presented if no evidence is found.
      2. Evaluate the Doctor based on their entire interaction, including their **diagnostic reasoning, clinical skills, patient communication, and time management**.  
      3. Grade the Doctor in the following **competency areas**, on a scale of **1 to 6** (1 = lowest, 6 = highest):  
 
      **Assessment Breakdown**  
      1. Interpretation and Synthesis of Physical Findings (interpretation)
      2. Investigation / Management (investigation)
      3 Assessment feedback (feedback)
      4. Examiner 1 feedback (examiner1Feedback)
      5. Examiner 2  feedback (examiner2Feedback)

      **Instructions:**  
      - Refer strictly to the uploaded document for grading criteria.
      - Provide a short, **professional feedback** addressed directly to the candidate**. Speak in second person, as if you are speaking face to face. Highlights strengths, areas for improvement, and suggestions for further development.
      - Return the result **strictly in valid JSON format** with the following structure:  

      {
        "interpretation": x/6,
        "investigation": x/6
        "feedback": string
        "examiner1Feedback": string
        "examiner2Feedback": string
      }

      **Do not add any extra text, explanation, or code block formatting. Only return a valid JSON output.**`;
        break;

      case ClinicalExamPromptType.AI_FEEDBACK_SC:
        promptMessage = `You are an examiner responsible for providing a comprehensive performance feedback report to a Doctor who participated in the simulated RACP examination (Short Case).

        **Available Resources:**
        1. **Feedback Template Structure:** You must strictly follow the section headings and structure provided below. Do not omit or rearrange any part.
        2. **Grading Output:** A structured assessment of the candidate’s performance has already been completed in this thread. You must use the average of the grading numerators, rounded down to the nearest whole number (e.g., '3/6', '4/6', '4/6' → (3 + 4 + 4)/3 = 3.666... → **3**). If the final average score is **greater than 3**, the **Final Grade** is **Pass**; otherwise, it is **Fail**.

        **Required Structure (must match exactly and completely):**

        # Examiners Feedback

        ## 1. Overall Grade & Commentary

        - **Final Grade**: (e.g., Pass, Fail) — *Pass is a score of >= 4*
        - **Summary of Overall Performance**:  
          Provide a concise narrative summarizing the candidate’s performance during the short case. Mention the candidate’s overall strengths and challenges, making comparisons with the uploaded case details and expected outcomes.  
          _Example_:  
          > "Your short case demonstrated clear physical examination findings and logical integration of these into a clinical narrative. However, the discussion on investigations and management strategies could be further refined to fully align with expected standards."

        ---

        ## 2. Strengths

        Provide personalized feedback under each key domain of the short case marking scheme. Leave a section blank if not applicable.

        - **Accuracy of Findings**:  
          _Example_:  
          > "You accurately reported the physical examination findings as outlined in the case details. Your observations were clear and matched the expected data."

        - **Interpretation and Synthesis of Findings**:  
          _Example_:  
          > "You effectively integrated the findings into a coherent clinical narrative, demonstrating solid clinical reasoning and synthesis of the examination data."

        - **Investigation/Management**:  
          _Example_:  
          > "Your discussion of potential investigations and management strategies was appropriate and based on current clinical guidelines. You provided clear rationale for the chosen approaches."

        ---

        ## 3. Weaknesses/Areas for Improvement

        Identify areas where the candidate’s performance could be improved, referencing specific examples and offering actionable suggestions:

        - **Accuracy of Findings**:  
          _Example_:  
          > "Some minor details in the physical exam were overlooked. Ensure that every finding is explicitly stated. For instance, instead of general statements, include specifics such as 'The patient exhibited no abnormal heart sounds upon auscultation.'"

        - **Interpretation and Synthesis of Findings**:  
          _Example_:  
          > "The integration of findings could be more cohesive. Consider rephrasing your summary to directly connect individual observations into a clear clinical picture. For example, 'The absence of abnormal lung sounds combined with a normal oxygen saturation suggests a low likelihood of pulmonary pathology in this context.'"

        - **Investigation/Management**:  
          _Example_:  
          > "Your recommendations for investigations and management were generally sound but lacked detail in certain areas. Enhance this section by elaborating on why specific tests or treatments are chosen. For instance, 'Based on the physical findings, ordering a chest X-ray is recommended to rule out subtle infiltrates, and if positive, consider antibiotic therapy guided by current protocols.'"

        ---

        ## 4. Personalized Success Tips

        Offer targeted advice to help the candidate improve in their weak areas:

        - **Focused Study**:  
          Review key clinical guidelines related to the short case findings and recommended investigations or management strategies.

        - **Targeted Practice**:  
          Engage in practice sessions or role-playing scenarios focusing on refining the synthesis of examination findings and the articulation of investigation/management plans.

        - **Mentorship & Peer Feedback**:  
          Seek feedback from experienced clinicians or peers to gain insights into how to better connect examination data with clinical reasoning.

        - **Structured Approach**:  
          Develop a checklist to ensure all relevant physical findings are recorded and systematically integrated into your clinical narrative.

        - **Reflection & Goal Setting**:  
          Reflect on the feedback provided and set clear, measurable goals for future sessions, such as improving the detail and coherence in your management plan discussions.

        ---

        ## 5. Action Plan & Next Steps

        Conclude with clear, actionable steps for the candidate to address identified weaknesses:

        ### Immediate Action Items:
        - Review the calibration case details and compare them with your recorded findings.
        - Practice rephrasing and expanding your summary to enhance the integration of exam findings.
        - Revisit clinical guidelines to refine your approach to recommending investigations and management strategies.

        ### Long-term Strategies:
        - Schedule regular practice sessions with peer reviews focused on the short case format.
        - Develop a structured checklist for patient examination to ensure comprehensive reporting.
        - Attend workshops or training sessions that focus on advanced clinical reasoning and effective communication of management plans.

         **Instructions:**
        - You must use the above markdown structure **exactly**. Each heading, subheading, and bullet point **must be included**, even if a section is left intentionally blank.
        - Base your feedback strictly on the candidate's 12-minute presentation and follow-up discussion as captured in the conversation thread.
        - Use observations and grading results to provide personalized, specific, constructive, and structured feedback under each section.
        - **Return only the feedback content in raw markdown format.**
        - **Do not** include introductory remarks, explanations, or wrap the output in code blocks.
`;
        break;

      default:
        promptMessage = prompt;
        break;
    }

    return promptMessage;
  }

  // Get average score to the nearest whole number
  averageNumerators(grading: Record<string, string>): number {
    const excludedKeys = ['feedback', 'examiner1Feedback', 'examiner2Feedback'];

    const formatGrading = Object.fromEntries(
      Object.entries(grading).filter(([key]) => !excludedKeys.includes(key)),
    ) as Record<string, string>;

    const values = Object.values(formatGrading) as string[];
    const sum = values.reduce(
      (total, val) => total + Number(val.split('/')[0]),
      0,
    );

    // return Math.round(sum / values.length); // Round to the nearest whole number
    return Math.floor(sum / values.length); // Round down to the nearest whole number.
  }
}
