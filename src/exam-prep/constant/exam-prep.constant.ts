import { SelectedTopics } from '../dto/exam-prep.input';
import { ExamPrepConfigDocument } from '../entity/exam-prep.config.entity';
import ShortUniqueId from 'short-unique-id';

export const learnPathAIPrompt = (configData: ExamPrepConfigDocument) => {
  const {
    examCurriculumContent,
    examDate,
    examName,
    examKnowledgeLevel,
    examQuestionContent,
    sampleQuestions,
    configUUID,
    userUUID,
  } = configData;

  // Provide 5 multiple-choice questions and 2 short-answer questions per subtopic based on the current provided user knowledge level on the exam type. the provided current user knowledge level is ${examKnowledgeLevel}, adjusting difficulty based on the learning phase.
  // Also note that the generated questions can be mixed. either true/false, single anser selection, multi-choice questions, and can also be essay.

  return `
    1. Please generate an exam learning path for a medical student preparing for the following: ${examName} exam. The generated topics and subject should be High-Yield Topics that is based on the person current knowledge level which is as follows: ${examKnowledgeLevel}. 
    2. Use the following: ${examCurriculumContent} curriculum if it is not empty or null to generate the learning path for the user. \
    3. For each subject, break down the key topics and subtopics, and include checkpoints for assessing progress. 
    4. If ${examCurriculumContent} is empty, use the entered exam name to generate the subjects, break down the key topics and subtopics, and include checkpoints for assessing progress.
    5. Use the following provided exam date: ${examDate} as a guide for assigning durations and personalize the learning path based on the difficulty of each subject or topic. Note, the total duration shouldn't exceed the provided exam date.
    6. If the provided sample questions: ${sampleQuestions} is not empty, use it as a guide in generating questions.
    7. Ensure that the generated learning path covers all topics related to the provided exam type and simutes the real world curriculum for the given exam type.
    8. Below is just an example of how the learning path should be structured:

        Here's a personalized learning path for the USMLE, including study topics and practice questions. The USMLE is divided into three steps, so the learning path is organized accordingly.

        Step 1: Basic Sciences

        1. Foundation (1 month)
        Topics:
            -Cellular Biology
            -Molecular Biology
            -Genetics
            -Biochemistry
        Questions(Note: this is outlining areas the user should practices questions and answers on. and alsom include links or suggested website that can guide or help them practice):
            -Review basic concepts with 10-15 questions per day from resources like UWorld or Kaplan.
        2. Organ Systems Approach (3 months)
        Topics:
            -Cardiovascular System
            -Respiratory System
            -Renal System
            -Gastrointestinal System
            -Endocrine System
            -Reproductive System
            -Nervous System
            -Musculoskeletal System
            -Hematologic and Lymphoreticular System
            -Skin and Connective Tissue
        Questions(Note: this is outlining areas the user should practices questions and answers on. and alsom include links or suggested website that can guide or help them practice):
            -Daily practice of 20-25 questions focusing on the system studied.
            -Review explanations and understand wrong answers.
        
        Step 2: 

        Step 3: 

    8. Strictly ensure not to include unecessary charachers such as ${'```json ```'} on the response or returned result and also not add any additional information before and after the result as shown below.
    9. Please ensure that you return the output strictly in string format as follows without using code block formatting:
        below is an example of how the output should look like. It should be a string in a markdown format
        
        Here's a personalized learning path for the USMLE, including study topics and practice questions. The USMLE is divided into three steps, so the learning path is organized accordingly.

        Step 1: Basic Sciences

        Duration: 6-8 months
        1. Foundation (1 month)
        Topics:
            -Cellular Biology
            -Molecular Biology
            -Genetics
            -Biochemistry
        Questions(Note: this is outlining areas the user should practices questions and answers on. and alsom include links or suggested website that can guide or help them practice):
            -Review basic concepts with 10-15 questions per day from resources like UWorld or Kaplan.
        2. Organ Systems Approach (3 months)
        Topics:
            -Cardiovascular System
            -Respiratory System
            -Renal System
            -Gastrointestinal System
            -Endocrine System
            -Reproductive System
            -Nervous System
            -Musculoskeletal System
            -Hematologic and Lymphoreticular System
            -Skin and Connective Tissue
        Questions(Note: this is outlining areas the user should practices questions and answers on. and alsom include links or suggested website that can guide or help them practice):
            -Daily practice of 20-25 questions focusing on the system studied.
            -Review explanations and understand wrong answers.
        
        Assessing Progress:

    `;
};

