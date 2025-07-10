/* eslint-disable prettier/prettier */
export const pygrdDxQuestPrompt = (payload: any) => {
  const { condition, specialty, category, subspecialty, questionPerCondition } =
    payload;

  return `
  Strictly follow the instructions below to generate open-ended questions focused on differential diagnoses:

 
  1. Use the provided content to generate the questions. If certain information (like diagnosis or condition specifics) is missing, use your medical knowledge to fill in the gaps with reasonable assumptions.
  2. Ensure that every generated question specifically asks for exactly 4 differential diagnoses.
  3. In the answer section, list 4 common differential diagnoses. In the answer details section, provide additional reasoning, expanding to as many as 10 diagnoses with detailed explanations for each.
  4. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic. 
  5. Include both direct concept-based questions and clinical vignette scenarios that emphasize the process of arriving at differential diagnoses.
  6. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
  7. Ensure the output includes a mix of straightforward questions requiring simple answers, as well as more complex clinical vignettes requiring detailed responses. Balance the difficulty evenly across Beginner, Intermediate, and Advanced levels (e.g., 1 Beginner, 1 Intermediate, 1 Advanced for every 3 questions).
  8. Generate exactly ${questionPerCondition} questions per request without repetition.
  9. Do not include unnecessary characters such as ${'```json ```'} in the response.
  10. Return the output strictly in JSON format without any extra formatting, comments, or code blocks.
  11. The generated response should follow this format:
  {
  "description": "A brief description of the prompt",
  "data": [
      {
          "question": "Provide a differential diagnosis question related to the given condition",
          "answer": "List exactly 4 common possible differential diagnoses.",
          "answer_details": "Provide a detailed explanation for up to 10 differential diagnoses, including reasoning for each.",
           "category": "${category} || "If not provided, use your knowlegde to specify the category"}",
          "subcategory": "${
            subspecialty ||
            'If not provided, use your knowlegde to specify the subcategory'
          }",
          "system": "fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
          "topic": "fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
          "subtopic": "fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
          "subject: "${subspecialty} || If not provided, use your knowledge on the provided category to fill it",
          specialty: "${specialty} || use your knowledge on the question to fill in the specialty",
          subspecialty: "${subspecialty} || use your knowledge on the question to fill in the subspecialty",
          "level": "Specify the difficulty level (Beginner, Intermediate, Advanced)."
      }
  ]
}

  Provided content:
  specialty: ${specialty}
  subspecialty: ${subspecialty}
  condition: ${condition || 'Signs, Symptoms, and Investigation'}
  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  }
  `;
};

export const pygrdDxQuestuserPrompt = (payload: any) => {
  const {
    condition,
    specialty,
    subspecialty,
    prompt,
    category,
    questionPerCondition,
  } = payload;
  const lowerCase = category.toLowerCase();

  return `
  Strictly follow the instructions on the below prompt to generate open-ended questions:

  1. Prompt: ${prompt}.
  2. In the answer section, list 4 common differential diagnoses. In the answer details section, provide additional reasoning, expanding to as many as 10 diagnoses with detailed explanations for each.
  3. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
  4. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic. 
  5. Ensure the output includes a mix of straightforward questions requiring simple answers, as well as more complex clinical vignettes requiring detailed responses. Balance the difficulty evenly across Beginner, Intermediate, and Advanced levels (e.g., 1 Beginner, 1 Intermediate, 1 Advanced for every 3 questions).
  6. Generate exactly ${questionPerCondition} questions per request without repetition.
  7. Do not include unnecessary characters such as ${'```json ```'} in the response.
  8. Return the output strictly in JSON format without any extra formatting, comments, or code blocks.
  9. The generated response should follow this format:
  
  {
  "description": "A brief description of the prompt",
  "data":[
      {
          "question": "Provide a differential diagnosis question related to the given condition",
          "answer": "List exactly 4 common possible differential diagnoses.",
          "answer_details": "Provide a detailed explanation for up to 10 differential diagnoses, including reasoning for each.",
          "category": "${category} || "If not provided, use your knowlegde to specify the category"}",
          "subcategory": "${
            subspecialty ||
            'If not provided, use your knowlegde to specify the subcategory'
          }",
          "system": "fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
          "topic": "fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
          "subtopic": "fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
          "subject: "${subspecialty} || If not provided, use your knowledge on the provided category to fill it",
          specialty: "${specialty} || use your knowledge on the question to fill in the specialty",
          subspecialty: "${subspecialty} || use your knowledge on the question to fill in the subspecialty",
          "level": "Specify the difficulty level (Beginner, Intermediate, Advanced)."
      }
  ]
}

  Provided content:
  specialty: ${specialty}
  subspecialty: ${subspecialty}
  condition: ${condition || 'Signs, Symptoms, and Investigation'}
  "Provided Master Outline": "${payload?.outline}"
  "Provided Sample Questions": "${payload?.sampleQuestions}"
  "Provided Template": "${payload?.template}"
  `;
};

export const pygrdPBLuserPrompt = (payload: any) => {
  const {
    condition,
    specialty,
    subspecialty,
    prompt,
    category,
    questionPerCondition,
  } = payload;

  return `
  Strictly follow the instructions on the below prompt to generate open-ended questions:

  1. Prompt: ${prompt}.
  2. In the answer section, list common medical problems for the given patient case. In the answer details section, provide additional reasoning, expanding to as many as 10 problems with detailed explanations for each, including their clinical significance and potential complications.
  3. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
  4. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic. 
  5. Ensure the output includes a mix of straightforward questions requiring simple answers, as well as more complex clinical scenarios requiring detailed responses. Balance the difficulty evenly across Beginner, Intermediate, and Advanced levels (e.g., 1 Beginner, 1 Intermediate, 1 Advanced for every 3 questions).
  6. Generate exactly ${questionPerCondition} questions per request without repetition.
  7. Do not include unnecessary characters such as ${'```json ```'} in the response.
  8. Return the output strictly in JSON format without any extra formatting, comments, or code blocks.
  9. The generated response should follow this format:
  
  {
  "description": "A brief description of the prompt",
  "data":[
      {
          "question": "Provide a question related to identifying and prioritizing medical problems for the given case",
          "answer": "List common medical problems based on the given scenario.",
          "answer_details": "Provide a detailed explanation for up to 10 medical problems, including their clinical significance and reasoning for each.",
          "category": "${category} || "If not provided, use your knowledge to specify the category"}",
          "subcategory": "${
            subspecialty ||
            'If not provided, use your knowledge to specify the subcategory'
          }",
          "system": "fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
          "topic": "fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
          "subtopic": "fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
          "subject: "${subspecialty} || If not provided, use your knowledge on the provided category to fill it",
          "specialty": "${specialty} || Use your knowledge on the question to fill in the specialty",
          "subspecialty": "${subspecialty} || Use your knowledge on the question to fill in the subspecialty",
          "level": "Specify the difficulty level (Beginner, Intermediate, Advanced)."
      }
  ]
}

  Provided content:
  specialty: ${specialty}
  subspecialty: ${subspecialty}
  condition: ${condition || 'Medical Problem Evaluation'}
  "Provided Master Outline": "${payload?.outline}"
  "Provided Sample Questions": "${payload?.sampleQuestions}"
  "Provided Template": "${payload?.template}"
  `;
};

