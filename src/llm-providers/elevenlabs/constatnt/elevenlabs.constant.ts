export const systemPrompt = {
  examiner1: `
       You are an AI examiner in a simulated RACP clinical exam for doctors. Your role is to evaluate candidates in a long case discussion. Your behavior must ensure fairness, consistency, and high standards in clinical assessment. You will conduct this assessment by asking the doctor structured and professional questions one at a time.

      **Available Resources:**
      1. **Case Detail File:** Provides an overview of the patient's condition and includes a list of recommended questions under the heading **'Examiner 1 Questions.'**

      **Assessment Flow:**
      1. Immediately proceed to ask the first question from the **'Examiner 1 Questions'** list.
      2. Questions: Ask one question at a time, ensuring each is **relevant** to the case. You may ask follow-up questions based on the doctor’s responses.
      3. Continuation: Once you have completed the questions from the list, continue asking additional relevant and topic-appropriate questions based on the case and the candidate’s responses until their allocated time runs out.

      **Instructions:**
      1. Ask **one question at a time**, without announcing you're referencing the question list.
      2. Do **not** repeat questions the doctor has already answered. Move on to another relevant question.
      3. Maintain a **professional, structured, and engaging tone** throughout.
      4. If the doctor's response is unclear, ask for **clarification** politely.

      Your role is critical in ensuring a structured and fair evaluation of the doctor’s clinical reasoning and decision-making skills. Maintain professionalism, clarity, and a neutral stance throughout the assessment.

      Guidelines:
      - Use a friendly and professional tone throughout the conversation.
      - Be patient and attentive to the student doctor.
      - If unsure about any information, politely ask the student to repeat or clarify.
      - Do not provide an feedback that indicate if the question was answered correctly or wrong.
      - Avoid giving clues of any question answer to the student doctor.
      - Do not provide any support or assistant just ask the questions and move to the next question
      - You not a helpful agent but am examiner, do not provide anything other than asking questions and when you are done with the question thank the candidate and terminate.
`,
  examiner2: `
        You are an AI examiner in a simulated RACP clinical exam for doctors. Your role is to evaluate candidates in a long case discussion. Your behavior must ensure fairness, consistency, and high standards in clinical assessment. You will conduct this assessment by asking the doctor structured and professional questions one at a time.

        **Available Resources:**
        1. **Case Detail File:** Provides an overview of the patient's condition and includes a list of recommended questions under the heading **'Examiner 2 Questions.'**

        **Assessment Flow:**
        1. Questioning: Start by asking the first question from the **'Examiner 2 Questions'** list.
        2. Time Management: Use about 5 minutes for your questioning. Be flexible with the timing if the candidate finishes early.
        3. Hand-off: After asking the last question and receiving the doctor’s response, **conclude the assessment professionally** by thanking the doctor.

        **Instructions:**
        1. Ask **one question at a time**, ensuring it is **relevant** to the patient case. While there is a list of pre-provided questions, you are free to ask additional relevant questions that enhance the assessment.
        2. **Do not announce or state that you are checking the list of questions** simply proceed with asking the next appropriate question.
        3. If a doctor has already answered a question in a previous response, **do not repeat that question**. Instead, proceed to a different relevant question.
        4. Maintain a **professional, structured, and engaging tone** throughout the assessment.
        5. If the doctor's response is unclear, politely ask for **clarification**.
        6. End the conversation without adding unnecessary statements

        Your role is critical in ensuring a structured and fair evaluation of the doctor’s clinical reasoning and decision-making skills. Maintain professionalism, clarity, and a neutral stance throughout the assessment.

        Guidelines:
        - Use a friendly and professional tone throughout the conversation.
        - Be patient and attentive to the student doctor.
        - If unsure about any information, politely ask the student to repeat or clarify.
        - Do not provide an feedback that indicate if the question was answered correctly or wrong.
        - Avoid giving clues of any question answer to the student doctor.
        - Do not provide any support or assistant just ask the questions and move to the next question
        - You not a helpful agent but am examiner, do not provide anything other than asking questions and when you are done with the question thank the candidate and terminate.
`,
};

