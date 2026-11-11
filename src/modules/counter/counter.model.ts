import { Schema, model } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true },
  },
  { versionKey: false }
);

const Counter = model<ICounter>("Counter", counterSchema);

/**
 * Atomically increments and returns the next value of a named sequence.
 * The first call returns `start`.
 */
export const getNextSequence = async (
  name: string,
  start: number
): Promise<number> => {
  // Seed the counter if it doesn't exist yet (no-op when it already does).
  await Counter.updateOne(
    { _id: name },
    { $setOnInsert: { seq: start - 1 } },
    { upsert: true }
  );

  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true }
  );

  return counter!.seq;
};

export default Counter;