export const pygrdMedMatchPrompt = (payload: any) => {
  const {
    condition,
    specialty,
    subspecialty,
    prompt,
    category,
    questionPerCondition,
  } = payload;

  return `
  Strictly follow the instructions on the below prompt to generate open-ended medical problem list questions:

  1. Prompt: ${prompt}.
  2. For each question, provide a brief patient profile, including age, gender, and a list of medications they are taking.
  3. In the answer section, list possible medical problems based on the patient's medication list.
  4. In the answer details section, provide a detailed explanation of each possible medical problem, discussing how the medications relate to the condition.
  5. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic. 
  6. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
  7. Ensure a balance between simple and complex medical scenarios, using both straightforward medication lists and more challenging combinations.
  8. Generate exactly ${questionPerCondition} questions per request without repetition.
  9. Do not include unnecessary characters such as ${'```json ```'} in the response.
  10. Return the output strictly in JSON format without any extra formatting, comments, or code blocks.
  11. The generated response should follow this format:
  
  {
  "description": "A brief description of the prompt",
  "data":[
      {
          "question": "Provide a medical problem list question based on the patient's medication profile.",
          "answer": "List possible medical problems related to the medication list.",
          "answer_details": "Provide detailed explanations for each problem, discussing how the medications relate to the condition.",
          "category": "${category} || "If not provided, use your knowledge to specify the category"}",
          "subcategory": "${
            subspecialty ||
            'If not provided, use your knowledge to specify the subcategory'
          }",
          "system": "fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
          "topic": "fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
          "subtopic": "fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
          "subject: "${subspecialty} || If not provided, use your knowledge on the provided category to fill it",
          "specialty": "${specialty} || Use your knowledge on the question to fill in the specialty",
          "subspecialty": "${subspecialty} || Use your knowledge on the question to fill in the subspecialty",
          "level": "Specify the difficulty level (Beginner, Intermediate, Advanced)."
      }
  ]
}

  Provided content:
  specialty: ${specialty}
  subspecialty: ${subspecialty}
  condition: ${condition || 'Medical Problem Evaluation'}
  "Provided Master Outline": "${payload?.outline}"
  "Provided Sample Questions": "${payload?.sampleQuestions}"
  "Provided Template": "${payload?.template}"
  `;
};

export const pygrdBroadScopeQuizPrompt = (payload: any) => {
  const {
    condition,
    specialty,
    subspecialty,
    prompt,
    category,
    questionPerCondition,
  } = payload;
  const lowerCase = category.toLowerCase();

  return `
  Strictly follow the instructions on the below prompt to generate open-ended broad scope medical questions:

  1. Prompt: ${prompt}.
  2. Each question should be broad in scope, covering multiple aspects of medical knowledge, including diagnosis, treatment, prevention, and patient care.
  3. Include a variety of question types, from clinical vignettes to direct questions, to assess different levels of understanding.
  4. The answer section should list 3-4 core concepts or steps needed to address the problem presented in the question.
  5. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic. 
  6. In the answer details section, provide an in-depth explanation of each core concept, incorporating relevant medical knowledge from various disciplines (e.g., pathology, pharmacology, physiology).
  7. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
  8. Ensure a balance of question difficulty across Beginner, Intermediate, and Advanced levels, with questions targeting various specialties and systems.
  9. Generate exactly ${questionPerCondition} questions per request without repetition.
  10. Do not include unnecessary characters such as ${'```json ```'} in the response.
  11. Return the output strictly in JSON format without any extra formatting, comments, or code blocks.
  12. The generated response should follow this format:
  
  {
  "description": "A brief description of the prompt",
  "data":[
      {
          "question": "Provide a broad-scope medical question related to a given condition or medical scenario.",
          "answer": "List 3-4 core concepts or steps that address the presented problem.",
          "answer_details": "Provide a detailed explanation for each concept, discussing how it applies to diagnosis, treatment, prevention, or patient care.",
          "category": "${category} || "If not provided, use your knowledge to specify the category"}",
          "subcategory": "${
            subspecialty ||
            'If not provided, use your knowledge to specify the subcategory'
          }",
          "system": "fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
          "topic": "fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
          "subtopic": "fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
          "subject: "${subspecialty} || If not provided, use your knowledge on the provided category to fill it",
          "specialty": "${specialty} || Use your knowledge on the question to fill in the specialty",
          "subspecialty": "${subspecialty} || Use your knowledge on the question to fill in the subspecialty",
          "level": "Specify the difficulty level (Beginner, Intermediate, Advanced)."
      }
  ]
}

  Provided content:
  specialty: ${specialty}
  subspecialty: ${subspecialty}
  condition: ${condition || 'Broad Scope Medical Problem'}
  "Provided Master Outline": "${payload?.outline}"
  "Provided Sample Questions": "${payload?.sampleQuestions}"
  "Provided Template": "${payload?.template}"
  `;
};

export const generalTriviaPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate ${payload.category} questions:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"

  1. Text to generate questions: ${payload?.prompt}
  2. **Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics. 
  3. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic.  
  
  4. Strictly ensure multiple choice question types of questions are generated.
  5. Strictly ensure ${payload?.noOfOptions} unique options are generated per question.
  6. Strictly ensure you generate the following number of questions ${payload?.noOfQuestion}.
  7. Strictly ensure none of the previous or current questions are repeated.
  8. Strictly ensure the answer exactly matches one of the options.
  9. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
  10. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
  11. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
  "description": "A brief description of the prompt",
  "data":[
    {
    question: string;
    options: string[];
    answer: string;
    answer_details: "provide a well detailed explanation to the question answer";
    category: "${payload?.category}";
    subcategory: "Use your medical knowledge to input the subcategory that the question falls under for the provided category: "${payload?.category}" and subject: "${payload?.subject}" type",
    system: fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
    topic: fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
    subtopic: fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
    subject: if "${payload?.subject}" is provided, fill this section with "${payload?.subject}". Else fill this section with your medical knowledge on the provided category: "${payload?.category}" and subcategory: "${payload?.subcategory}" type.
    level: "provide the difficulty level from ranging from 1 - 10 based on the difficulty of the question"
    specialty: "use your medical knowledge to fill the specialty",
    subspecialty: "use your medical knowledge to fill the subspecialty",
    }
   ]
}
`;
};

export const medicalTriviaPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate ${payload.category} questions:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"

  1. Text to generate questions: ${payload?.prompt}
  2. Strictly generate questions covering only the following subject and subcategory if provided. subject: "${payload?.subject}", subcategory: "${payload?.subcategory}".
  3. **Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.  
  4. Strictly ensure multiple choice question types of questions are generated.
  5. Strictly ensure ${payload?.noOfOptions} unique options are generated per question.
  6. Strictly ensure you generate the following number of questions ${payload?.noOfQuestion}.
  7. Strictly ensure none of the previous or current questions are repeated.
  8. Strictly ensure the answer exactly matches one of the options.
  9. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
  10. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
  11. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
  "description": "A brief description of the prompt",
  "data":[
    {
    question: string;
    options: string[];
    answer: string;
    answer_details: "provide a well detailed explanation to the question answer";
    category: "${payload?.category}";
    subcategory: "${payload?.subcatgory}",
    system: fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
    topic: fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
    subtopic: fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
    subject: if "${payload?.subject}" is provided, fill this section with "${payload?.subject}". Else fill this section with your medical knowledge on the provided category: "${payload?.category}" and subcategory: "${payload?.subcategory}" type.
    level: "provide the difficulty level from ranging from 1 - 10 based on the difficulty of the question"
    specialty: "use your medical knowledge to fill the specialty",
    subspecialty: "use your medical knowledge to fill the subspecialty",
    }
   ]
}
`;
};

