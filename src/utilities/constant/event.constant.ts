export const EVENT_ENUMS = {
  VERIFY_TOKEN: 'verify.token',
  UPDATE_ACTIVE_HOURS: 'update.active.hours',
  PLAY_GAME: 'play.game',
  QUIZ_UPDATE_QUESTION_NO: 'quiz.updateQuestionNo',
};

export class EventEmitterData {
  userUUID: string;
  disconnectAt: Date;
  connectedAt: Date;

  constructor(userUUID: string, disconnectAt: Date, connectedAt: Date) {
    this.userUUID = userUUID;
    this.disconnectAt = disconnectAt;
    this.connectedAt = connectedAt;
  }
}