// examiner 1 First Message: Thank you for your presentation.
// Examiner 2 First Message: I have more questions for you shall we proceed?

export const goalPrompt = {
  examiner1: `
      Evaluate if the conversation is successful.
      Success criteria:
      - Candidate was informed to start the presentation
      - Candidate has completed the presentation and it was professional acknowledge
      - All questions in the list of questions have been asked
      - Candidate has responded to all the questions
      Return "success" only if ALL criteria are met.
    `,
  examiner2: `
      Evaluate if the conversation is successful.
      Success criteria:
      - All questions in the list of questions have been asked
      - Candidate has responded to all the questions
      Return "success" only if ALL criteria are met.
    `,
};

export const maleVoiceId = [
  'Mu5jxyqZOLIGltFpfalg', // Dr Nikolai Ivanov
  '6xPz2opT0y5qtoRh1U1Y', // Dr Noor Alam
  'XjLkpWUlnhS8i7gGz3lZ', // Dr Oscar Lindgren
  'c6SfcYrb2t09NHXiT80T', // Dr Ramirez Berger
  'FWipwLM0YqCuwisLprpU', // Dr Sebastian Fischer
  'MZoSIADKupTWpjTR8Ovt', // Dr Simon Roberts
  'tQbs4WJdeIOdank6mubQ', // Dr Solomon Tadesse
  'a4CnuaYbALRvW39mDitg', // Dr Tariq Mahmood
  'QIhD5ivPGEoYZQDocuHI', // Dr Thabo Mokoena
  'TVtDNgumMv4lb9zzFzA2', // Dr Tobias Müller
  'UQ15q3Vf9AQQ2owcMKQ0', // Dr Victor Popov
  'S9WrLrqYPJzmQyWPWbZ5', // Dr Victor Roberts
  '1SM7GgM6IMuvQlz2BwM3', // Edward Collins
  'sflYrWiXii4ezPjNLQkp', // James Mitchell
  'By0UcwKGzdBf2bf15UtI', // Javier Cruz
  '15CVCzDByBinCIoCblXo', // Daniel Evans
  '9N8nIBnvZ0Hbs6qhIqpt', // Dr Adrian Schmidt
  'lz8GwcCT7QhnDXubTHO3', // Dr Ahmed Khalil
  'qIT7IrVUa21IEiKE1lug', // Dr Ahmed Yusuf
  'pYZE1337lBWuhle0xzSs', // Dr Alejandro Guzman
  '8sGzMkj2HZn6rYwGx6G0', // Dr Antoine Dupont
  'EP3g1wv2wIp7Hc96Sf4l', // Dr Anton Romanov
  '1ZXayGDipe9g7pUvzFcX', // Dr Arjun Mehta
  '06oPEcZqPWhZ2IeTcOJc', // Dr Arturo Rivera
  'ChO6kqkVouUn0s7HMunx', // Dr Benjamin Carter
  '5gcJMSHPvZx5Ja5NGaUl', // Dr Diego Ramirez
  '0Eut1K2uVqd2FAP2i4XV', // Dr Emil Weber
  'QszKqg4xY6s7JxgLLLux', // Dr Erik Johansson
  'X4Lh5Ftnso6JSt25plzX', // Dr Ezekiel Abebe
  'TZl0VZDEkMLBwlPLAKD9', // Dr Felix Schneider
  '4rwC6xlwNjrg40xWm8Vb', // Dr Gabriela Santos
  'fxSqnnuGtAB8leClmZ3q', // Dr Hassan Fathi
  'apqgWHkh7foVKMqZECss', // Dr Henry Walker
  'vRiW8gVSMIVJXaMhNy2V', // Dr Javier Morales
  'dZUDKQDfSHNzYzM1epKR', // Dr Junko Yamada
  '69Na567Zr0bPvmBYuGdc', // Dr Kiran Mehta
  'wx2sVpfpse2n4u4YdP7y', // Dr Kiran Shrestha
  'pwMBn0SsmN1220Aorv15', // Dr Liam O'Connor
  'SF9uvIlY93SJRMdV5jeP', // Dr Lucas Berger
  'FGlwXbxtvHyuRiEubkZg', // Dr Musa Keita
  '5dplqOhgUovJZ05lS9a8', // Dr Mustafa Al-Rashid
  'ookcfIYgQDpBT5ueX6gr', // Jeremy Wood
  'f5HLTX707KIM4SzJYzSz', // Nathaniel White
  'gYr8yTP0q4RkX1HnzQfX', // Ayodele Akinpelu
  'IALR99tcrXPFq9f7zuST', // Prof Chidi Nwosu
  '9dxmWhLHLu4Q8LyiI0GI', // Prof David Walker
  'bEkygZIAAljTwtKu3SDD', // Prof Malik Robinson
  'qAZH0aMXY8tw1QufPN0D', // Prof Morgan Evans
  'zZLmKvCp1i04X8E0FJ8B', // Prof Pedro Alvarez
  '6gRQLqLxbhpnX3JtUvf8', // Prof Rajesh Iyer
  'lnieQLGTodpbhjpZtg1k', // Prof Naveen Ramesh
  'gOkFV1JMCt0G0n9xmBwV', // Prof Santiago Miguel
  'UgBBYS2sOqTuMpoF3BR0', // Sebastian Clarke
]; // 53 male voiceIds

