import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  displayName: string;
  email: string;
  passwordHash: string;
  primaryProvider: string;
  personaId: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  primaryProvider: { type: String, required: true },
  personaId: { type: String, required: true },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

export default mongoose.model<IUser>('User', UserSchema);