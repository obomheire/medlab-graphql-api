import { parseSegments } from 'src/utilities/service/helpers.service';
import {
  MasterOutlineTypes,
  SimulationInputDto,
  SimulationUpdateInputDto,
} from '../dto/chat-simulation.input';

const sampleOutline = `
      # 🧪 Biochemistry Roundtable | Episode 2

      ## 📋 Episode 2 Outline: The Citric Acid Cycle: Still the Powerhouse?
      - **Total Duration:** 30 min  
      - **Estimated Word Count:** ~5100 words

      ## 🎧 Description:
      The citric acid cycle—also known as the Krebs cycle—sits at the heart of metabolism, converting nutrients into usable energy and key intermediates for biosynthesis. But decades after it was first mapped, does this central metabolic hub still deserve the title of "powerhouse"?  
      In this episode, we revisit the biochemical choreography of the cycle, its links to energy production, its integration with other pathways, and how dysfunction can ripple across systems.  
      We also explore how new research into metabolism and mitochondrial dynamics continues to reframe the significance of this cycle in both health and disease.

      ## 🎯 Learning Objectives:
      ● Explain the structure, purpose, and sequence of the citric acid cycle  
      ● Describe how the cycle connects carbohydrate, fat, and protein metabolism  
      ● Understand regulatory mechanisms and feedback loops controlling the cycle  
      ● Identify clinical conditions linked to TCA cycle dysfunction (e.g., mitochondrial disorders, lactic acidosis)  
      ● Interpret relevant lab values and metabolic markers (e.g., lactate, pyruvate ratios, citrate levels)  
      ● Appreciate current research on mitochondrial function and metabolic rewiring in disease  

      ## 🔹 Segment Breakdown:

      ### Segment 1: Introduction  
      - **Duration:** 3 minutes  
      - **Word Count:** ~390 words  
      - **Purpose:**  
      Welcome listeners, introduce the focus on the citric acid cycle, and open with a striking fact (e.g., “Every cell in your body—except red blood cells—relies on this cycle to survive.”). Set the stage for re-evaluating its significance.

      ### Segment 2: Mapping the Cycle   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Walk through the structure and sequence of reactions in the citric acid cycle—acetyl-CoA entry, citrate formation, NADH/FADH₂ generation—and explain its energetic logic.

      ### Segment 3: Integration with Metabolism   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Discuss how the cycle intersects with glycolysis, beta-oxidation, amino acid metabolism, and gluconeogenesis. Highlight its central role in metabolic flexibility.

      ### Segment 4: Regulation & Feedback   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Explore enzymatic checkpoints (e.g., isocitrate dehydrogenase, alpha-ketoglutarate dehydrogenase), allosteric regulators, and energy-sensing mechanisms (e.g., NADH, ATP/ADP ratios).

      ### Segment 5: Clinical Disruptions   
      - **Duration:** 3 minutes  
      - **Word Count:** ~390 words  
      - **Purpose:**  
      Present disorders involving cycle disruption—mitochondrial disease, ischemia, thiamine deficiency—and how they manifest clinically. Introduce a brief case.

      ### Segment 6: Metabolic Clues in the Lab   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Cover labs and markers such as lactic acid, anion gap, ammonia, and TCA intermediates in plasma. Discuss patterns in metabolic acidosis and hypoxia.

      ### Segment 7: New Frontiers in Mitochondrial Science   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Delve into current research on mitochondrial dynamics, metabolic rewiring in cancer, and evolving views of the cycle as more than an energy pathway. Include a fun fact—e.g., “Some cancer cells rewire this cycle in reverse.”

      ### Segment 8: Summary & Takeaways   
      - **Duration:** 4 minutes  
      - **Word Count:** ~520 words  
      - **Purpose:**  
      Recap key concepts, highlight one memorable insight per host, and invite listeners to re-examine familiar pathways with fresh eyes. Tease the next episode without specifically announcing the topic but only raising their expectation to tune in again.

      ## 🎙 Sign-off line:
      “Until next time, stay curious—because molecules matter.”
`;