export const femaleVoiceId = [
  '56AoDkrOh6qfVPDXZ7Pt', // Dr Nadia Hussein
  '5l5f8iK3YPeGga21rQIX', // Dr Olivia Martin
  'acCWxmzPBgXdHwA63uzP', // Dr Rivera Lohan
  'XfNU2rGpBa01ckF309OY', // Dr Veronika Andreeva
  'SaqYcK3ZpDKBAImA8AdW', // Dr Zainab Qureshi
  'zGjIP4SZlMnY9m93k97r', // Emily Baker
  'OYTbf65OHHFELVut7v2H', // Grace White
  'pjcYQlDFKMbcOUp6F5GD', // Isabella Turner
  'g6xIsTj2HwM6VR4iXFCw', // Isla Parker
  'eBvoGh8YGJn1xokno71w', // Amelia Carter
  'P7x743VjyZEOihNNygQ9', // Amina Muhammed
  'kPzsL2i3teMYv0FxEYQ6', // Ava Thompson
  'WAhoMTNdLdMoq1j3wf3I', // Camila Mendoza
  'Z3R5wn05IrDiVCyEkUrK', // Charlotte Hughes
  'XcXEQzuLXRU9RcfWzEJt', // Dr Alessandra Rossi
  'rSZFtT0J8GtnLqoDoFAp', // Dr Beatriz García
  'WtA85syCrJwasGeHGH2p', // Dr Caitlynn Scott
  '9RpXYdocFG8u7K3pqNxi', // Dr Clara Hoffmann
  'aMSt68OGf4xUZAnLpTU8', // Dr Claudia Rojas
  'DJpgP3rIDYoqtCH3IzV6', // Dr Eliza Novak
  'q6bboItSc3laqmM0fge1', // Aisha Patel
  'rCuVrCHOUMY3OwyJBJym', // Dr Hannah Simon
  'Kx485Z9dUCufrWYpKMSR', // Dr Helena Bauer
  'ZIlrSGI4jZqobxRKprJz', // Dr Ingrid Svensson
  'aVR2rUXJY4MTezzJjPyQ', // Dr Isabella Morgan
  '25bLwNw4T14AIILU3SLV', // Dr Isabella Laurent
  'JAATlCsz6GCH2vUjFcLg', // Dr Katrina Novak
  'dvcWDtDpjMuyqdgVg3Hu', // Dr Laura Garcia
  'esy0r39YPLQjOczyOib8', // Dr Margot Dupuis
  'RILOU7YmBhvwJGDGjNmP', // Dr Melinda Hose
  '8N2ng9i2uiUWqstgmWlH', // Dr Monica Rivera
  'FVQMzxJGPUBtfz1Azdoy', // Lily Brooks
  'iCrDUkL56s3C8sCRl7wb', // Mei Lin
  'aEO01A4wXwd1O8GPgGlF', // Mia Collins
  'ZF6FPAbjXT4488VcRRnw', // Olivia Morgan
  'O4fnkotIypvedJqBp4yb', // Professor Maddie
  'iBo5PWT1qLiEyqhM7TrG', // Prof Huxtable Drew
  'i4CzbCVWoqvD0P1QJCUL', // Prof Mei Ling Zhang
  'xctasy8XvGp2cVO9HL9k', // Prof Marissa Dupont
  'yM93hbw8Qtvdma2wCnJG', // Sofia Walker
]; // 40 female voiceIds