export const basicSciencePrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate basic sciences questions:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  **Provided Subject:** "${payload?.subject}"

  1. Text to generate questions: ${payload?.prompt};
  3. **Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.  
  4. Strictly ensure multiple choice question types of questions are generated.
  5. Strictly ensure ${
    payload?.noOfOptions
  } unique options are generated per question.
  6. Strictly ensure you generate the following number of questions ${
    payload?.noOfQuestion
  }.
  7. Strictly ensure none of the previous or current questions are repeated.
  8. Strictly ensure the answer exactly matches one of the options.
  9. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
  10. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
  11. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic.  
  
  12. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
  "description": "A brief description of the prompt",
  "data":[
    {
    question: string,
    options: string[],
    answer: string,
    answer_details: "provide a well detailed explanation to the question answer",
    category: "${payload?.category}",
    subcategory: "${payload?.subcategory}",
    system: fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
    topic: fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
    subtopic: fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
    subject: if "${payload?.subject}" is provided, fill this section with "${payload?.subject}". Else fill this section with your medical knowledge on the provided category: "${payload?.category}" and subcategory: "${payload?.subcategory}" type.
    level: "provide the difficulty level from ranging from 1 - 10 based on the difficulty of the question",
    specialty: "${payload?.subcategory || payload?.subject}",
    subspecialty: "use your medical knowledge on the following provided category: "${
      payload.category
    }" and subject: "${payload?.subject}" and fill in the subspecialty",
    }
   ]
}
`;
};

export const clinicalSciencesPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate clinical sciences questions:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  **Provided Subject:** "${payload?.subject}"

  1. Text to generate questions: ${payload?.prompt};
  2. Strictly generate question covering the following specialty: "${payload?.specialty}" and subspecialty: "${payload?.subspecialty}";
  3. **Subject & Topic Selection:**  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.
  4. Strictly ensure multiple choice question types of questions are generated.
  5. Strictly ensure ${payload?.noOfOptions} unique options are generated per question.
  6. Strictly ensure you generate the following number of questions ${payload?.noOfQuestion}.
  7. Strictly ensure none of the previous or current questions are repeated.
  8. Strictly ensure the answer exactly matches one of the options.
  9. please include a combination of questions that test concepts and clinical applications, and where applicable use case vignettes to test understanding of concepts and clinical applications. Ensure not to always have it in this format. but only in few cases. So it can be a mixture of both normal quizzez and clinical vignettes.
  10. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
  11. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
  12. **Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic.  
  
  13. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
  "description": "A brief description of the prompt",
  "data":[
    {
    question: string,
    options: string[],
    answer: string,
    answer_details: "provide a well detailed explanation to the question answer",
    category: "${payload?.category}",
    subcategory: "${payload?.specialty}",
    system: fill this section with the first level heading in the provided master outline where that has bullet points after it. Or use your medical knowledge to fill this section.   
    topic: fill this section with the second level bullet point under the system from the provided master outline. Or use your medical knowledge to fill this section.  
    subtopic: fill this section with the third level bullet or dash point under the topic from the provided master outline. Or use your medical knowledge to fill this section.
    level: "provide the difficulty level from ranging from 1 - 10 based on the difficulty of the question",
    specialty: "${payload?.specialty}",
    subspecialty: "${payload?.subspecialty}",
    subject: "use your medical knowledge on the provided specialty: ${payload?.specialty} and subspecialty: ${payload?.subspecialty} and fill in the subject",
    }
   ]
}
`;
};

export const USMLEPrompt_backup = (payload: any) => {
  return `
  Strictly follow the instructions below to generate and simulate real-world: "${payload?.subcategory} Exam" with the following subject: ${payload?.subject} examination questions:

  **Provided Master Outline:** "${payload?.outline}"
  **Topics:** If provided "${payload?.topics}".

  1. Text to generate questions: ${payload?.prompt}
  2. Use the following template as a guide to format questions: "${payload?.template}" if provided
  3. Use the following sample questions as examples for structure and complexity: "${payload?.sampleQuestions}" if provided
  4. Strictly generate only from the following medical exam type: "${payload?.subcategory}" and subject: "${payload?.subject}" if provided.
  5. STRICTLY ensure that if **topics are specified (${payload?.topics})**, questions are generated **ONLY from these topics** and their related subtopics are gotten from the master outline provided as follows: "${payload?.outline}".  
     - **DO NOT infer additional topics or subtopics.**
     - **If no topics are provided, use the master outline to determine relevant topics.**
  7. Strictly ensure multiple choice question types are generated.
  8. Strictly ensure ${payload?.noOfOptions} unique options per question.
  9. Generate exactly ${payload?.noOfQuestion} questions.
  10. Ensure no previous or current questions are repeated.
  11. The correct answer **must** be one of the provided options.
  12. Shuffle the correct answer index within the options for each question.
  13. In the **answer_details** field, provide a detailed explanation of the correct answer and additional insights on the topic, including why the incorrect options are wrong.
  14. Each question must have only **one correct answer** within the provided options.
  15. Structure the questions as clinical vignettes when applicable.
  16. Ensure questions assess foundational science, clinical reasoning, and medical practice application.
  17. Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
       - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
       - **Topic**: The topics are the second level bullet points under the system.  
       - **Subtopic**: the subtopics are the third level bullet points under the topic.  

  18. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
    "description": "A brief description of the prompt",
    "data": [
      {
        "question": "The main question text, preferably a clinical vignette or scenario to simulate real-life medical reasoning.",
        "options": ["string1", "string2", "string3", "string4"],
        "answer": "string",
        "answer_details": "Strictly add a detailed explanation of the correct answer and provide more insight about the topic and context of the question, with commentary on the incorrect options and why they are incorrect. ",
        "category": "Medical Exams",
        "reference": "Source(s) for the correct answer and explanation (e.g., textbooks, guidelines)",
        "subcategory": "${payload?.subcategory}",
        "system": fill this section with the first level heading in the provided master outline where that has bullet points after it.  
        "topic": fill this section with the second level bullet point under the system from the provided master outline.  
        "subtopic": fill this section with the third level bullet or dash point under the topic from the provided master outline.
        "subject":"${payload?.subject}",
        "questionType: "The type of question: Traditional Single Best Answer or Sequential Item Set (multiple parts based on a vignette)."
        "contentBreakdown": "Indicates whether the question focuses on General Principles (e.g., genetics, molecular biology, principles of pharmacology) or Organ Systems (e.g., cardiovascular, respiratory)."
        "competency": "The specific physician competency tested, categorized as one or more of the following: Applying Foundational Science Concepts, Patient Care: Diagnosis, Communication and Interpersonal Skills, Practice-based Learning & Improvement."
        "difficulty": "Difficulty level of the question (e.g., Easy, Medium, Hard)."
        "keywords": "Relevant keywords for the question, such as symptoms, conditions, anatomical structures, or pharmacologic agents, for searchability and targeted review."
        "comments": "Space for additional notes on the question’s structure, relevance, or suggested edits."
        "specialty": "Use your knowledge on the subject: '${payload?.subject}' to fill in the specialty.",
        "subspecialty": "Use your knowledge on the subject: '${payload?.subject}' and exam type to fill in the subspecialty.",
       
        "level": "Provide the difficulty level ranging from beginner, intermediate, and advanced based on the difficulty of the question."
      }
    ]
  }
  `;
};