const outlineToJson = () => {
  return `
    1. Please rewrite the content of the uploaded file and return it as a json fornmat in the following struecture
    2. Do not include unnecessary characters such as ${'```json ```'} in the response.
    Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
        data: "The rewrite content"
    }
    `;
};

const masterOutlineToJson = (data: string) => `
  Strictly follow the instructions below:

  1. rewrite the following content: "${data}" and format it in a JSon format.
  2. Strictly ensure the grouping follows the original content format.
  2. Do not include unnecessary characters such as ${'```json ```'} in the response.
  3. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
      "data": "Formatted JSON content here"
  }
`;

// const masterOutlineToJson = (template: string) => {
//   return `
//       You are a structured podcast outline generator.

//       Your task is to generate a new episode outline based on a provided **Podcast Template** by studying the structure and logic of a **Sample Episode Outline**.

//       Please follow these rules:

//       1. Use the **Sample Episode Outline** below as a blueprint. Learn its structure, segment breakdown, host format, duration, word count, and the style of segment descriptions.
//       2. Apply that same structure to the new **Podcast Template** provided.
//       3. Use the template’s topic, style, and segment breakdown to generate a new detailed outline.
//       4. Maintain clear headers, markdown structure, and breakdowns for:
//         - Episode description
//         - Learning objectives (if implied or available)
//         - Segment titles, hosts, duration, word count, and purpose
//         - A short sign-off line at the end (if one is present in the sample)

//       ---

//       🎙️ SAMPLE EPISODE OUTLINE:
//       ${sampleOutline}

//       ---

//       🧬 NEW PODCAST TEMPLATE:
//       ${template}

//       ---

//       🎧 Please return the new outline in the same format and structure as the sample above.
//   `.trim();
// };

//Method for generating episode outline
const aiGeneratedOutline = (
  episodes: number,
  outline?: string,
  outlines?: MasterOutlineTypes[],
  prompt?: string,
) => {
  if (outlines && outlines?.length > 0) {
    return `
    Strictly follow the instructions below to generate a simulation episode outline:
  
    You are an AI content generator tasked with creating episode outlines for a real-world simulation app. Given a master outline as input, generate structured episode outlines based on the specified number of episodes. Each episode should have a clear title and a sequence of outline points that align with the master outline.
  
    provided outline: ${JSON.stringify(outlines, null, 2)}
    Instructions:
    1. ${prompt}
    2. Create the following number of episodes: "${episodes}" using the provided master outline: "${JSON.stringify(
      outlines,
      null,
      2,
    )}"
    3. Ensure each episode has a meaningful title and logically structured outline points as seen on the master outline.
    4. Maintain coherence and logical flow between episodes, preserving the narrative or learning structure of the simulation.
    5. Strictly ensure you remember the laste outline and title you provided so that when next you are generating new outline, you will pick from sections you haven't used from the template.
    6. Strictly ensure you follow the outline generation sequencially from the provided outline: "${JSON.stringify(
      outlines,
      null,
      2,
    )}"
    7. Do not include unnecessary characters such as ${'```json ```'} in the response.
    8. Ensure the output is formatted in strict JSON without any extra formatting, comments, or code blocks.
    
    [
      {
        "title": "string",
        "outline": ["string", "string"],
        episode: "Add what episode the title and outline belong to. Be sure to generate the epsiode serially. example: 1, 2, 3, 4, etc. as specified by the number of episodes
      }
    ]
  `;
  } else {
    return `
    Strictly follow the instructions below to generate a simulation episode outline:
    
    You are an AI content generator tasked with creating episode outlines for a real-world simulation app. Given a master outline as input, generate structured episode outlines based on the specified number of episodes. Each episode should have a clear title and a sequence of outline points that align with the master outline.
    
    Provided outline: ${outline}
    Instructions:
    1. Create the following number of episodes: "${episodes}" using the provided master outline: "${outline}".
    2. Focus on using **one topic or subtopic** from the master outline for each episode. However, if a topic or subtopic does not have enough information to generate meaningful content for an entire episode, combine it with closely related topics or subtopics to form a coherent episode.
    3. Ensure each episode has a **meaningful title** and logically structured outline points derived from the master outline.
    4. Maintain **coherence** and a **logical flow** between episodes, preserving the narrative or learning structure of the simulation.
    5. Generate the outlines **sequentially**, strictly following the order in the master outline, and ensure you continue from where you left off if generating more episodes later.
    6. Do not include unnecessary characters such as ${'```json ```'} in the response.
    7. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  
    Example JSON format:
    [
      {
        "title": "string",
        "outline": ["string", "string"],
        "episode": "Add the serial number of the episode, e.g., 1, 2, 3, etc., as specified by the number of episodes."
      }
    ]
  `;
  }
};

