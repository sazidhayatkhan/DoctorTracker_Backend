
import { Schema, model, Document, Types } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  phone: string;
  hospital: Types.ObjectId;
  specialization: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    hospital: {
      type: Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    specialization: {
      type: Schema.Types.ObjectId,
      ref: "Specialization",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Default listing (and date-range filter): active doctors, newest first.
doctorSchema.index({ isDeleted: 1, createdAt: -1, _id: -1 });

// Listing filtered by specialization, still newest first
// (also serves the "is this specialization in use?" count).
doctorSchema.index({ isDeleted: 1, specialization: 1, createdAt: -1, _id: -1 });

// Listing filtered by hospital, and the "is this hospital in use?" count.
doctorSchema.index({ isDeleted: 1, hospital: 1, createdAt: -1, _id: -1 });

const Doctor = model<IDoctor>("Doctor", doctorSchema);

export default Doctor;