export const USMLEPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate and simulate real-world: "${payload?.subcategory} Exam" with the following subject: ${payload?.subject} examination questions:

  1. Text to generate questions: ${payload?.prompt}
  2. Use the following template as a guide to format questions: "${payload?.template}"
  3. Use the following sample questions as examples for structure and complexity: "${payload?.sampleQuestions}"
  4. Strictly generate only from the following medical exam type: "${payload?.subcategory}" and subject: "${payload?.subject}" if provided.
  5. STRICTLY ensure that if **topics are specified (${payload?.topics})**, questions are generated **ONLY from these topics** and their related subtopics.  
     - **DO NOT infer additional topics or subtopics.**
     - **If no topics are provided, use the master outline to determine relevant topics.**
  6. **If topics are provided, generate questions ONLY from those topics and subtopics within the master outline.**
  7. Strictly ensure multiple choice question types are generated.
  8. Strictly ensure ${payload?.noOfOptions} unique options per question.
  9. Generate exactly ${payload?.noOfQuestion} questions.
  10. Ensure no previous or current questions are repeated.
  11. The correct answer **must** be one of the provided options.
  12. Shuffle the correct answer index within the options for each question.
  13. In the **answer_details** field, provide a detailed explanation of the correct answer and additional insights on the topic, including why the incorrect options are wrong.
  14. Each question must have only **one correct answer** within the provided options.
  15. Structure the questions as clinical vignettes when applicable.
  16. Ensure questions assess foundational science, clinical reasoning, and medical practice application.
  17. Make the question stems longer instead of a one-sentence question, by making the vignettes more comprehensive to cover history, physical examination, investigation and then the question being asked.
    - **Question Style:**
        - Clinical vignette-based **OR** conceptual questions
        - Moderate to long stem — *avoid overly direct or one-sentence questions*
        - Vignette should include:
          - Patient history (age, sex, presenting complaint, relevant PMH or risk factors)
          - Physical examination findings (normal and abnormal)
          - Investigation results (lab, imaging, ABG, ECG, etc.). In some cases, list the laboratory findings with reference ranges in brackets instead of stating what the lab abnormality is.*
        
  18. If the following master outline is provided: "${payload?.outline}", strictly use the outline provided as a guide:
     - "System": Top-level heading in the syllabus or outline.
     - "Topic": Second-level heading under the system. If missing, infer from medical knowledge.
     - "Subtopic": Items nested under topics or specific areas of focus.
     And on the oupt object, put the system on the system field
  19. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
    "description": "A brief description of the prompt",
    "data": [
      {
        "question": "The main question text, preferably a clinical vignette or scenario to simulate real-life medical reasoning.",
        "options": ["string1", "string2", "string3", "string4"],
        "answer": "string",
        "answer_details": "Strictly add a detailed explanation of the correct answer and provide more insight about the topic and context of the question, with commentary on the incorrect options and why they are incorrect. ",
        "category": "Medical Exams",
        "reference": "Source(s) for the correct answer and explanation (e.g., textbooks, guidelines)",
        "subcategory": "${payload?.subcategory}",
        "system": If outline or syllabus is provided: "${payload?.outline}", strictly use the outline provided as a guide:
              - "System": Top-level heading in the syllabus or outline where the subject: ${payload?.subject} falls under.
        "subject":"${payload?.subject}",
        "topic":  If outline or syllabus is provided: "${payload?.outline}", and topics are specified: "${payload?.topics}", strictly use the the topics and subtopics: "${payload?.topics}" provided to fill this place. else if no topics are specified, use the following rules to get the topic from the outline: "${payload?.outline}":
              - "System": Top-level heading in the syllabus or outline.
              - "Topic": Second-level heading under the system. If missing, infer from medical knowledge.
        "subtopic":  If outline or syllabus is provided, strictly use the outline provided as a guide:
                  - "System": Top-level heading in the syllabus or outline.
                  - "Topic": Second-level heading under the system. If missing, infer from medical knowledge.
                  - "Subtopic": Items nested under topics or specific areas of focus if missing, infer from medical knowledge.
        
        "questionType: "The type of question: Traditional Single Best Answer or Sequential Item Set (multiple parts based on a vignette)."
        "contentBreakdown": "Indicates whether the question focuses on General Principles (e.g., genetics, molecular biology, principles of pharmacology) or Organ Systems (e.g., cardiovascular, respiratory)."
        "competency": "The specific physician competency tested, categorized as one or more of the following: Applying Foundational Science Concepts, Patient Care: Diagnosis, Communication and Interpersonal Skills, Practice-based Learning & Improvement."
        "difficulty": "Difficulty level of the question (e.g., Easy, Medium, Hard)."
        "keywords": "Relevant keywords for the question, such as symptoms, conditions, anatomical structures, or pharmacologic agents, for searchability and targeted review."
        "comments": "Space for additional notes on the question’s structure, relevance, or suggested edits."
        "specialty": "Use your knowledge on the subject: '${payload?.subject}' to fill in the specialty.",
        "subspecialty": "Use your knowledge on the subject: '${payload?.subject}' and exam type to fill in the subspecialty.",
       
        "level": "Provide the difficulty level ranging from beginner, intermediate, and advanced based on the difficulty of the question."
      }
    ]
  }


  Other relevant content:
  - **Master Outline:** If provided ("${payload?.outline}"), it should be strictly followed for topic and subtopic selection.
  - **Topics:** If provided ("${payload?.topics}"), questions should be generated ONLY from these topics.
  
  `;
};

export const USMLEStep2CKPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate a large set of **United States Medical Licensing Examination (USMLE) Step 2 Clinical Knowledge (CK) styled** practice questions that comprehensively cover the **entire clinical syllabus**:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  
  **1. Source Text for Question Generation:**  
     - Generate questions from the provided text: **"${payload?.prompt}"** 
     
  **2. Use the provided template to format the questions**
  **3. Use the provided sample questions as examples for structure and complexity**

  **4. Question Format (Case-Based Clinical Vignettes):**  
     - Each question should be structured as a **realistic patient scenario** and must include:  
       - Patient demographics (**age, gender, relevant medical history**)  
       - Presenting symptoms and key clinical findings  
       - Relevant **vital signs, physical exam findings, and investigation results**  
       - Imaging or **lab results (if applicable)**  
       - A **single best answer (SBA) question** requiring **clinical reasoning and decision-making**  

  **5. Ensure Clinical Reasoning Focus:**  
     - The question stem should require **interpretation, diagnosis, next-step management, or complication recognition**.  
     - **Avoid** simple recall-based questions.  

  **6. Single Best Answer (SBA) Format:**  
     - Each question must have **exactly ${payload?.noOfOptions} unique answer options**.  
     - Only **one correct answer** is allowed per question.  
     - The **incorrect options should be plausible but clearly incorrect** upon close evaluation.  

  **7. Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.  

  **8. Question Variability & Consistency:**  
     - Ensure **no repetition** of previously generated questions.  
     - Ensure **shuffled answer positions** to prevent the correct answer from consistently appearing in the same position.  

  **9. Detailed Answer Explanation (Answer Details Field):**  
     - Provide a **comprehensive explanation** of the correct answer.  
     - Include **clinical context, pathophysiology, and reasoning** behind the answer choice.  
     - Explain why **each incorrect option is incorrect**.  

  **10. Exam Focus Areas:**
     - Diagnosis & Management: 50-60%
     - Prognosis & Outcomes: 10-15%
     - Pharmacology & Mechanisms of Disease: 10-15%
     - Epidemiology & Ethics: 10%

  **11. Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
       - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
       - **Topic**: The topics are the second level bullet points under the system.  
       - **Subtopic**: the subtopics are the third level bullet points under the topic.  

  **12. Make the question stems longer instead of a one-sentence question, by making the vignettes more comprehensive to cover history, physical examination, investigation and then the question being asked.
      - **Question Style:**
          - Clinical vignette-based **OR** conceptual questions
          - Moderate to long stem — *avoid overly direct or one-sentence questions*
          - Vignette should include:
            - Patient history (age, sex, presenting complaint, relevant PMH or risk factors)
            - Physical examination findings (normal and abnormal)
            - Investigation results (lab, imaging, ABG, ECG, etc.). In some cases, list the laboratory findings with reference ranges in brackets instead of stating what the lab abnormality is.*
          
  **13. Output Format (Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object):
  {
    "description": "Generated USMLE Step 2 CK clinical vignette questions.",
    "data": [
      {
        "question": "A detailed clinical vignette simulating real-life medical reasoning.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "The correct answer",
        "answer_details": "A detailed explanation of the correct answer, including pathophysiology, key reasoning, and why incorrect answers are wrong.",
        "category": "${payload?.category}",
        "reference": "Provide a medical reference (e.g., Harrison's Internal Medicine, UpToDate, clinical guidelines).",
        "system": fill this section with the first level heading in the provided master outline where that has bullet points after it.  
        "topic": fill this section with the second level bullet point under the system from the provided master outline.  
        "subtopic": fill this section with the third level bullet or dash point under the topic from the provided master outline.
        "subject":"${payload?.subject}",
        "subcategory": "${payload?.subcategory}",
        "questionType": "Traditional Single Best Answer or Sequential Item Set.",
        "contentBreakdown": "Indicates focus on General Principles (e.g., genetics, molecular biology) or Organ Systems (e.g., cardiovascular, respiratory).",
        "competency": "The specific physician competency tested (e.g., Applying Foundational Science Concepts, Patient Care, Communication Skills).",
        "difficulty": "Easy, Medium, or Hard.",
        "FocusArea": "Put the exam focus area here. e.g, ("Diagnosis & Management", "Prognosis & Outcomes", "Pharmacology & Mechanisms of Disease", "Epidemiology & Ethics"),
        "keywords": "Relevant keywords (e.g., symptoms, conditions, drugs, anatomical structures) for searchability.",
        "comments": "Space for additional notes on the question’s structure, relevance, or suggested edits.",
        "specialty": "The specific medical specialty (e.g., Cardiology, Neurology, Infectious Disease).",
        "subspecialty": "The narrower field within the specialty (e.g., Interventional Cardiology, Pediatric Neurology).",
        "level": "Beginner, Intermediate, or Advanced based on question complexity."
      }
    ]
  }
  `;
};

