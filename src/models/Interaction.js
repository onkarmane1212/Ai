import mongoose, { Schema } from 'mongoose';

const ResponseSchema = new Schema(
  {
    mode: { type: String, enum: ['fantastical', 'logical'], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const InteractionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    responses: { type: [ResponseSchema], required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Interaction ||
  mongoose.model('Interaction', InteractionSchema);
