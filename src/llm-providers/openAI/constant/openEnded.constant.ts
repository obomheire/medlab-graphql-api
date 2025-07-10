/* eslint-disable prettier/prettier */
export const dxQuestPrompt=(payload: any)=>{
    const {condition, specialty, subspecialty, questionPerCondition}  = payload

    return `
    Strictly follow the instructions below to generate open-ended medical questions focused only on differential diagnoses for ${condition} within the subspecialty (${subspecialty}).

    1. Strictly ensure that all generated questions specifically ask about 4 differential diagnoses. Avoid asking about general knowledge or unrelated aspects of the condition.
    2. Strictly ensure that in each question, the question gets to ask for 4 differential diagnoses. which the answer will be the 4 common differential diagnosis, whereas the answer details part on the output will have more than 4 as the case maybe
    3. Strictly ensure that the answer details can have as much as 10 detailed explanation for the answer, explaining the reason behind each differential diagnosis
    4. Strictly ensure to you phrase the questions differently without having to constantly repeat asking in one pattern.
    5. Include both direct concept questions and clinical vignette scenarios that emphasize the process of arriving at differential diagnoses.
    6. Ensure that the generated output includes a mix of straightforward questions requiring simple answers and complex clinical vignettes that require detailed responses. Distribute the difficulty levels evenly between Beginner, Intermediate, and Advanced.
    7. Strictly generate ${questionPerCondition} questions at a time without any repetition.
    8. Do not include unnecessary characters such as ${'```json ```'} in the response.
    9. Ensure the output is formatted in strict JSON without any extra formatting, comments, or code blocks.
    10. The generated response should follow this format:
    {
    "description": "A brief description of the prompt",
    "data": [
        {
            "question": "Provide a differential diagnosis question related to the given condition",
            "answer": "The answer should list 4 common possible differential diagnoses out of many more that will be captured on the answer details property, for example: 1. Diagnosis one, 2. Diagnosis two, etc.",
            "answer_details": "Provide a detailed explanation for the answer, explaining the reasoning behind each differential diagnosis and you can go as far as listing and explaining 5-10 differential diagnosis",
            "category": "${specialty}",
            "subcategory": "${subspecialty}",
            "system": "Indicate the body system involved",
            "topic": "State the specific medical topic",
            "subtopic": "Provide a more specific subtopic",
            "level": "Specify the difficulty level (Intermediate, Beginner, Advanced)"
        }
    ]
}
    `
    // return `
    // Strictly follow the instructions below to generate open ended medical questions focused on differential diagnoses and other medical areas that covers a broad spectrum of medical fields, including General Medicine, Surgery, Pediatrics, Obstetrics and Gynecology, Psychiatry, and their subspecialties. 
    
    
    // 1. Strictly make sure the questions should be a mixture of long form and short form open-ended questions. 
    // 2. Strictly ensure the generated questions Include both direct concept questions and clinical vignette scenarios. 
    // 3. Strictly ensure that the generated output includes a mix of straightforward questions requiring simple answers and complex clinical vignettes that require detailed responses. Distribute the difficulty levels evenly between Beginner, Intermediate, and Advanced.
    // 4. Strictly ensure that if the generated question type is for open ended long form, the answer should be a single long essay type. but when it is short open ended type, the answer shouldn't be more than 4 options ans whould be a detail kind of answer that will require the user to write short essay
    // 5. Strictly generate 20 questions at a time and the generated questions shouldn't include any repeatitation.
    // 6. Strictly ensure that the questions should be balanced between long-form and short-form open ended questions.
    // 7. Strictrly ensure a broad representation of medical specialties and subspecialties.
    // 8. Strictly exclude all category or subcategory that has to do with cardiology 
    // 8. Be sure not to include unecessary charachers such as ${'```json ```'} on the response or returned result.
    // 9. Strictly ensure the output is formatted strictly in JSON format without any extra formatting, comments, or code blocks.
    // 10: the generated response should be in the following format:
    // [
    //     {
    //         "question": "provide the main question",
    //         "answer": "the answer to the question. Note, let the answers use a numbering. for example: 1. answer one, 2. answer 2, etc.",
    //         "answer_details": "provide detail explanation for for the question",
    //         "category": "provide the class of category the question belong to",
    //         "subcategory": "Provide a relevant medical subfield",
    //         "system": "Indicate the body system involved",
    //         "topic": "State the specific medical topic",
    //         "subtopic": "Provide a more specific subtopic",
    //         "level": "Specify the difficulty level (Intermediate, Beginner, Advanced)"
    //     }
    // ]
    // `
}