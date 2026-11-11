/**
 * One-off migration: doctors used to store `hospital` and `specialization`
 * as plain text. This creates (or reuses) a Hospital / Specialization for
 * each distinct name and replaces the text with the new document's ObjectId.
 *
 * Safe to re-run: doctors already holding ObjectIds are skipped.
 *
 *   npm run migrate:doctor-refs            # apply
 *   npm run migrate:doctor-refs -- --dry   # report only, no writes
 */
import "dotenv/config";
import mongoose, { Model, Types } from "mongoose";

import connectDB from "../config/database";
import Doctor from "../modules/doctor/doctor.model";
import Hospital from "../modules/hospital/hospital.model";
import Specialization from "../modules/specialization/specialization.model";
import { toNameKey } from "../utils/naming";

const DRY_RUN = process.argv.includes("--dry");

/** Find the active entity with this name (case-insensitive) or create it */
const findOrCreate = async (
  EntityModel: Model<any>,
  cache: Map<string, Types.ObjectId>,
  rawName: string
): Promise<Types.ObjectId> => {
  const name = rawName.trim().replace(/\s+/g, " ");
  const nameKey = toNameKey(name);

  const cached = cache.get(nameKey);
  if (cached) return cached;

  const existing = await EntityModel.findOne({ nameKey, isDeleted: false })
    .select("_id")
    .lean<{ _id: Types.ObjectId }>();

  let id: Types.ObjectId;
  if (existing) {
    id = existing._id;
  } else if (DRY_RUN) {
    id = new Types.ObjectId();
    console.log(`  [dry] would create ${EntityModel.modelName} "${name}"`);
  } else {
    const created = await EntityModel.create({ name, nameKey });
    id = created._id as Types.ObjectId;
    console.log(`  created ${EntityModel.modelName} "${name}"`);
  }

  cache.set(nameKey, id);
  return id;
};

const migrate = async () => {
  try {
    await connectDB();

    // Read the raw collection: the Doctor schema now expects ObjectIds and
    // would try to cast the legacy strings.
    const legacyDoctors = await Doctor.collection
      .find({
        $or: [
          { hospital: { $type: "string" } },
          { specialization: { $type: "string" } },
        ],
      })
      .project<{ _id: Types.ObjectId; hospital: unknown; specialization: unknown }>({
        hospital: 1,
        specialization: 1,
      })
      .toArray();

    console.log(
      `${legacyDoctors.length} doctor(s) to migrate${DRY_RUN ? " (dry run)" : ""}`
    );

    const hospitalCache = new Map<string, Types.ObjectId>();
    const specializationCache = new Map<string, Types.ObjectId>();

    for (const doctor of legacyDoctors) {
      const update: Record<string, Types.ObjectId> = {};

      if (typeof doctor.hospital === "string" && doctor.hospital.trim()) {
        update.hospital = await findOrCreate(
          Hospital,
          hospitalCache,
          doctor.hospital
        );
      }

      if (
        typeof doctor.specialization === "string" &&
        doctor.specialization.trim()
      ) {
        update.specialization = await findOrCreate(
          Specialization,
          specializationCache,
          doctor.specialization
        );
      }

      if (Object.keys(update).length === 0) {
        console.warn(`  skipped doctor ${doctor._id}: empty hospital/specialization`);
        continue;
      }

      if (!DRY_RUN) {
        await Doctor.collection.updateOne({ _id: doctor._id }, { $set: update });
      }
    }

    console.log(DRY_RUN ? "Dry run complete." : "Migration complete.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrate();
