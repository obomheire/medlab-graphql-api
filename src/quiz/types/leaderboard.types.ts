import { UserDocument } from 'src/user/entity/user.entity';

export type RecordScoreType = {
  points: number;
  timeTaken: number;
  region?: string;
  component: string;
  subComponent?: string;
  user: UserDocument;
};
