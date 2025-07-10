import { SubPlanType } from 'src/revenuecat/enum/revenuecat.enum';
import {
  CaseResult,
  ClinExSub,
  Disabled,
  Result,
  SlideSub,
  Sub,
  UserThread,
} from '../entity/types.entity';

export const starterPlan: Sub = {
  plan: SubPlanType.STARTER,
  productId: 'starter',
  identifier: 'starter',
  isTrialPeriod: null,
  isActive: null,
  topUpCredits: 0,
  tokenBalance: 0,
  medicalTrivia: true,
  generalTrivia: true,
  multiplayerCapacity: '10',
  txtLimitPerOption: '125',
  maxNumQuestion: '100',
  imageUploadPerQues: '0',
  txtLimitPerQuestion: '200',
  storage: '1',
  credits: '50000',
  subCredits: 0,
};

export const proPlan: Sub = {
  plan: SubPlanType.PRO,
  productId: 'pro',
  identifier: 'pro',
  isTrialPeriod: false,
  isActive: true,
  topUpCredits: 0,
  tokenBalance: 1000000,
  medicalTrivia: true,
  generalTrivia: true,
  multiplayerCapacity: '50',
  txtLimitPerOption: '250',
  maxNumQuestion: 'Unlimited',
  imageUploadPerQues: '4',
  txtLimitPerQuestion: '350',
  storage: '5',
  credits: '1000000',
  subCredits: 1000000,
};

export const premiumPlan: Sub = {
  plan: SubPlanType.PREMIUM,
  productId: 'premium',
  identifier: 'premium',
  isTrialPeriod: false,
  isActive: true,
  topUpCredits: 0,
  tokenBalance: 2000000,
  medicalTrivia: true,
  generalTrivia: true,
  multiplayerCapacity: '100',
  txtLimitPerOption: 'Unlimited',
  maxNumQuestion: 'Unlimited',
  imageUploadPerQues: 'Unlimited',
  txtLimitPerQuestion: 'Unlimited',
  storage: '10',
  credits: '2000000',
  subCredits: 2000000,
};

export const slideStarterPlan: SlideSub = {
  plan: SubPlanType.STARTER,
  isActive: null,
  isTrialPeriod: null,
  subCredits: 0,
  tokenBalance: 20000,
  topUpCredits: 20000,
};

export const slideProPlan: SlideSub = {
  plan: SubPlanType.PRO,
  isActive: true,
  isTrialPeriod: false,
  subCredits: 1000000,
  tokenBalance: 1000000,
  topUpCredits: 0,
};

export const slidePremiumPlan: SlideSub = {
  plan: SubPlanType.PREMIUM,
  isActive: true,
  isTrialPeriod: false,
  subCredits: 2000000,
  tokenBalance: 2000000,
  topUpCredits: 0,
};

export const clinExStarterPlan: ClinExSub = {
  plan: SubPlanType.STARTER,
  isActive: null,
  isTrialPeriod: null,
  subCredits: 0,
  tokenBalance: 0,
  topUpCredits: 0,
  isTrialLC: false,
  isTrialSC: false,
};

export const clinExProPlan: ClinExSub = {
  plan: SubPlanType.PRO,
  isActive: true,
  isTrialPeriod: false,
  subCredits: 2000000,
  tokenBalance: 2000000,
  topUpCredits: 0,
  isTrialLC: false,
  isTrialSC: false,
};

export const clinExPremiumPlan: ClinExSub = {
  plan: SubPlanType.PREMIUM,
  isActive: true,
  isTrialPeriod: false,
  subCredits: 4000000,
  tokenBalance: 4000000,
  topUpCredits: 0,
  isTrialLC: false,
  isTrialSC: false,
};

export const quizzer: Result = {
  totalQA: 0,
  totalQBques: 0,
  totalTriQues: 0,
  totalPoints: 0,
  totalTimeTaken: 0,
  ranking: 0,
  cumulativeHours: '00:00:00',
  dailyAverage: '00:00:00',
  perceDailyAve: 0,
  dailyStreak: 0,
  weeklyStreak: 0,
  performance: {
    correct: 0,
    incorrect: 0,
    missed: 0,
    correctQB: 0,
    incorrectQB: 0,
    missedQB: 0,
  },
};

export const caseResults: CaseResult = {
  repeats: 10000,
  averageSpeed: 0,
  levels: {
    current: 1,
    previous: 1,
    lastTopLevel: 1,
    currentCount: 0,
    currentPoints: 0,
  },
};

export const accountStatus: Disabled = {
  isDisabled: false,
  dateDisabled: null,
};

export const threads: UserThread = {
  chatAssistant: null,
  caseRecall: null,
  clinicalExam: null,
};
