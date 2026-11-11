import { Schema, model, Document } from "mongoose";

export interface ISpecialization extends Document {
  name: string;
  /** Normalized name for case-insensitive uniqueness (see toNameKey) */
  nameKey: string;
  description?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const specializationSchema = new Schema<ISpecialization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    nameKey: {
      type: String,
      required: true,
    },

    description: {
      type: String,
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

// One active specialization per name (case-insensitive). A deleted name can be reused.
specializationSchema.index(
  { nameKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: "uniq_active_specialization_name",
  }
);

// Listing / dropdown options: active specializations sorted by name.
specializationSchema.index({ isDeleted: 1, nameKey: 1 });

const Specialization = model<ISpecialization>("Specialization", specializationSchema);

export default Specialization;