export const generateQuestionsPrompt = (limit: number) => {
  return `
        Strictly use the following steps to generate medical student real world exam questions from the generated learning path.

        Step 1: Use the following user provided limit in tripple qoute """${limit}""" to generate number of questions that simulates real world exam questions from the exam type on the learning path. If no limit is provided, generate 1000 questions that simulates real world exams for the provided exam name. 

        Step 2: The generated questions should cover all sections, topics and subtopics that aligns with the exam type.

        Step 3: The generated questions should Include a mixture of """easy""", """Short-form open-ended questions""", """long-form open-ended questions""", """single answer question""", """multi answer questions""", """true/false questions""",  """single-best-answer""", """multiple-choice questions (MCQs)""" with distractors that are plausible but incorrect
        
        Step 4: Strictly ensure not to include unecessary charachers such as ${'```json ```'} on the response or returned result and also not add any additional information before and after the result as shown below.
        
        Step 5: Please ensure that you return the output strictly in JSON format as follows without using code block formatting:
    {
        "title": "The heading, which is the exam name",
        "questions":[{
            "type": "Type of question if multi-choice, true/false, single select, etc.",
            "subject": "The subject area the question is coming from",
            "topic": "The topic the question falls under",
            "subtopic: "The subtopic the question falls under. that is, if there was any subtopic on that topic from the learning path that was initially generated",
            "answer": ["The correct answer/answers to the question should be here"],
            "question": "the generated question",
            "options": ["the options to the question"],
            "level": "Difficulty level of the question. example: Beginner, Intermidate, Advance",
            "completion time: "Expected time to complete the question. example: 00:10:00"
        }],
    }   
    `;
};

export const generatQuestionsAIPrompt = (
  titlesToSelectFrom: SelectedTopics,
  answeredQuestions: any,
) => {
  return `
      1. From the created learning path craft questions that reflect the difficulty and style of the exam. Include single-best-answer multiple-choice questions (MCQs) with distractors that are plausible but incorrect.
      2. Create complex, multi-step questions that require integration of information across disciplines and covers all topics and subtopics. But be sure that the generated questions are adaptive and based on the current knowledge level of the user. And as the user progresses by answering questions, keep generating more questions and advancing the difficulty level.
      3. Allocate time in hours or minutes or seconds to the question, based on the difficulty level of the question.
      4. Use the following Already answered questions by the user ${answeredQuestions} if not empty to create an adaptive flow for generating more questions upon request. Repeat failed questions from previous answered questions.
  
      5. Strictly ensure not to include unecessary charachers such as ${'```json ```'} on the response or returned result and also not add any additional information before and after the result as shown below.
      6. Please ensure that you return the output strictly in JSON format as follows without using code block formatting:
      {
        "description": "A brief description of the prompt",
          "title": "The heading, which is the exam name",
          "questions":[{
              "type": "Type of question if multi-choice, true/false, single select, etc.",
              "subject": "The subject area the question is coming from",
              "topic": "The topic the question falls under",
              "subtopic: "The subtopic the question falls under. that is, if there was any subtopic on that topic from the learning path that was initially generated",
              "answer": ["The correct answer/answers to the question should be here"],
              "question": "the generated question",
              "options": ["the options to the question"]
          }],
  },
      7. Be sure to generate as much questions that covers all the selected topics from the user as provided below. If no topic/topics are provided, generate quesions that covers all the topics and their subtopics.
      provided titles: ${titlesToSelectFrom}
      
      `;

  // "questionId: "use ShortUniqueId library to generate unique ID's for the questions",
};
