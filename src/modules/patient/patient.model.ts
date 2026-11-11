import { Schema, model, Document } from "mongoose";

export const GENDERS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export interface IPatient extends Document {
  /** Human-readable 4-digit ID (1001, 1002, ...) */
  patientCode: number;
  name: string;
  phone: string;
  /** Digits-only copy of phone, used for duplicate checks and search */
  phoneDigits: string;
  email?: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientCode: {
      type: Number,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    phoneDigits: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    birthDate: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: GENDERS,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
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

// A phone number can belong to only one active patient (enforced by MongoDB,
// so concurrent creates can't slip a duplicate past the service check).
// Soft-deleted patients are excluded so their number can be re-registered.
patientSchema.index(
  { phoneDigits: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: "uniq_active_phone",
  }
);

// Default listing: active patients, newest first (filter + sort covered).
patientSchema.index({ isDeleted: 1, createdAt: -1, _id: -1 });

// Name search scans index keys instead of whole documents.
patientSchema.index({ name: 1 });

const Patient = model<IPatient>("Patient", patientSchema);

export default Patient;
