export const multichoicePrompt = (payload: any) => {
  return `
    Strictly follow the instructions below to generate multiple-choice questions for the topic discussed:
  
    1. Strictly generate question covering the discussed topic: "${payload?.topic}";
    3. Strictly ensure multiple choice question types of questions are generated.
    4. Strictly ensure ${payload?.noOfOptions} unique options are generated per question.
    5. Strictly ensure you generate the following number of questions ${payload?.noOfQuestions}.
    6. Strictly ensure none of the previous or current questions are repeated.
    7. Strictly ensure the answer exactly matches one of the options.
    8. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
    9. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
    11. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
    "description": "A brief description of the prompt",
    "data":[
      {
      question: string,
      options: string[],
      answer: string,
      answer_details: "provide a well detailed explanation to the question answer",
      topic: "${payload?.topic}",
      }
     ]
  }
  
  `;
};

export const openEndedPrompt = (payload: any) => {
  const { noOfQuestions } = payload;

  return `
   Strictly follow the instructions below to generate open-ended questions focused on the topic(s) discussed:
 
   1. Use the generated simulation topic content to generate the questions. If certain information (like diagnosis or condition specifics) is missing, use your medical knowledge to fill in the gaps with reasonable assumptions.
   4. In the answer section, list 4 common differential diagnoses. In the answer details section, provide additional reasoning, expanding to as many as 10 diagnoses with detailed explanations for each.
   5. Include both direct concept-based questions and clinical vignette scenarios that emphasize the process of arriving at differential diagnoses.
   6. Vary the phrasing of the questions to avoid repetition, using different clinical scenarios or wording styles.
   7. Ensure the output includes a mix of straightforward questions requiring simple answers, as well as more complex clinical vignettes requiring detailed responses. Balance the difficulty evenly across Beginner, Intermediate, and Advanced levels (e.g., 1 Beginner, 1 Intermediate, 1 Advanced for every 3 questions).
   8. Generate exactly ${noOfQuestions} questions per request without repetition.
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
            topic: "${payload?.topic}",
            options: string[],
       }
   ]
 }

   }
   `;
};

export const pollPrompt = (payload: {
  topic: string;
  noOfOptions: number;
  noOfQuestions;
}) => {
  return `
   Strictly follow the instructions below to generate poll questions for the topic discussed:
 
   1. Strictly generate polls covering the discussed topic: "${payload?.topic}".
   2. Strictly ensure each poll contains a single question with response options related to the discussed topic.
   3. Strictly ensure ${payload?.noOfOptions} unique options are generated for each poll.
   4. Strictly ensure you generate the following number of polls: ${payload?.noOfQuestions}.
   5. Strictly ensure none of the previous or current polls are repeated.
   6. Strictly ensure the options provided are diverse and reflect plausible opinions, preferences, or choices.
   7. Strictly ensure you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
   {
     "description": "A brief description of the polls",
     "data": [
       {
         "question": string,
         "options": string[],
         "topic": "${payload?.topic}"
       }
     ]
   }
   `;
};

// export const episodeQuizPrompt = (payload: {
//   noOfQuestions: number;
//   title: string;
// }) => {
//   return `
//     Strictly follow the instructions below to generate multiple-choice questions for the topic discussed:

//     1. Strictly generate question covering the discussed topic";
//     3. Strictly ensure multiple choice question types of questions are generated.
//     4. Strictly ensure 4 unique options are generated per question.
//     5. Strictly ensure you generate the following number of questions ${payload?.noOfQuestions}.
//     6. Strictly ensure none of the previous or current questions are repeated.
//     7. Strictly ensure the answer exactly matches one of the options.
//     8. Strictly ensure the index of the correct answer is shuffled in the options array for all questions, preventing the correct answer from consistently appearing in the same position.
//     9. Strictly ensure that there are no multiple correct answers included within the options for any question. Only one correct answer is allowed within the options for any question.
//     11. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
//     {
//     "description": "A brief description of the prompt",
//     "data":[
//       {
//       question: string,
//       options: string[],
//       answer: string,
//       answer_details: "provide a well detailed explanation to the question answer",
//       topic: "${payload?.title}",
//       }
//      ]
//   }
//   `;
// };