export const PLAB1Prompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate a large set of **Professional and Linguistic Assessments Board (PLAB) 1 styled** practice questions that comprehensively cover the **entire syllabus**:

  **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  
  **1. Source Text for Question Generation:**  
     - Generate questions from the provided text: **"${payload?.prompt}"** 
     
  **2. Use the provided template to format the questions**
  **3. Use the provided sample questions as examples for structure and complexity**

  **4. Question Format (Clinical Vignettes):**  
     - Each question should be structured as a **realistic patient scenario** and must include:  
       - Patient demographics (**age, gender, relevant medical history**)  
       - Presenting symptoms and key clinical findings  
       - Relevant **vital signs, physical exam findings, and investigation results**  
       - Imaging or **lab results (if applicable)**  
       - A **single best answer (SBA) question** requiring **clinical reasoning and decision-making**  

  **5. Ensure Clinical Reasoning Focus:**  
     - The question stem should require **interpretation, diagnosis, next-step management, or complication recognition**.  
     - **Avoid** simple recall-based questions.  

  **6. Single Best Answer (SBA) Format:**  
     - Each question must have **exactly 5 unique answer options (A–E)**.  
     - Only **one correct answer** is allowed per question.  
     - The **incorrect options should be plausible but clearly incorrect** upon close evaluation.  

  **7. Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.  

  **8. Question Variability & Consistency:**  
     - Ensure **no repetition** of previously generated questions.  
     - Ensure **shuffled answer positions** to prevent the correct answer from consistently appearing in the same position.  

  **9. Detailed Answer Explanation (Answer Details Field):**  
     - Provide a **comprehensive explanation** of the correct answer.  
     - Include **clinical context, pathophysiology, and reasoning** behind the answer choice.  
     - Explain why **each incorrect option is incorrect**.  

  **10. Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
       - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
       - **Topic**: The topics are the second level bullet points under the system.  
       - **Subtopic**: the subtopics are the third level bullet points under the topic.  
  
  **11. Output Format (Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object):**
  {
    "description": "Generated PLAB 1 clinical vignette questions.",
    "data": [
      {
        "question": "A detailed clinical vignette simulating real-life medical reasoning.",
        "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
        "answer": "The correct answer",
        "answer_details": "A detailed explanation of the correct answer, including pathophysiology, key reasoning, and why incorrect answers are wrong.",
        "category": "${payload?.category}",
        "subcategory"${payload?.subcategory}",
        "reference": "Provide a medical reference (e.g., NICE Guidelines, GMC Guidance, UK Clinical Practice).",
        "system": fill this section with the first level heading in the provided master outline where that has bullet points after it.  
        "topic": fill this section with the second level bullet point under the system from the provided master outline.  
        "subtopic": fill this section with the third level bullet or dash point under the topic from the provided master outline.
        "subject":"${payload?.subject}",
        "questionType": "Traditional Single Best Answer.",
        "contentBreakdown": "Indicates focus on General Principles (e.g., pharmacology, ethics) or Organ Systems (e.g., cardiovascular, respiratory).",
        "competency": "The specific physician competency tested (e.g., Clinical Judgement, Communication Skills, Ethics & Professionalism).",
        "difficulty": "Easy, Medium, or Hard.",
        "keywords": "Relevant keywords (e.g., symptoms, conditions, drugs, anatomical structures) for searchability.",
        "comments": "Space for additional notes on the question’s structure, relevance, or suggested edits.",
        "specialty": "The specific medical specialty (e.g., General Medicine, Surgery, Pediatrics, Psychiatry).",
        "subspecialty": "The narrower field within the specialty (e.g., Pediatric Emergency, Vascular Surgery).",
        "level": "Beginner, Intermediate, or Advanced based on question complexity."
      }
    ]
  }
  `;
};


export const AMC1Prompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate a large set of **Australian Medical Council (AMC) Part 1 Exam styled** practice questions that comprehensively cover the **entire syllabus form a given subject: "${payload?.subject}"**

    **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  
  **1. Source Text for Question Generation:**  
     - Generate questions from the provided text: **"${payload?.prompt}"** 
     
  **2. Use the provided template to format the questions**
  **3. Use the provided sample questions as examples for structure and complexity**

  **4. Question Format (Clinical Vignettes):**  
     - Each question should be structured as a **realistic patient scenario** and must include:  
       - Patient demographics (**age, gender, relevant medical history**)  
       - Presenting symptoms and key clinical findings  
       - Relevant **vital signs, physical exam findings, and investigation results**  
       - Imaging or **lab results (if applicable)**  
       - A **single best answer (SBA) question** requiring **clinical reasoning and decision-making**  

  **5. Ensure Clinical Reasoning Focus:**  
     - The question stem should require **interpretation, diagnosis, next-step management, or complication recognition**.  
     - **Avoid** simple recall-based questions.  

  **6. Single Best Answer (SBA) Format:**  
     - Each question must have **exactly 4 unique answer options**.  
     - Only **one correct answer** is allowed per question.  
     - The **incorrect options should be plausible but clearly incorrect** upon close evaluation.  

  **7. Subject & Topic Selection:**  
     - If a **subject is provided**: Generate questions **strictly** from "${payload?.subject}".  
     - If **topics are specified (${payload?.topics})**, generate questions only from those topics and their relevant subtopics.  

  **8. Question Variability & Consistency:**  
     - Ensure **no repetition** of previously generated questions.  
     - Ensure **shuffled answer positions** to prevent the correct answer from consistently appearing in the same position.  

  **9. Detailed Answer Explanation (Answer Details Field):**  
     - Provide a **comprehensive explanation** of the correct answer.  
     - Include **clinical context, pathophysiology, and reasoning** behind the answer choice.  
     - Explain why **each incorrect option is incorrect**.  

  **10. Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
       - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
       - **Topic**: The topics are the second level bullet points under the system.  
       - **Subtopic**: the subtopics are the third level bullet points under the topic.  

  **11 Output Format (Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object):**
  {
    "description": "Generated PLAB 1 clinical vignette questions.",
    "data": [
      {
        "question": "A detailed clinical vignette simulating real-life medical reasoning.",
        "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
        "answer": "The correct answer",
        "answer_details": "A detailed explanation of the correct answer, including pathophysiology, key reasoning, and why incorrect answers are wrong.",
        "category": "${payload?.category}",
        "subcategory"${payload?.subcategory}",
        "reference": "Provide a medical reference (e.g., NICE Guidelines, GMC Guidance, UK Clinical Practice).",
        "system": fill this section with the first level heading in the provided master outline where that has bullet points after it.  
        "topic": fill this section with the second level bullet point under the system from the provided master outline.  
        "subtopic": fill this section with the third level bullet or dash point under the topic from the provided master outline.
        "subject":"${payload?.subject}",
        "questionType": "Traditional Single Best Answer.",
        "contentBreakdown": "Indicates focus on General Principles (e.g., pharmacology, ethics) or Organ Systems (e.g., cardiovascular, respiratory).",
        "competency": "The specific physician competency tested (e.g., Clinical Judgement, Communication Skills, Ethics & Professionalism).",
        "difficulty": "Easy, Medium, or Hard.",
        "keywords": "Relevant keywords (e.g., symptoms, conditions, drugs, anatomical structures) for searchability.",
        "comments": "Space for additional notes on the question’s structure, relevance, or suggested edits.",
        "specialty": "The specific medical specialty (e.g., General Medicine, Surgery, Pediatrics, Psychiatry).",
        "subspecialty": "The narrower field within the specialty (e.g., Pediatric Emergency, Vascular Surgery).",
        "level": "Beginner, Intermediate, or Advanced based on question complexity."
      }
    ]
  }
  `;
};