//Method for formatting master outline content into a desired outline
const manualAIGenerateOutline = (data: string) => `
  *"You are an AI content formatter tasked with transforming a detailed master outline into a structured JSON format. Given the input data, extract the main systems and their associated topics, ensuring proper formatting for clarity while preserving the original intent.

  provided master outline: ${data}
  Instructions:
  1. Extract the top-level keys as the 'system' field.
  2. Extract all sub-keys under each top-level key as 'topics'.
  3. Ensure the 'topics' are formatted into meaningful strings that summarize their intent while retaining the original information.
  4. Do not include unnecessary characters such as ${'```json ```'} in the response.
  5. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  
  [
  {
    "system": "string",
    "topics": ["string", "string"]
  }
  ]
`;

//This is for converting event template to markdown
const eventTemplateToMarkdown = (data: string) => {
  return `
  Strictly follow the instructions below:

  1. rewrite the following content: "${data}" and format it in a markdown format.
  3. Do not include unnecessary characters such as ${'```json ```'} in the response.
  3. Strictly ensure that you return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
  {
      "data": "Formatted Markdown content here"
  }
`;
};

//This is the prompt for creating the simulation
const simulationPrompt = (input: SimulationInputDto, userCustomPrompt = '') => {
  const {
    category,
    channelName,
    channelDescription,
    eventName,
    eventDescription,
    eventTemplate,
    episodeTitle,
    episodeTopics,
    noOfActors,
    characterDetails,
    noOfPanelist,
    duration,
    wordCount,
  } = input;

  const formattedTemplate = eventTemplate
    ? `- **Event Template Outline**:\n${eventTemplate}`
    : `- **Event Template Outline**:\n  (No event template provided; use default simulation structure based on given details)`;

  const formattedTopics =
    episodeTopics?.map((topic) => `- ${topic}`)?.join('\n') ??
    '(No topics provided)';

  const rolePlayers = characterDetails.filter(
    (character) =>
      character.role !== 'Panelist' && character.role !== 'Moderator',
  );
  const otherRoles = characterDetails.filter(
    (character) => character.role !== 'Doctor' && character.role !== 'Patient',
  );

  const formattedActorsCharacters =
    rolePlayers
      ?.map(
        (char) =>
          `- **Name**: ${char.name}\n  **Role**: ${char.role}\n  **Persona**: ${
            char.persona ?? 'N/A'
          }\n  **Quirks**: ${char.quirks ?? 'N/A'}\n  **Catchphrase**: ${
            char.catchPhrase ?? 'N/A'
          }`,
      )
      ?.join('\n\n') ?? '(No character details provided)';

  const formattedCharacters =
    otherRoles
      ?.map(
        (char) =>
          `- **Name**: ${char.name}\n  **Role**: ${char.role}\n  **Persona**: ${
            char.persona ?? 'N/A'
          }\n  **Quirks**: ${char.quirks ?? 'N/A'}\n  **Catchphrase**: ${
            char.catchPhrase ?? 'N/A'
          }`,
      )
      ?.join('\n\n') ?? '(No character details provided)';

  return `
    You are an AI assistant tasked with generating a simulation in the category "${category}". Use the details provided to create a dynamic simulation that aligns with the type of event or episode described. Adjust the simulation based on the roles, personas, and configured scenario details.

    ### Channel Details:
    - **Name**: ${channelName}
    - **Description**: ${channelDescription}

    ### Event Details:
    - **Name**: ${eventName}
    - **Description**: ${eventDescription}
    ${formattedTemplate}

    ### Episode Details:
    - **Title**: ${episodeTitle}
    - **Topics or outline**:
    ${formattedTopics}

    ### Role-Play Character Configuration:
    - **Number of Actors**: ${noOfActors}
    - **Character Details**:
    ${formattedActorsCharacters}

    ### Non Role-Play Character Configuration:
    - **Number of Panelists**: ${noOfPanelist}
    - **Character Details**:
    ${formattedCharacters}


    ### Simulation Requirements:
    - **Exclude actions or descriptions of what the speaker is doing before or during their speech.** Only include their spoken words and dialogue. For example, avoid phrases like "(standing in front of a model)" or "(pointing to a diagram)."
    - Adhere to the event template if provided. If no template is provided, structure the simulation with an introduction, topic-based interactions, and a closing summary. Use the moderator character for guiding the session, if applicable. The moderator should be one of the provided characters.
    - Ensure dialogue aligns with character roles, personas, and quirks.
    - Ensure the dialogue content is well written, engaging and very detailed without being too short.
    
    - Dialogue Length:
    - **Ensure the dialogue or content is at least 4,500 words**. **Do not generate fewer than 4,500 words.**

    ### Output Format:
         - Strictly ensure that generated simulation content is only in markdown format and doesn't contain characters or things that are not markdown syntax or style.
         - Return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
      "simulation": "Put simulation here"
    }

    ### User's Custom Instructions (Optional):
    ${userCustomPrompt}

    Please ensure all changes are incorporated while maintaining the integrity of the original simulation structure.
  `;
};