export const voiceIdMale = [
  'abRFZIdN4pvo8ZPmGxHP',
  '9Ft9sm9dzvprPILZmLJl',
  'FoD619dn9b25wYA1kTvP',
  'pXgsayqpmuFfzTsJw2ni',
  'aGkVQvWUZi16EH8aZJvT',
  'gZ25QC7GHcbM4iwAqulk',
  'DwI0NZuZgKu8SNwnpa1x',
  'CSLdrbACzvkqj80B7bhr',
  '3DkcznWTIDSnX3f0J6DG',
  'cdZvTWMWZZID3MSEDICu',
  'S1vQbaBCz1Dxb56cN9sj',
  'YCxeyFA0G7yTk6Wuv2oq',
  'OXaewnVEYEfSVLyXCDds',
  'cjwXchLLF0a3P7QhvU7K',
  'jyYV4jm5Wq39qXvc4ERa',
  'XqQs8EWT9PoCbufUDt5R',
  'DRlG3sCruUoZwJapUY0U',
  'emNETt9bfkECEZrrqDQS',
  '2nzji8yPQooBwG4eQO4s',
  'NMbn4FNN0acONjKLsueJ',
  'mWNaiDAPDAx080ro4nL5',
  'tWGXkYJGea4wMBN4mLD1',
  'nCU9XO4PaNXRJPa3CLUn',
  'V9nqzC5CH3k65H4HrO1D',
  'HDA9tsk27wYi3uq0fPcK',
  'WLKp2jV6nrS8aMkPPDRO',
  'loQD3CIxowi7eCEHd4m9',
  'IKne3meq5aSn9XLyUdCD',
  'ZQe5CZNOzWyzPSCn5a3c',
];

export const voiceIdFemale = [
  'NihRgaLj2HWAjvZ5XNxl',
  'LXy8KWda5yk1Vw6sEV6w',
  'sx8pHRzXdQfuUYPGFK7X',
  '6gviCf27bOZ2Wml5iZZv',
  'ys3XeJJA4ArWMhRpcX1D',
  'MiueK1FXuZTCItgbQwPu',
  'paRTfYnetOrTukxfEm1J',
  'Hgfor6xcJTM3hCSKmChL',
  'nBoLwpO4PAjQaQwVKPI1',
  '81uhY78bI7LM87zxvajR',
  'lNABL6eI3BpPT8BvSqjK',
  'QhzTYkz7VbKNwVeK3URf',
  'aEO01A4wXwd1O8GPgGlF',
  'luVEyhT3CocLZaLBps8v',
  'p43fx6U8afP2xoq1Ai9f',
  'M7ya1YbaeFaPXljg9BpK',
  'wONZP9eHujJUQu9Tfode',
  'Rpg8Sn3cVL1f8658yYm2',
  'LtPsVjX1k0Kl4StEMZPK',
  'Dh68koMHNSYl8A1jH9Je',
];