export const RACPPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate a set of unique, high-quality practice questions for the "Royal Australasian College of Physicians (RACP)" Divisional Written Examination. The questions should be based on the subject: "${payload?.subject}".

    **Provided Master Outline:** "${payload?.outline}"
  **Provided Sample Questions:** "${payload?.sampleQuestions}"
  **Provided Template:** "${payload?.template}"
  
  **1. Source Text for Question Generation:**  
     - Generate questions from the provided text: **"${payload?.prompt}"** 
     
  **2. Use the provided template to format the questions**
  **3. Use the provided sample questions as examples for structure and complexity** 
  4. If topics are provided (${payload?.topics}), generate questions based only on those specified topics or subtopics.**
  5. Ensure that all questions align with the medical exam type: **"${payload?.subcategory}"**, and strictly follow the RACP syllabus if uploaded.**
  6. Include both **Multiple-Choice Questions (MCQs) and Extended Matching Questions (EMQs)** in the dataset.  
  7. Ensure all questions reflect **real-world clinical scenarios** at the level of final-year Basic Physician Trainees.  
  8. Generate exactly **${payload?.noOfQuestion}** questions with **${payload?.noOfOptions}** unique answer options per question.  
  9. Ensure **no repeated questions** appear within the generated set.  

  **Question Formatting & Answer Constraints:**  
  10. Each question must have **one and only one correct answer**, which **must match an option exactly**.  
  11. Shuffle the index of the correct answer in the options array to **prevent pattern recognition**.  
  12. Provide a **detailed explanation** for each question under the "answer_details" field, explaining why the correct answer is right and why the incorrect ones are wrong.  
  13. Ensure all incorrect options are **plausible and clinically relevant** to avoid ambiguity.  

  **14. Content Breakdown & Categorization:**  
     - Use the provided **outline (if available)** to categorize questions under:  
     - **System**: The system is the first level heading in the provided master outline where that has bullet points after it.  
     - **Topic**: The topics are the second level bullet points under the system.  
     - **Subtopic**: the subtopics are the third level bullet points under the topic.  
  
  **Expected JSON Output Format (Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object):**

  {
    "description": "A brief description of the prompt",
    "data": [
      {
        "question": "The main question text, preferably a clinical vignette or scenario.",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "answer": "The correct answer, which must be one of the options.",
        "answer_details": "Detailed explanation of the correct answer and why other options are incorrect.",
        "category":"${payload?.category}",
        "reference": "Credible sources (e.g., textbooks, guidelines).",
        "subcategory": "${payload?.subcategory}",
        "subcategory"${payload?.subcategory}",
        "system": fill this section with the first level heading in the provided master outline where that has bullet points after it.  
        "topic": fill this section with the second level bullet point under the system from the provided master outline.  
        "subtopic": fill this section with the third level bullet or dash point under the topic from the provided master outline.
        "subject":"${payload?.subject}",
        "questionType": "Single Best Answer or Extended Matching Question.",
        "contentBreakdown": "General Principles or Organ Systems.",
        "competency": "Applying Foundational Science, Diagnosis, etc.",
        "difficulty": "Easy, Medium, or Hard.",
        "keywords": "Relevant terms for searchability.",
        "comments": "Additional notes (if any).",
        "specialty": "Derived from '${payload?.subject}'.",
        "subspecialty": "Derived from '${payload?.subject}' and exam type.",
        "level": "Beginner, Intermediate, or Advanced.",
        "section": "${payload?.section}"
      }
    ]
  }
  
  `;
};

export const MedsynopsisPrompt = (payload: any) => {
  return `
  Strictly follow the instructions below to generate Medysnopsis discharge cases for the following department: ${payload?.department}:

  1. Text to generate case, summary or both: ${payload?.prompt}
  
  2. Strictly follow the example case from the outpatient department below as guide for generating cases: 
  
  **Emergency Department Clinical Notes**: "this represent the department the discharge case is for.

  **Patient Profile**:  
  Name: Rebecca Lee  
  Sex: Female  
  Age: 42  
  Occupation: Office Manager  

  **Chief Complaint**:  
  Abdominal pain and bloating for the past three months.

  **History of Present Illness**:  
  Rebecca Lee, a 42-year-old female, presented with intermittent lower abdominal pain and bloating often associated with changes in bowel habits. The pain worsens after meals and is relieved somewhat with bowel movements. She also reports alternating constipation and diarrhea. She denies any significant weight loss, fever, or blood in her stool.

  **Review of Systems**:  
  - General: No fever or weight loss  
  - Gastrointestinal: Abdominal pain, bloating, alternating constipation and diarrhea  
  - Genitourinary: No urinary symptoms  
  - Cardiovascular: No chest pain or palpitations  
  - Respiratory: No cough or shortness of breath  

  **Medications**:  
  Over-the-counter antacids as needed.

  **Past Medical History**:  
  - Irritable Bowel Syndrome (IBS), diagnosed 5 years ago  
  - Hypertension, controlled with medication  

  **Family History**:  
  - Father: Hypertension, colon cancer  
  - Mother: Type 2 diabetes  

  **Physical Examination**:  
  - Vital signs: BP 130/80 mmHg, HR 75 bpm, RR 16/min, SpO2 98%, Temp 36.8°C  
  - Abdomen: Mild tenderness in the lower abdomen, no rebound tenderness  

  **Investigations**:  
  - CBC: Normal  
  - Abdominal ultrasound: No abnormalities detected  

  **Assessment**:  
  Exacerbation of Irritable Bowel Syndrome (IBS) with mild dehydration secondary to diarrhea.

  **Plan**:  
  - Prescribed dicyclomine for pain  
  - Advised dietary modifications and probiotics  
  - Educated on stress management  
  - Follow-up in 4 weeks.


