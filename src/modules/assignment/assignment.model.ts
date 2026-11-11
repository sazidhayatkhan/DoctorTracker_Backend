import { Schema, model, Document, Types } from "mongoose";

/** A patient assigned to a doctor for a given condition */
export interface IAssignment extends Document {
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  condition: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    condition: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ doctor: 1, patient: 1 }, { unique: true });
assignmentSchema.index({ patient: 1 });

const Assignment = model<IAssignment>("Assignment", assignmentSchema);

export default Assignment;
