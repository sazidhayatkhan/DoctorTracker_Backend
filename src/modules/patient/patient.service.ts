import patientRepository from "./patient.repository";
import {
  CreatePatientDTO,
  ListPatientsQuery,
  UpdatePatientDTO,
} from "./patient.dto";
import { UpdateQuery } from "mongoose";

import { IPatient } from "./patient.model";
import assignmentRepository from "../assignment/assignment.repository";
import { getNextSequence } from "../counter/counter.model";
import AppError from "../../utils/AppError";

const PATIENT_CODE_SEQUENCE = "patientCode";
const PATIENT_CODE_START = 1001;
const PATIENT_CODE_MAX = 9999;

const DUPLICATE_PHONE_MESSAGE =
  "A patient with this phone number already exists";

const toDigits = (phone: string) => phone.replace(/\D/g, "");

/** MongoDB duplicate-key error on the unique phone index */
const isDuplicatePhoneError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === 11000 &&
  "phoneDigits" in ((err as { keyPattern?: object }).keyPattern ?? {});

/**
 * Runs a write, turning a race on the unique phone index into a 409
 * instead of a 500.
 */
const withUniquePhone = async <T>(write: () => Promise<T>): Promise<T> => {
  try {
    return await write();
  } catch (err) {
    if (isDuplicatePhoneError(err)) {
      throw new AppError(DUPLICATE_PHONE_MESSAGE, 409);
    }
    throw err;
  }
};

class PatientService {
  /** Fast pre-check for a friendly error; the unique index is the real guard */
  private async ensurePhoneAvailable(phoneDigits: string, excludeId?: string) {
    const existing = await patientRepository.findIdByPhoneDigits(phoneDigits);

    if (existing && existing._id.toString() !== excludeId) {
      throw new AppError(DUPLICATE_PHONE_MESSAGE, 409);
    }
  }

  async createPatient(data: CreatePatientDTO) {
    const phoneDigits = toDigits(data.phone);
    await this.ensurePhoneAvailable(phoneDigits);

    const patientCode = await getNextSequence(
      PATIENT_CODE_SEQUENCE,
      PATIENT_CODE_START
    );

    if (patientCode > PATIENT_CODE_MAX) {
      throw new AppError("Patient code limit reached", 500);
    }

    const patient = await withUniquePhone(() =>
      patientRepository.create({
        ...data,
        phoneDigits,
        patientCode,
        birthDate: new Date(data.birthDate),
      })
    );

    // Return the same public shape as the read endpoints.
    return patientRepository.findById(patient._id.toString());
  }

  async getAllPatients({ page, limit, ...filters }: ListPatientsQuery) {
    return patientRepository.findPaginated(filters, { page, limit });
  }

  async getPatientById(id: string) {
    const patient = await patientRepository.findById(id);

    if (!patient) {
      throw new AppError("Patient not found", 404);
    }

    return patient;
  }

  async updatePatient(id: string, data: UpdatePatientDTO) {
    await this.getPatientById(id);

    const { birthDate, email, ...rest } = data;
    const update: UpdateQuery<IPatient> = { ...rest };

    if (email === "") {
      update.$unset = { email: 1 };
    } else if (email) {
      update.email = email;
    }

    if (birthDate) {
      update.birthDate = new Date(birthDate);
    }

    if (data.phone) {
      const phoneDigits = toDigits(data.phone);
      await this.ensurePhoneAvailable(phoneDigits, id);
      update.phoneDigits = phoneDigits;
    }

    return withUniquePhone(() => patientRepository.updateById(id, update));
  }

  async deletePatient(id: string) {
    const patient = await patientRepository.softDelete(id);

    if (!patient) {
      throw new AppError("Patient not found", 404);
    }

    await assignmentRepository.deleteAllForPatient(id);

    return patient;
  }
}

export default new PatientService();
