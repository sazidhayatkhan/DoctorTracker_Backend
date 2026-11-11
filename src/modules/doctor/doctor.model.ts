
import { Schema, model, Document } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  phone: string;
  hospital: string;
  specialization: string;
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
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
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

// Listing filtered by specialization, still newest first.
doctorSchema.index({ isDeleted: 1, specialization: 1, createdAt: -1, _id: -1 });

const Doctor = model<IDoctor>("Doctor", doctorSchema);

export default Doctor;
