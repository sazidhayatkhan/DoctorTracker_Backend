import { Model } from "mongoose";

import Doctor from "../doctor/doctor.model";
import Patient from "../patient/patient.model";
import Hospital from "../hospital/hospital.model";
import Specialization from "../specialization/specialization.model";
import Assignment from "../assignment/assignment.model";
import { TIMEZONE, monthLowerBound } from "./analytics.dates";

export interface CountByKey {
  _id: string;
  count: number;
}

/**
 * Raw aggregations. Every query filters on `isDeleted: false` first so it
 * can use the { isDeleted, createdAt } indexes and skip deleted documents.
 */
class AnalyticsRepository {
  async countTotals() {
    const active = { isDeleted: false };

    const [doctors, patients, hospitals, specializations, assignments] =
      await Promise.all([
        Doctor.countDocuments(active),
        Patient.countDocuments(active),
        Hospital.countDocuments(active),
        Specialization.countDocuments(active),
        // Deleting a doctor or patient deletes its assignments, so every
        // remaining assignment links two active records.
        Assignment.estimatedDocumentCount(),
      ]);

    return { doctors, patients, hospitals, specializations, assignments };
  }

  /** Documents created per month (yyyy-mm in TIMEZONE) since `fromKey` */
  async countCreatedPerMonth(
    EntityModel: Model<any>,
    fromKey: string
  ): Promise<CountByKey[]> {
    return EntityModel.aggregate<CountByKey>([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: monthLowerBound(fromKey) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
              timezone: TIMEZONE,
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async countPatientsPerMonth(fromKey: string) {
    return this.countCreatedPerMonth(Patient, fromKey);
  }

  async countDoctorsPerMonth(fromKey: string) {
    return this.countCreatedPerMonth(Doctor, fromKey);
  }

  async countPatientsByGender(): Promise<CountByKey[]> {
    return Patient.aggregate<CountByKey>([
      { $match: { isDeleted: false } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);
  }

  /**
   * Buckets active patients by birth date. `boundaries` must be ascending
   * dates; bucket i holds patients with boundaries[i] <= birthDate < boundaries[i+1].
   */
  async countPatientsByBirthDate(boundaries: Date[]) {
    return Patient.aggregate<{ _id: Date | string; count: number }>([
      { $match: { isDeleted: false } },
      {
        $bucket: {
          groupBy: "$birthDate",
          boundaries,
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);
  }

  /**
   * Active doctors with their number of assigned patients, most first.
   * Includes doctors with zero patients. The lookup counts through the
   * { doctor, patient } index without loading the assignment documents.
   */
  async countPatientsPerDoctor(limit: number) {
    return Doctor.aggregate<{
      _id: string;
      name: string;
      specialization: string | null;
      count: number;
    }>([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: Assignment.collection.name,
          localField: "_id",
          foreignField: "doctor",
          pipeline: [{ $count: "n" }],
          as: "assigned",
        },
      },
      {
        $project: {
          name: 1,
          specialization: 1,
          count: { $ifNull: [{ $first: "$assigned.n" }, 0] },
        },
      },
      { $sort: { count: -1, name: 1 } },
      { $limit: limit },
      // Resolve specialization names only for the doctors that made the cut.
      {
        $lookup: {
          from: Specialization.collection.name,
          localField: "specialization",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 0, name: 1 } }],
          as: "specialization",
        },
      },
      {
        $project: {
          name: 1,
          count: 1,
          specialization: { $ifNull: [{ $first: "$specialization.name" }, null] },
        },
      },
    ]);
  }
}

export default new AnalyticsRepository();