// Prompt for generating simulation one segment at a time
const _simulationPrompt = (
  simulationInputDto: SimulationInputDto,
  userCustomPrompt = '',
  currentSegmentIndex = 0,
) => {
  const {
    category,
    channelName,
    channelDescription,
    episodeTitle,
    episodeTopics,
    noOfActors,
    characterDetails,
    noOfPanelist,
    eventTemplate,
    eventDescription,
  } = simulationInputDto;

  const parsedSegments = parseSegments(eventTemplate); // Get the different segments from the event template

  const totalSegments = parsedSegments.length;
  const isFirstSegment = currentSegmentIndex === 0;
  const isLastSegment = currentSegmentIndex === totalSegments - 1;
  const currentSegment =
    parsedSegments[currentSegmentIndex] ?? 'Unknown Segment';

  // 🔹 Format topics
  const formattedTopics =
    episodeTopics?.map((topic) => `- ${topic}`)?.join('\n') ??
    '(No topics provided)';

  // 🔹 Format characters
  const rolePlayers = characterDetails.filter(
    (char) => char.role !== 'Panelist' && char.role !== 'Moderator',
  );
  const otherRoles = characterDetails.filter(
    (char) => char.role !== 'Doctor' && char.role !== 'Patient',
  );

  const formattedActorsCharacters =
    rolePlayers
      ?.map(
        (char) =>
          `- **Name**: ${char.name}\n  **Role**: ${char.role}\n  **Persona**: ${
            char.persona ?? 'N/A'
          }\n  **Quirks**: ${char.quirks ?? 'N/A'}\n  **Catchphrase**: ${
            char.catchPhrase ?? 'N/A'
          }`,
      )
      ?.join('\n\n') ?? '(No character details provided)';

  const formattedCharacters =
    otherRoles
      ?.map(
        (char) =>
          `- **Name**: ${char.name}\n  **Role**: ${char.role}\n  **Persona**: ${
            char.persona ?? 'N/A'
          }\n  **Quirks**: ${char.quirks ?? 'N/A'}\n  **Catchphrase**: ${
            char.catchPhrase ?? 'N/A'
          }`,
      )
      ?.join('\n\n') ?? '(No character details provided)';

  const basePrompt = `You are an AI assistant tasked with generating a podcast simulation in the category "${category}". Use the provided template and episode structure to generate the simulation one segment at a time.

  ---

  ### 🧩 Episode Template (Strict Format – Use It to Guide Each Segment):
  ${eventTemplate}

  ---

  ### Segment Structure:
  ${parsedSegments.map((seg, idx) => `${idx + 1}. ${seg}`).join('\n')}

  ---

  ### Current Segment (${
    currentSegmentIndex + 1
  } of ${totalSegments}): ${currentSegment}
  ${
    isFirstSegment
      ? `This is the **first segment**. Begin your output with:

  # ${episodeTitle}
  ## ${eventDescription ?? 'No description provided'}

  Then generate content for: **${currentSegment}**`
      : `Only generate content for: **${currentSegment}** (do not include title or description).`
  }

  ---

  ### Channel Details:
  - **Name**: ${channelName}
  - **Description**: ${channelDescription}

  ### Episode Topics:
  ${formattedTopics}

  ---

  ### Role-Play Characters:
  - **Number of Actors**: ${noOfActors}
  ${
    formattedActorsCharacters
      ? `\n**Actors**:\n${formattedActorsCharacters}`
      : ''
  }

  ---

  ### Panelists / Others:
  - **Number of Panelists**: ${noOfPanelist}
  ${formattedCharacters ? `\n**Others**:\n${formattedCharacters}` : ''}

  ---

  ### Dialogue & Output Format Rules:
  1. Dialogue must follow this exact format: **Character Name**: "Their line here."
  2. Do **not** include any narration, sound effects, or stage directions.
  3. Do **not** repeat intros, conclusions, or segment summaries.
  4. Markdown allowed only for:
    - # and ## (title + description in segment 1)
    - **Character Name:** if needed for clarity

  ---

  ### Output Format:
  Return only valid JSON as shown below:

  {
    "simulation": "[Generated content here]",
    "segmentIndex": ${currentSegmentIndex},
    "isLastSegment": ${isLastSegment}
  }

  ---

  ### Custom Instructions:
  ${userCustomPrompt || '(None provided)'}
`;

  return basePrompt;
};

