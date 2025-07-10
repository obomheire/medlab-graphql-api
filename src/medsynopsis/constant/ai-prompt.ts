/* eslint-disable prettier/prettier */
export const medSynopsisPrompt = (content: string, userSummary: string) => {
  return `
Strictly follow the instructions below to to grade a provided user summary against a provided medical report document based on the following criteria, and assign a score out of 20 for each criterion:

1. Accuracy: From the user provided summary, compare against the provided content and:
    I. Check if the clinical details (chief complaint, history, examination findings, investigations, diagnosis, and treatment) are correct and complete.
    II. Deduct points for any inaccuracies or omissions.
2. Clarity and Conciseness: From the user provided summary, compare against the provided content and:
    I. Evaluate if the summary is easy to read, avoiding unnecessary details or medical jargon.
    II. Deduct points for lack of clarity, overly verbose sections, or excessively brief descriptions.

3. Relevance: From the user provided summary, compare against the provided content and:
    I. Ensure all included information is pertinent to the case and unnecessary details are excluded.
    II. Deduct points for irrelevant information or missing key details.

4. Organization and Structure: From the user provided summary, compare against the provided content and:
    I. Assess the logical flow and use of headings/subheadings to organize the summary.
    II. Deduct points for disorganized content or poor structure that affects readability.

5. Strictly ensure that the user provided summary content is in line with the provided content it is checking against. For example, if the provided content is as follows: 

provided content: 

    Patient Profile: Name: Michael Johnson
    Sex: Male
    Age: 45
    Occupation: Long-distance Truck Driver

    Chief Complaint:
    ●Chest pain
    History of Present Illness (HPI): Michael Johnson, a 45-year-old male, presented to the emergency department with a complaint of chest pain that began approximately 3 hours prior to arrival. The pain was described as sharp, localized to the left side of his chest, and exacerbated by certain movements and deep breaths. He reported that the pain started after a long driving shift and lifting heavy cargo. There was no associated shortness of breath, nausea, diaphoresis, or radiating pain. The patient has experienced similar episodes of musculoskeletal pain in the past, particularly after long periods of driving and physical exertion.
    
    Review of Systems (ROS): Review of systems is non-contributory.

    Medications:
    ●Amlodipine 5 mg once daily
    ●Hydrochlorothiazide 25 mg once daily

    Allergies:
    ●No known drug allergies

    Past Medical History:
    ●Hypertension: Diagnosed 8 years ago, controlled with medication.
    ●Smoker: 30 pack-year history, currently smoking 1 pack per day.

    Past Surgical History:
    ●None

    Family History:
    ●Father had a myocardial infarction at age 55.
    ●Mother has hypertension and type 2 diabetes.
    Social History: Michael lives with his wife and two children. He drives long distances for work, often experiencing high stress and irregular sleep patterns. He smokes a pack of cigarettes daily and drinks alcohol occasionally. He does not engage in regular physical exercise and has a sedentary lifestyle due to his job.
    
    Physical Examination:
    ●Vital signs: BP 145/90 mmHg, HR 82 bpm, RR 18/min, SpO2 98% on room air.
    ●Cardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops.
    ●Respiratory: Clear breath sounds bilaterally, no wheezes or crackles.
    ●Musculoskeletal: Tenderness on palpation of the left chest wall muscles, pain reproduced with movement and palpation, no swelling or bruising.
    ●Abdomen: Soft, non-tender, no organomegaly.
    ●Extremities: No edema, pulses palpable and equal.

    Investigations:
    ●ECG: Normal sinus rhythm, no ischemic changes.
    ●Blood tests: Troponin levels within normal limits.
    ●Chest X-ray: Normal.

    Assessment:
    1.Musculoskeletal chest pain likely due to muscle strain from physical exertion and prolonged driving.
    2.Hypertension.
    3.Current smoker with a significant smoking history.

    Plan:
    ●Administered ibuprofen 400 mg orally for pain relief.
    ●Advised to rest and avoid heavy lifting for the next few days.
    ●Recommended over-the-counter NSAIDs for pain management as needed.
    ●Encouraged to perform stretching exercises and maintain good posture while driving.
    ●Provided information on smoking cessation resources.
    ●Advised to follow up with his family doctor within the next week to reassess his condition and review hypertension management.
    
    Follow-Up:
    ●Follow up with family doctor in one week to reassess condition and review hypertension management.
    ●Return to the emergency department if symptoms worsen or new symptoms develop.

User provided summary example: 

Michael Johnson, a 45-year-old long-distance truck driver, presented with sharp left-sided chest pain after a long shift and heavy lifting. The pain was aggravated by movement and deep breaths. He has a history of hypertension and is a current smoker.
Examination showed tenderness in the left chest wall muscles with normal cardiovascular and respiratory findings. ECG and chest X-ray were normal, and troponin levels were within normal limits.
The diagnosis was musculoskeletal chest pain. He received ibuprofen for pain relief and was advised to rest, avoid heavy lifting, and perform stretching exercises. Follow-up with his family doctor was recommended for hypertension management and smoking cessation support. Return to the ED if symptoms worsen or new symptoms develop.


Note: the user provided summary content should be based on the provided content and not content that is off the provided content

5. The total score should be the sum of the results from "Accuracy", "Clarity and Conciseness", "Relevance", and "Organization and Structure".
6. generate a critique of their work and how to improve, commentary based on weighing their performance against the provided marking scheme with helpful feedback on how to improve
7. Personalize the feedback section on the response to the user. For example, use words like "Your" instead of "the user".
8. Please ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object: 
{
    "description": "A brief description of the prompt",
    "feedback": "When providing this feedback, persionalize it. for example, instead of using "the user's", use "Your, etc.",
    "score": {
        "Accuracy": number,
        "Clarity and Conciseness": number,
        "Relevance": number,
        "Organization and Structure": number,
        "Total Score": number,
    }
}
9. 
Provided content: ${content}
User's summary: ${userSummary}

10. Be sure not to include unecessary charachers such as ${'```json ```'} on the response or returned result.
`;
};

