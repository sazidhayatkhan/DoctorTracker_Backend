import { Types } from "mongoose";

import Assignment, { IAssignment } from "./assignment.model";

/** A doctor's hospital/specialization shown as {_id, name} */
const DOCTOR_REFS = [
  { path: "hospital", select: "_id name" },
  { path: "specialization", select: "_id name" },
];

/** Patient fields safe to send to clients */
const PATIENT_PUBLIC_FIELDS = "-phoneDigits -isDeleted -__v";

class AssignmentRepository {
  async create(data: {
    doctor: string;
    patient: string;
    condition: string;
    notes?: string;
  }): Promise<IAssignment> {
    return Assignment.create(data);
  }

  async findOne(
    doctorId: string,
    patientId: string
  ): Promise<IAssignment | null> {
    return Assignment.findOne({ doctor: doctorId, patient: patientId });
  }

  /** Assignments of a doctor with the (non-deleted) patient populated, newest first */
  async findByDoctor(doctorId: string) {
    const assignments = await Assignment.find({ doctor: doctorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "patient",
        match: { isDeleted: false },
        select: PATIENT_PUBLIC_FIELDS,
      });

    return assignments.filter((a) => a.patient);
  }

  /**
   * Number of assigned patients for each of the given doctors, in one
   * aggregation (uses the { doctor, patient } index). Doctors with no
   * patients are absent from the map.
   */
  async countByDoctors(
    doctorIds: (string | Types.ObjectId)[]
  ): Promise<Map<string, number>> {
    if (doctorIds.length === 0) return new Map();

    const rows = await Assignment.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          doctor: { $in: doctorIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((r) => [r._id.toString(), r.count]));
  }

  /** Assignments of a patient with the (non-deleted) doctor populated, newest first */
  async findByPatient(patientId: string) {
    const assignments = await Assignment.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate({
        path: "doctor",
        match: { isDeleted: false },
        populate: DOCTOR_REFS,
      });

    return assignments.filter((a) => a.doctor);
  }

  async populateById(id: string) {
    return Assignment.findById(id)
      .populate({ path: "doctor", populate: DOCTOR_REFS })
      .populate({ path: "patient", select: PATIENT_PUBLIC_FIELDS });
  }

  async deleteOne(
    doctorId: string,
    patientId: string
  ): Promise<IAssignment | null> {
    return Assignment.findOneAndDelete({ doctor: doctorId, patient: patientId });
  }

  async deleteAllForPatient(patientId: string) {
    return Assignment.deleteMany({ patient: patientId });
  }

  async deleteAllForDoctor(doctorId: string) {
    return Assignment.deleteMany({ doctor: doctorId });
  }
}

export default new AssignmentRepository();