//This is the prompt for updating simulation
const updateSimulationWithUserPrompt = (
  input: SimulationUpdateInputDto,
  userCustomPrompt: string,
) => {
  const {
    category,
    channelName,
    channelDescription,
    eventName,
    eventDescription,
    eventTemplate,
    episodeTitle,
    episodeTopics,
    noOfActors,
    characterDetails,
    episode,
    wordCount,
  } = input;

  const formattedUpdatedOutline = eventTemplate;

  const formattedUpdatedTopics = episodeTopics
    ? episodeTopics?.map((topic) => `- ${topic}`)?.join('\n')
    : 'No updates to episode topics provided.';

  const formattedUpdatedCharacters = characterDetails
    ? characterDetails
        .map(
          (char) =>
            `- **Name**: ${char.name}\n  **Role**: ${
              char.role
            }\n  **Persona**: ${char.persona ?? 'N/A'}\n  **Quirks**: ${
              char.quirks ?? 'N/A'
            }\n  **Catchphrase**: ${char.catchPhrase ?? 'N/A'}`,
        )
        .join('\n\n')
    : 'No updates to character details provided.';

  return `
      You are tasked with updating an existing simulation. The following are the updates for episode ID "${episode}" in event name "${eventName}":
  
      ### Simulation Details:
      - **Category**: ${category ?? 'No category update'}
      - **Channel Name**: ${channelName ?? 'No channel name update'}
      - **Channel Description**: ${
        channelDescription ?? 'No channel description update'
      }
  
      ### Event Details:
      - **Name**: ${eventName ?? 'No event name update'}
      - **Description**: ${eventDescription ?? 'No event description update'}
      - **Event Outline Template**:
      ${formattedUpdatedOutline}
  
      ### Episode Details:
      - **Title**: ${episodeTitle ?? 'No episode title update'}
      - **Topics**:
      ${formattedUpdatedTopics}
  
      ### Character Configuration:
      - **Number of Actors**: ${noOfActors}
      - **Character Details**:
      ${formattedUpdatedCharacters}
  
      ### Simulation Update Requirements:
      - Adjust the simulation content according to the provided updates.
      - Ensure the simulation remains engaging and aligned with the updated details.
      - Format the updated content strictly in markdown and return it in JSON format as shown below, without using code block formatting or comments:
      
      {
        "simulation": "Put updated simulation content here"
      }
  
      ### User's Custom Instructions:
      ${userCustomPrompt}
  
      Please ensure that all changes are incorporated according to the user's instructions while maintaining the integrity of the original simulation structure.
    `;
};

