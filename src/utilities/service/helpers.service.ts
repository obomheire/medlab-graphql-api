import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { AppType } from 'src/stripe/enum/sub.plan.enum';
import { FileUpload } from 'graphql-upload/GraphQLUpload.js';
import { Readable } from 'stream';

/* eslint-disable prettier/prettier */
export function exclude<T>(
  obj: T,
  keys: (keyof T)[],
): Omit<T, (typeof keys)[number]> {
  const result = {} as T;
  for (const key in obj) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result as Omit<T, (typeof keys)[number]>;
}

export function convertTimeToNumber(timeTaken) {
  const minutes = timeTaken?.split(':')[0];

  if (Number(minutes) <= 10) {
    const extractMinute = minutes[minutes.length - 1];
    return Number(extractMinute);
  } else {
    return Number(minutes);
  }
}

function timeToSeconds(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

export function convertTimeToSeconds(timeStr) {
  const [minutes, seconds] = timeStr.split(':').map(Number);

  return minutes * 60 + seconds;
}

export function calculateTimeScore(time) {
  const excellent = timeToSeconds('15:00');
  const good = timeToSeconds('20:00');
  const fair = timeToSeconds('30:00');
  const poor = timeToSeconds('31:00');

  const completionTime = timeToSeconds(time);

  const maxScore = 20;

  if (completionTime < excellent) {
    return maxScore;
  } else if (completionTime > excellent && completionTime < good) {
    return 17;
  } else if (completionTime > good && completionTime < fair) {
    return 13;
  } else if (completionTime > poor) {
    return 9;
  }
}

// Validate AI message
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (error) {
    return false;
  }
  return true;
}

export const getPagination = async <ModelType, queryType, DocType>(
  dbModel: Model<ModelType>,
  query: queryType,
  document: DocType[],
  limit: number,
  page: number,
): Promise<any> => {
  try {
    const count = await dbModel.countDocuments(query); // Count document

    const totalPages = Math.ceil(count / limit);

    const pagination = {
      totalRecords: count,
      totalPages,
      pageSize: document.length,
      prevPage: page > 1 ? page - 1 : null,
      currentPage: page,
      nextPage: page < totalPages ? page + 1 : null,
    };

    return pagination;
  } catch (error) {
    throw new BadRequestException(error.message);
  }
};

export const getStripeCusField = (app: AppType, isCusUUID?: boolean) => {
  let stripeCusField: string;

  if (isCusUUID) {
    stripeCusField =
      app === AppType.MEDSCROLL_SLIDE
        ? 'stripeSlideCust.stripeCustomerUUID'
        : app === AppType.MEDSCROLL_CLINICAL_EXAMS
        ? 'stripeClinExCust.stripeCustomerUUID'
        : 'stripeCustomer.stripeCustomerUUID';
  } else {
    stripeCusField =
      app === AppType.MEDSCROLL_SLIDE
        ? 'stripeSlideCust'
        : app === AppType.MEDSCROLL_CLINICAL_EXAMS
        ? 'stripeClinExCust'
        : 'stripeCustomer';
  }

  return stripeCusField;
};

export const retryWithDelay = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay)); // Delay before retry
      }
    }
  }
  throw lastError;
};

// Convert text to .txt file
export const textToFileUpload = async (
  text: string,
  filename = 'transcript.txt',
): FileUpload => {
  return {
    filename,
    mimetype: 'text/plain',
    encoding: 'utf-8',
    createReadStream: () => Readable.from([text]),
  };
};

// Convert file stream to buffer
export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

// Parse segments from event template
export const parseSegments = (eventTemplate: string): string[] => {
  const segmentRegex = /^\|\s*(?:\*\*)?(\d+\.\s+.+?)(?:\*\*)?\s*\|/gm;
  const segments: string[] = [];

  let match: RegExpExecArray | null;

  while ((match = segmentRegex.exec(eventTemplate)) !== null) {
    segments.push(match[1].trim());
  }
  return segments;
};

// Convert duration in seconds to HH:MM:SS format
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
};