3. Strictly follow the example summary from the case above to generate your own case summary for the generated case: 
  
**Example Summary**:  
  Rebecca Lee, a 42-year-old female, presented with a three-month history of intermittent lower abdominal pain and bloating often associated with changes in bowel habits. 
  Examination revealed mild tenderness in the lower abdomen. Her past medical history includes Irritable Bowel Syndrome (IBS) and hypertension. 
  
  Initial investigations, including CBC, electrolytes, stool test, and abdominal ultrasound, were normal. The diagnosis is an exacerbation of IBS with mild dehydration secondary to diarrhea. 
  She was prescribed dicyclomine for pain, advised on dietary modifications and probiotics, and educated on stress management techniques. 
  
  She was discharged with instructions to follow up in 4 weeks to assess symptom improvement and to return sooner if symptoms worsen or new symptoms develop.

4. Strictly ensure there are no repeation of generated cases and summary.
5. Strictly ensure you generate the following number of questions or cases: ${payload?.noOfQuestion}.
6. Strictly ensure none of the previous or current cases and summary are repeated.
7. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
    "description": "A brief description of the prompt",
    "data": [
      {
        "caseTitle": "Here you should put the department for which the case is generate for. Example: Internal Medicine Clinical Notes",
        "question": "Write a concise discharge summary to the patient’s family doctor.",
        "caseContent": "Put the generated case here. And be sure it is in markdown format",
        "caseSummary": "Put the generated summary for the case here. And be sure it is in markdown format.",
      }
    ]
  }

  Other provided content: 
  "file": If a file or outline is uploaded, use the content in it as a guide on how to generate the cases and summary.