//This is the prompt for updating simulation
const _updateSimulationWithUserPrompt = (
  input: SimulationUpdateInputDto,
  userCustomPrompt: string,
) => {
  const {
    category,
    channelName,
    channelDescription,
    eventName,
    eventDescription,
    eventTemplate,
    episodeTitle,
    episodeTopics,
    noOfActors,
    characterDetails,
    episode,
    wordCount,
  } = input;

  const formattedUpdatedOutline = eventTemplate;

  const formattedUpdatedTopics = episodeTopics
    ? episodeTopics?.map((topic) => `- ${topic}`)?.join('\n')
    : 'No updates to episode topics provided.';

  const formattedUpdatedCharacters = characterDetails
    ? characterDetails
        .map(
          (char) =>
            `- **Name**: ${char.name}\n  **Role**: ${
              char.role
            }\n  **Persona**: ${char.persona ?? 'N/A'}\n  **Quirks**: ${
              char.quirks ?? 'N/A'
            }\n  **Catchphrase**: ${char.catchPhrase ?? 'N/A'}`,
        )
        .join('\n\n')
    : 'No updates to character details provided.';

  const basePrompt = `You are tasked with updating an existing simulation. The following are the updates for episode ID "${episode}" in event name "${eventName}":
  
      ### Simulation Details:
      - **Category**: ${category ?? 'No category update'}
      - **Channel Name**: ${channelName ?? 'No channel name update'}
      - **Channel Description**: ${
        channelDescription ?? 'No channel description update'
      }
  
      ### Event Details:
      - **Name**: ${eventName ?? 'No event name update'}
      - **Description**: ${eventDescription ?? 'No event description update'}
      - **Event Outline Template**:
      ${formattedUpdatedOutline}
  
      ### Episode Details:
      - **Title**: ${episodeTitle ?? 'No episode title update'}
      - **Topics**:
      ${formattedUpdatedTopics}
  
      ### Character Configuration:
      - **Number of Actors**: ${noOfActors}
      - **Character Details**:
      ${formattedUpdatedCharacters}
  
      ### Simulation Update Requirements:
      - Adjust the simulation content according to the provided updates.
      - Ensure the simulation remains engaging and aligned with the updated details.
  `;

  const instructions =
    wordCount > 1500
      ? `
    ### Guidelines:
    - **I want to have maximum control over the content generation process.
    - **Generate content only to the extent of the word count specified, dont conclude or summarize the content unitil I send the prompt "Conclude".
    - **Generate more content if i send the prompt "Generate more" and it should seemlessly align with the last point generated.
    - **Draw conclusions and summaries only when I send the prompt "Conclude" or "Summarize".
    - **Do not give any AI feedback or comments on the content generated just stick to the content generation.

    ### Instructions:
    - **For this request, generate the first part of the simulation with approximately ${wordCount} word count.**
    - **Do not exceed ${wordCount} word count. I will ask for the next batch of content in a follow-up prompt to continue the simulation until completion.**
    - **Do NOT add any conclusion, summary, or closing remarks at the end of this content. Treat this as an incomplete simulation that will continue.**
    `
      : `
    ### Simulation Length:
    - **Ensure the dialogue or content is at least ${wordCount} words.** **Do not generate fewer than ${wordCount} word count**
`;

  const outputFormat = `
    ### Output Format:
    - Strictly ensure that generated simulation content is only in markdown format and doesn't contain characters or things that are not markdown syntax or style.
    - Return the output strictly in JSON format as follows without using code block formatting and without any additional comments before or after the JSON object:
    {
      "simulation": "Put simulation here"
    }

    ### User's Custom Instructions (Optional):
    ${userCustomPrompt}

    Please ensure that all changes are incorporated according to the user's instructions while maintaining the integrity of the original simulation structure.
`;

  return `${basePrompt}\n${instructions}\n${outputFormat}`;
};

