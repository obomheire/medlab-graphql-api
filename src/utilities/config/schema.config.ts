export const mongooseSchemaConfig = {
  id: true,
  versionKey: false,
  timestamps: true,
  autoIndex: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      // TODO: delete all fields not required on the frontend
      delete ret.password;
      delete ret.refreshToken;
      delete ret.otp;
      delete ret.otpExpiry;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.otp;
      delete ret.otpExpiry;
      return ret;
    },
  },
};
