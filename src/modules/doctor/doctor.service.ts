
import { Types } from "mongoose";

import doctorRepository from "./doctor.repository";
import {
  CreateDoctorDTO,
  ListDoctorsQuery,
  UpdateDoctorDTO,
} from "./doctor.dto";
import { IDoctor } from "./doctor.model";
import assignmentRepository from "../assignment/assignment.repository";
import hospitalRepository from "../hospital/hospital.repository";
import specializationRepository from "../specialization/specialization.repository";
import AppError from "../../utils/AppError";
import { isDuplicateKeyError } from "../../utils/naming";

const DUPLICATE_EMAIL_MESSAGE = "A doctor with this email already exists";

/** Turns a race on the unique email index into a 409 instead of a 500 */
const withUniqueEmail = async <T>(write: () => Promise<T>): Promise<T> => {
  try {
    return await write();
  } catch (err) {
    if (isDuplicateKeyError(err, "email")) {
      throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
    }
    throw err;
  }
};

class DoctorService {
  /**
   * Checks the referenced hospital/specialization exist, and maps the
   * request's `hospitalId` / `specializationId` onto the model's fields.
   */
  private async resolveReferences({
    hospitalId,
    specializationId,
    ...rest
  }: UpdateDoctorDTO): Promise<Partial<IDoctor>> {
    const [hospitalExists, specializationExists] = await Promise.all([
      hospitalId ? hospitalRepository.existsById(hospitalId) : true,
      specializationId
        ? specializationRepository.existsById(specializationId)
        : true,
    ]);

    if (!hospitalExists) {
      throw new AppError("Hospital not found", 404);
    }

    if (!specializationExists) {
      throw new AppError("Specialization not found", 404);
    }

    const data: Partial<IDoctor> = { ...rest };
    if (hospitalId) data.hospital = new Types.ObjectId(hospitalId);
    if (specializationId) {
      data.specialization = new Types.ObjectId(specializationId);
    }

    return data;
  }

  async createDoctor(data: CreateDoctorDTO) {
    const existingDoctor = await doctorRepository.findByEmail(data.email);

    if (existingDoctor) {
      throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
    }

    const resolved = await this.resolveReferences(data);
    const doctor = await withUniqueEmail(() => doctorRepository.create(resolved));

    // Return the populated shape used by the read endpoints.
    return doctorRepository.findById(doctor._id.toString());
  }

  /** A page of doctors, each with its number of assigned patients */
  async getAllDoctors({ page, limit, ...filters }: ListDoctorsQuery) {
    const result = await doctorRepository.findPaginated(filters, {
      page,
      limit,
    });

    const counts = await assignmentRepository.countByDoctors(
      result.items.map((doctor) => doctor._id)
    );

    return {
      ...result,
      items: result.items.map((doctor) => ({
        ...doctor,
        patientCount: counts.get(doctor._id.toString()) ?? 0,
      })),
    };
  }

  async getDoctorById(id: string) {
    const doctor = await doctorRepository.findById(id);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    return doctor;
  }

  async updateDoctor(id: string, data: UpdateDoctorDTO) {
    const doctor = await doctorRepository.findById(id);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    if (data.email && data.email !== doctor.email) {
      const existingDoctor = await doctorRepository.findByEmail(data.email);

      if (existingDoctor) {
        throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
      }
    }

    const resolved = await this.resolveReferences(data);
    return withUniqueEmail(() => doctorRepository.updateById(id, resolved));
  }

  async deleteDoctor(id: string) {
    const doctor = await doctorRepository.softDelete(id);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    await assignmentRepository.deleteAllForDoctor(id);

    return doctor;
  }

  async updateDoctorStatus(id: string, isActive: boolean) {
    const doctor = await doctorRepository.findById(id);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    return doctorRepository.updateById(id, { isActive });
  }
}

export default new DoctorService();