export const defaultUserCasePrompt = () => {
  return `
    Strictly follow the instructions below to generate a doctor medical report summary based on the uploaded content that was provided using the following prompt:

    1. Please summarize the uploaded file into a brief and structured format. The summary should include the patient's name, age, occupation, chief complaint, relevant medical history, physical examination findings, investigations, assessment, and plan in a well formated paragraph. Use the following example as a guide:
        Example Format:
        Michael Johnson, a 45-year-old long-distance truck driver, presented with sharp left-sided chest pain after a long shift and heavy lifting. The pain was aggravated by movement and deep breaths. He has a history of hypertension and is a current smoker. 
        
        Examination showed tenderness in the left chest wall muscles with normal cardiovascular and respiratory findings. ECG and chest X-ray were normal, and troponin levels were within normal limits. 
        
        The diagnosis was musculoskeletal chest pain. He received ibuprofen for pain relief and was advised to rest, avoid heavy lifting, and perform stretching exercises. Follow-up with his family doctor was recommended for hypertension management and smoking cessation support. Return to the ED if symptoms worsen or new symptoms develop.
        
    2.  Omit section headers, write in a prose with appropriate paragraphs and formatting
    3. Also note that most times the summary should not follow the example format if the document does not have information relating to the example given
    4. Your response should not include unnecessary characters such as ${'```json ```'} on the response or returned result.
    5. Please ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
        "description": "A brief description of the prompt",
        "summary": the summarized version of the extracted text from the file in an html format,
        "providedContent": content of the extracted text from the uploaded file in an html format. and should maintain the orignal format,
        "fileURL": "a string containing the file location"
    }
    `;
};

export const userOwnPrompt = (prompt) => {
  return `
    Strictly follow the instructions below to generate a doctor medical report summary based on the uploaded file content that was provided using the following prompt:

    1. Prompt: ${prompt}
    2. Strictly ensure that the user prompt is taking effect on the summary side of the output. for instance, if a user says "summarize doc", give them a summary of their uploaded document which is to be displayed on the summary output.
    2. Your response should not include unnecessary characters such as ${'```json ```'} on the response or returned result.
    3. Please ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
        "description": "A brief description of the prompt",
        "summary": the summarized version of the extracted text from the file in an html format,
        "providedContent": content of the extracted text from the uploaded file in an html format.  and should maintain the orignal format,
        "fileURL": "a string containing the file location"
    }
`;
};

// export const medSynopsisPrompt = (caseSummary: string, userSummary: string)=>{

// return `
// Strictly follow the instructions below to generate a summary based on the following criteria, and assign a score out of 20 for each criterion:

// 1. Accuracy: How accurately does the user's summary reflect the key points of the provided summary? If the user's summary is empty or lacks key points, score low.
// 2. Clarity and Conciseness: How clear and concise is the user's summary compared to the provided summary? If the user's summary is empty or unclear, score low.
// 3. Relevance: How relevant are the points in the user's summary to the provided summary? If the user's summary is empty or irrelevant, score low.
// 4. Organization and Structure: How well-organized and structured is the user's summary compared to the provided summary? If the user's summary is disorganized or empty, score low.
// 5. The total score should be the sum of the results from "Accuracy", "Clarity and Conciseness", "Relevance", and "Organization and Structure".
// 6. Strictly return a valid json of the following format:
// {
//     {
//     "Accuracy": number,
//     "Clarity and Conciseness": number,
//     "Relevance": number,
//     "Organization and Structure": number,
//     "Total Score": number,
//     }
// }
// 7.
// Provided summary: ${caseSummary}
// User's summary: ${userSummary}
// `;
// }
