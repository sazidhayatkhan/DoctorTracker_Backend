import assignmentRepository from "./assignment.repository";
import { AssignPatientDTO } from "./assignment.dto";
import doctorRepository from "../doctor/doctor.repository";
import patientRepository from "../patient/patient.repository";
import AppError from "../../utils/AppError";
import { isDuplicateKeyError } from "../../utils/naming";

const ALREADY_ASSIGNED_MESSAGE = "Patient is already assigned to this doctor";

class AssignmentService {
  private async ensureDoctor(doctorId: string) {
    const doctor = await doctorRepository.findById(doctorId);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    return doctor;
  }

  private async ensurePatient(patientId: string) {
    const patient = await patientRepository.findById(patientId);

    if (!patient) {
      throw new AppError("Patient not found", 404);
    }

    return patient;
  }

  async assignPatient(doctorId: string, data: AssignPatientDTO) {
    const [doctor] = await Promise.all([
      this.ensureDoctor(doctorId),
      this.ensurePatient(data.patientId),
    ]);

    if (!doctor.isActive) {
      throw new AppError("Cannot assign patients to an inactive doctor", 400);
    }

    const existing = await assignmentRepository.findOne(
      doctorId,
      data.patientId
    );

    if (existing) {
      throw new AppError(ALREADY_ASSIGNED_MESSAGE, 409);
    }

    let assignment;
    try {
      assignment = await assignmentRepository.create({
        doctor: doctorId,
        patient: data.patientId,
        condition: data.condition,
        // Blank textarea input is stored as "no notes"
        notes: data.notes || undefined,
      });
    } catch (err) {
      // A concurrent request won the race on the unique { doctor, patient } index
      if (isDuplicateKeyError(err)) {
        throw new AppError(ALREADY_ASSIGNED_MESSAGE, 409);
      }
      throw err;
    }

    return assignmentRepository.populateById(assignment._id.toString());
  }

  async getDoctorPatients(doctorId: string) {
    await this.ensureDoctor(doctorId);
    return assignmentRepository.findByDoctor(doctorId);
  }

  async getPatientDoctors(patientId: string) {
    await this.ensurePatient(patientId);
    return assignmentRepository.findByPatient(patientId);
  }

  async unassignPatient(doctorId: string, patientId: string) {
    const assignment = await assignmentRepository.deleteOne(
      doctorId,
      patientId
    );

    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    return assignment;
  }
}

export default new AssignmentService();
