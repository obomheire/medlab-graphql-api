/* eslint-disable prettier/prettier */
export enum MyQBType {
  MYQB = 'My Question Bank',
  OPEN_ENDED = 'Open Ended Question',
}

export enum EngageType {
  QUIZ = 'QUIZ',
  POLL = 'POLL',
  Q_AND_A = 'Q_AND_A',
}

export enum PresQuizType {
  MCQ="Multichoice",
  OPEN_ENDED="Open Ended Question"
}

export enum NewQIdType {
  NEWQID = 'new-question-id',
}

export enum SubEventType {
  SUBSCRIBED_DATA = 'subscribedData',
}

export enum TimerType {
  COUNT_DOWN_PER_QUESTION = 'count down per question',
  ALL_TIME = 'all time',
}

export enum CategoryType {
  MEDICAL_TRIVIA = 'Medical Trivia',
  BASIC_SCIENCES = 'Basic Sciences',
  CLINICAL_SCIENCES = 'Clinical Sciences',
  MEDICAL_EXAMS = 'Medical Exams',
}

export enum UsmleQuestionType {
  TRADITIONAL_SINGLE_BEST = "Traditional Single Best Answer",
  MULTIPART = "Multipart"
}

export enum Difficulty {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "Hard"
}

export enum GameStateType {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  ONGOING = 'ONGOING',
}

export enum ModeType {
  ESSAY = 'ESSAY',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  ONGOING = 'ONGOING',
}

export enum QuestionType {
  ESSAY = 'ESSAY',
  TRUE_OR_FALSE = 'TRUE_OR_FALSE',
  MULTICHOICE = 'MULTICHOICE',
  SINGLECHOICE = 'SINGLECHOICE',
  USMLE_STEP1 = 'USMLE STEP 1',
  USMLE_STEP2 = 'USMLE STEP 2 CK',
  PLAB1 = 'PLAB 1',
  AMC1 = 'AMC 1',
  RACP1 = 'RACP 1',
  RACGP_AKT = 'RACGP (AKT)',
  RACGP_KFP = 'RACGP (KFP)',
  NCLEX_RN = 'NCLEX RN',
  NCLEX_PN = 'NCLEX PN',
  MEDSYNOPSIS = 'MEDSYNOPSIS',
  EXTENDED_MATCHING = 'EXTENDED MATCHING',
  OPEN_ENDED_LONG_FORM = 'OPEN ENDED LONG FORM',
  OPEN_ENDED_SHORT_FORM = 'OPEN ENDED SHORT FORM',
  DX_QUEST = 'DX QUEST',
  PROBLEM_LIST_EVALUATION = 'PROBLEM LIST EVALUATION',
  MED_MATCH = 'MED MATCH',
  BROAD_SCOPE_QUIZ = 'BROAD SCOPE QUIZ',
}

export enum CaseStatusType {
  DEMOTED = 'DEMOTED',
  REPEAT_LEVEL = 'REPEAT_LEVEL',
  NEXT_LEVEL = 'NEXT_LEVEL',
}

export enum LeaderBoardEventsType {
  ADD_SCORE = 'LEADERBOARD.RECORD_SCORE',
}


export enum UserScoreType {
  MULTIPLE_CHOICE = 'MULTICHOICE',
  OPEN_ENDED = 'OPEN ENDED QUESTION',
}