//This is the prompt for converting generated simulation into desired json format
const formatSimulationToJson = (simulation: string, speakers: any[]) => {
  return `
Extract the following text: "${simulation}" into a JSON array format. Each item in the array should represent either a heading or a speaker's conversation.

You MUST process the **entire input text** line-by-line or section-by-section, without skipping or omitting any content. Maintain the order of appearance. Do not merge separate lines into a single conversation object unless they are part of the same speaker's uninterrupted speech.

### Formatting Rules:

1. **Headings**:
   - If a line is a heading (starts with "#", "##", or "###"):
     - Create an object with:
       - "name": ""
       - "image": ""
       - "gender": ""
       - "conversation": [the full heading text]

2. **Speaker Dialogues**:
   - If a line begins with a speaker’s name (e.g., "Dr. Valentine Bassey:", "**Moderator (Dr. Olivia Martin):**", etc.):
     - Extract the speaker name **exactly as it appears** (including roles or parentheses).
     - Match the name against the provided array of speakers:
       ${JSON.stringify(speakers, null, 2)}
     - If a match is found, use the corresponding "image" and "gender".
     - If no match is found, set "image" and "gender" to "".
     - Remove the speaker’s name from the conversation text.
     - Set only the spoken content as the value for "conversation".

3. **General Requirements**:
   - Trim unnecessary whitespace or formatting.
   - Do not skip or ignore any part of the input.
   - Process the input incrementally, line-by-line if necessary.
   - Use **at most 5 items** per response in the "data" array.

4. **Output Format**:
   - Must return **valid strict JSON**.
   - Do **not** wrap it in \`\`\`json or any markdown formatting.
   - Do **not** include comments or explanations — just return the JSON.

5. **Sample Output**:
{
  "data": [
    {
      "name": "",
      "image": "",
      "gender": "",
      "conversation": "# Care Conversations Simulation: Understanding Spatial Relationships in Anatomy"
    },
    {
      "name": "",
      "image": "",
      "gender": "",
      "conversation": "## Introduction"
    },
    {
      "name": "Moderator (Dr. Olivia Martin)",
      "image": "https://d1p9fc0i566fiv.cloudfront.net/logo-images/chat-simulation/Dr-Olivia-Martin.png",
      "gender": "female",
      "conversation": "Welcome to our Care Conversations episode on understanding spatial relationships in anatomy. Today, we're going to explore how this knowledge is essential in medical practice..."
    },
    {
      "name": "",
      "image": "",
      "gender": "",
      "conversation": "## Segment 1: Importance of Spatial Relationships in Anatomy"
    },
    {
      "name": "Dr. Nadia Hussein",
      "image": "",
      "gender": "female",
      "conversation": "Good health starts with understanding—let’s figure this out together! Spatial relationships in anatomy help us comprehend how structures interact within the body..."
    }
  ],
  "isLastData": false
}

6. **Pagination Instructions**:
   - Only return a maximum of 5 items in the "data" array per response.
   - If the current output does **not** cover the full simulation, set:
     "isLastData": false
   - Only set:
     "isLastData": true
     when **all** of the simulation text has been processed.
   - Wait for the next command **"next data"** to continue returning the next 5 entries.
   - Do not return anything unless you are processing a new simulation input or responding to "next data".

REMEMBER: You must include 100% of the simulation text across all paginated outputs.
`;
};

export {
  outlineToJson,
  eventTemplateToMarkdown,
  simulationPrompt,
  _simulationPrompt,
  updateSimulationWithUserPrompt,
  _updateSimulationWithUserPrompt,
  masterOutlineToJson,
  aiGeneratedOutline,
  manualAIGenerateOutline,
  formatSimulationToJson,
};
