import { Schema, model, Document } from "mongoose";

export interface IHospital extends Document {
  name: string;
  /** Normalized name for case-insensitive uniqueness (see toNameKey) */
  nameKey: string;
  address?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
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

    address: {
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

// One active hospital per name (case-insensitive). A deleted name can be reused.
hospitalSchema.index(
  { nameKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: "uniq_active_hospital_name",
  }
);

// Listing / dropdown options: active hospitals sorted by name.
hospitalSchema.index({ isDeleted: 1, nameKey: 1 });

const Hospital = model<IHospital>("Hospital", hospitalSchema);

export default Hospital;
