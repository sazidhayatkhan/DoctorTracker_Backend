
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
      throw new AppError("A doctor with this email already exists", 409);
    }

    const doctor = await doctorRepository.create(
      await this.resolveReferences(data)
    );

    // Return the populated shape used by the read endpoints.
    return doctorRepository.findById(doctor._id.toString());
  }

  async getAllDoctors({ page, limit, ...filters }: ListDoctorsQuery) {
    return doctorRepository.findPaginated(filters, { page, limit });
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
        throw new AppError("A doctor with this email already exists", 409);
      }
    }

    return doctorRepository.updateById(id, await this.resolveReferences(data));
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
