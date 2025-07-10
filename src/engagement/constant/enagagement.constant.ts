import { AIEngagementDto } from '../dto/engagement.dto';

export const presCommentReplyPrompt = (payload: AIEngagementDto) => {
  const { parentMessage, childMessage } = payload;
  return `
    Based on the presentation that have been generated, and from the previous conversation between the both of you, please reply the following comment: ${childMessage} as though you are a human.
    Here is the previous conversation between the both of you: ${parentMessage}.

    Strictly return the response as a string.
    `;
};
export const presQuestionReplyPrompt = (payload: AIEngagementDto) => {
  const { parentMessage, childMessage } = payload;
  return `
    Based on the presentation that have been generated, and from the previous conversation between the both of you, please reply the following question: ${childMessage} as though you are a human.
    Here is the previous conversation between the both of you: ${parentMessage}.

    Strictly return the response as a string.
    `;
};

export const channelCommentReplyPrompt = (payload: AIEngagementDto) => {
  const { parentMessage, childMessage } = payload;
  return `
    Based on the channel that have been generated, and from the previous conversation between the both of you, please reply the following comment: ${childMessage} as though you are a human.
    Here is the previous conversation between the both of you: ${parentMessage}.

    Strictly return the response as a string.
    `;
};

export const channelQuestionReplyPrompt = (payload: AIEngagementDto) => {
  const { parentMessage, childMessage } = payload;
  return `
    Based on the channel that have been generated, and from the previous conversation between the both of you, please reply the following question: ${childMessage} as though you are a human.
    Here is the previous conversation between the both of you: ${parentMessage}.

    Strictly return the response as a string.
    `;
};

export const presCommentPrompt = (threadId: string, manualPrompt: string) => {
  if (threadId) {
    return `
    I want you to generate a comment for the presentation that will be used as a conversation starter while the presentation is being delivered. Be sure to keep it short and concise. And also make it look like a real human conversation. 
    For example, "Hello everyone, I guess we all are still following up on The Impact of So cial Media on Adolescent Mental Health right?
    
    Strictly return the response as a string.
    `;
  } else {
    return `
    I want you to generate a comment for the presentation that will be used as a conversation starter while the presentation is being delivered. Be sure to keep it short and concise. And also make it look like a real human conversation. 
    For example, "Hello everyone, I guess we all are still following up on The Impact of So cial Media on Adolescent Mental Health right?

    - Strictly use the following details as guide for the comment based on the presentation:
    ${manualPrompt}

    Strictly return the response as a string.
    `;
  }
};

export const presQuestionPrompt = (threadId: string, manualPrompt: string) => {
  if (threadId) {
    return `
    I want you to generate a question for the presentation that will be used as a question conversation starter while the presentation is being delivered. Be sure to keep it short and concise. 
    For example, "Hello everyone, who can tell me what is the impact of social media on adolescent mental health?
    
    Strictly return the response as a string.
    `;
  } else {
    return `
        I want you to generate a question for the presentation that will be used as a question conversation starter while the presentation is being delivered. Be sure to keep it short and concise. 
        For example, "Hello everyone, who can tell me what is the impact of social media on adolescent mental health?

        - Strictly use the following details as guide to know what to ask based on the presentation:
        ${manualPrompt}

        Strictly return the response as a string.
        `;
  }
};
export const channelCommentPrompt = () => {
  return `
    I want you to generate a comment for the channel that will be used as a conversation starter while the channel is being delivered. Be sure to keep it short and concise. And also make it look like a real human conversation. 
    For example, "Hello everyone, I guess we all are still following up on The Impact of Social Media on Adolescent Mental Health right?
    
    Strictly return the response as a string.
    `;
};

export const channelQuestionPrompt = () => {
  return `
    I want you to generate a question for the channel that will be used as a question conversation starter while the channel is being delivered. Be sure to keep it short and concise. 
    For example, "Hello everyone, who can tell me what is the impact of social media on adolescent mental health?
    
    Strictly return the response as a string.
    `;
};