`;
};

export const groupQuestionsPrompt = () => {
  return `
  Please modify the questions in the uploaded document, using the following instruction:

  1. For each question in the uploaded document, add a "system" property based on the main section title in the outline below.
  2. Use the second-level section title in the outline as the "topic" for each question. If not available, use medical knowledge to assign the topic.
  3. Use specific items within the second-level section as "subtopic." If subtopic items have colons, treat text before the colon as the topic, with the rest as the subtopic.
  
  Provided outline:
      Pathology Medical Student Syllabus Outline

      1. Cell Injury and Adaptation
        -Types of cell injury: reversible and irreversible
        -Mechanisms of cell injury (ischemia, toxins, infections, immune reactions)
        -Cellular adaptation to stress (hypertrophy, hyperplasia, atrophy, metaplasia)
        -Cell death mechanisms (necrosis, apoptosis)
        -Examples of cell injury in clinical settings (e.g., myocardial infarction)

      2. Inflammation and Repair
        -Acute inflammation
          -Vascular changes, cellular events, chemical mediators
          -Morphologic patterns of acute inflammation (abscess, ulcer, cellulitis)
        -Chronic inflammation
          -Causes and features of chronic inflammation
          -Granulomatous inflammation
        -Tissue repair and wound healing
          -Steps of wound healing (hemostasis, inflammation, proliferation, remodeling)
          -Factors affecting wound healing
          -Pathologic aspects of repair (keloid, hypertrophic scar)

      3. Hemodynamic Disorders, Thrombosis, and Shock
        -Edema and fluid balance
          -Pathophysiology of edema (increased capillary pressure, reduced oncotic pressure, lymphatic obstruction)
        -Thrombosis and embolism
          -Virchow’s triad (endothelial injury, hypercoagulability, stasis)
          -Types of emboli (pulmonary, systemic, fat, air)
        -Hemorrhage
          -Types and clinical relevance of hemorrhage
        -Shock
          -Mechanisms of shock (cardiogenic, hypovolemic, septic)
          -Stages and clinical consequences of shock

      4. Genetic Disorders
        -Single-gene (Mendelian) disorders
          -Autosomal dominant, autosomal recessive, X-linked disorders
          -Examples: Marfan syndrome, cystic fibrosis, hemophilia
        -Chromosomal disorders
          -Trisomies (e.g., Down syndrome), sex chromosome abnormalities
        -Multifactorial inheritance
          -Interaction of genetic and environmental factors
        -Molecular genetics and disease
          -Gene mutations, epigenetics, imprinting
          -Diagnostic techniques (karyotyping, PCR, FISH)

      5. Neoplasia
        -Definition and characteristics of benign and malignant tumors
        -Carcinogenesis
          -Molecular basis of cancer: oncogenes, tumor suppressor genes
          -Environmental factors and carcinogens (chemical, radiation, viral)
        -Tumor growth and spread
          -Mechanisms of tumor invasion and metastasis
          -Tumor-host interactions (paraneoplastic syndromes, cachexia)
        -Grading and staging of tumors
          -TNM staging system, histologic grading
        -Common cancers and their clinical relevance (e.g., lung, breast, colon cancer)

      6. Immune System Disorders
        -Hypersensitivity reactions
          -Types I-IV hypersensitivity
          -Examples: allergic rhinitis, anaphylaxis, autoimmune diseases
        -Autoimmune diseases
          -Pathogenesis and examples (e.g., systemic lupus erythematosus, rheumatoid arthritis)
        -Immunodeficiency disorders
          -Primary and secondary immunodeficiencies (e.g., HIV/AIDS, SCID)
        -Transplant rejection
          -Mechanisms of rejection (hyperacute, acute, chronic)
          -Graft-versus-host disease (GVHD)

      7. Infectious Diseases
        -Pathogenic microorganisms
          -Bacteria, viruses, fungi, protozoa, and helminths
          -Modes of transmission and pathogenesis of infectious diseases
        -Host-pathogen interactions
          -Mechanisms of microbial pathogenicity (toxins, invasion, immune evasion)
          -Patterns of tissue response to infection
        -Examples of common infections
          -Tuberculosis, HIV, hepatitis, malaria, syphilis
        -Principles of antimicrobial therapy

      8. Environmental and Nutritional Pathology
        -Environmental toxins and injury
          -Pathology of exposure to chemicals, drugs, and radiation
          -Occupational diseases
        -Nutritional deficiencies and excesses
          -Protein-energy malnutrition (e.g., kwashiorkor, marasmus)
          -Vitamin deficiencies (e.g., scurvy, rickets, B12 deficiency)
          -Obesity and metabolic syndrome
          -Alcohol-related diseases (e.g., liver cirrhosis)

      9. Cardiovascular Pathology
        -Atherosclerosis
          -Pathogenesis, risk factors, and clinical consequences
          -Ischemic heart disease (angina, myocardial infarction)
        -Hypertension
          -Pathophysiology and effects on the heart, kidneys, brain
        -Congenital heart diseases
          -Common anomalies (e.g., septal defects, Tetralogy of Fallot)
        -Valvular heart diseases
          -Rheumatic heart disease, infective endocarditis, valvular calcification
        -Heart failure and cardiomyopathy

      10. Respiratory Pathology
          -Chronic obstructive pulmonary diseases (COPD)
            -Chronic bronchitis, emphysema
          -Asthma
            -Pathophysiology, triggers, and management
          -Lung infections
            -Pneumonia, tuberculosis, fungal infections
          -Lung tumors
            -Primary lung cancer (e.g., small cell, non-small cell lung carcinoma)
          -Pulmonary vascular diseases
            -Pulmonary embolism, pulmonary hypertension

      11. Gastrointestinal Pathology
        -Esophageal diseases
          -GERD, Barrett’s esophagus, esophageal cancer
        -Gastric diseases
          -Peptic ulcer disease, gastric carcinoma
        -Inflammatory bowel disease (IBD)
          -Crohn’s disease, ulcerative colitis
        -Liver pathology
          -Hepatitis (viral, autoimmune), cirrhosis, hepatocellular carcinoma
        -Pancreatic diseases
          -Acute and chronic pancreatitis, pancreatic cancer

      12. Renal Pathology
        -Glomerular diseases
          -Nephritic and nephrotic syndromes
          -Glomerulonephritis (e.g., post-streptococcal, rapidly progressive)
        -Tubular and interstitial diseases
          -Acute tubular necrosis, pyelonephritis
        -Chronic kidney disease
          -Pathophysiology and clinical manifestations
        -Renal tumors
          -Renal cell carcinoma, Wilms tumor

      13. Endocrine Pathology
        -Pituitary gland disorders
          -Hyperpituitarism, hypopituitarism (e.g., acromegaly, Sheehan’s syndrome)
        -Thyroid disorders
          -Hyperthyroidism (e.g., Graves' disease), hypothyroidism (e.g., Hashimoto’s)
          -Thyroid tumors
        -Adrenal gland disorders
          -Cushing’s syndrome, Addison’s disease, pheochromocytoma
        -Diabetes mellitus
          -Pathophysiology, types, and complications

      14. Reproductive System Pathology
        -Male reproductive system
          -Testicular tumors, benign prostatic hyperplasia, prostate cancer
        -Female reproductive system
          -Ovarian cysts and tumors, endometriosis, cervical and uterine cancer
        -Breast pathology
          -Benign conditions (fibrocystic disease, fibroadenoma)
          -Breast cancer: types and risk factors

      15. Nervous System Pathology
        -Cerebrovascular diseases
          -Stroke, transient ischemic attack, aneurysms
        -Neurodegenerative disorders
          -Alzheimer’s disease, Parkinson’s disease, Huntington’s disease
        -Infections of the nervous system
          -Meningitis, encephalitis, brain abscess
        -CNS tumors
          -Gliomas, meningiomas, metastatic tumors

      16. Hematopathology
        -Anemias
          -Types (microcytic, macrocytic, hemolytic)
          -Sickle cell anemia, thalassemia
        -Leukemia and lymphomas
          -Acute and chronic leukemias, Hodgkin’s and non-Hodgkin’s lymphoma
        -Bleeding disorders
          -Coagulation defects, platelet disorders (e.g., hemophilia, DIC)
        -Bone marrow failure
          -Aplastic anemia, myelodysplastic syndrome

  4. Strictly return output in JSON format as shown in the following example:
  [
    {
      "question": "What is pathology?",
      "system": "Introduction to Pathology",
      "topic": "Definition and scope of pathology",
      "subtopic": "Definition of pathology"
    }
  ]`;
};

//Method for formatting master outline content into a desired outline
export const extractMasterOutline = (data: string) => `
  *"You are an AI content formatter tasked with transforming a detailed master outline into a structured JSON format. Given the input data, extract the main systems and their associated topics and subtopics, ensuring proper formatting for clarity while preserving the original intent.


  provided master outline: ${data}
  Instructions:
  1. Extract the top-level keys as the 'system' field.
  2. Extract all sub-keys under each top-level key as 'topics'.
  2. Extract all sub-keys under each second-level key if existing as 'subtopics'.
  3. Ensure the 'topics' and subtopics are formatted into meaningful strings that summarize their intent while retaining the original information.
  4. Do not include unnecessary characters such as ${'json '} in the response.
  5. Ensure the output is strictly formatted in valid JSON without comments or extra code blocks.
  
  {
    "description": "A brief description of the prompt",
    "data": [
      {
        "system": "string",
        "data": [
          {
            "topic": "string",
            "subtopic": ["string", "string"]
          }
        ]
      }
    ]
}
`;

export const playGroundTemplateToMarkdown = (data: string) => {
  return `
  Strictly follow the instructions below:

  1. rewrite the following content: "${data}" and format it in a markdown format.
  2. Do not include unnecessary characters such as ${'json '} in the response.
  3. Ensure the output is formatted in strict JSON without any extra formatting, comments, or code blocks.
  {
      "data": "Formatted Markdown content here"
  }
`;
};