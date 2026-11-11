
import doctorRepository from "./doctor.repository";
import {
  CreateDoctorDTO,
  ListDoctorsQuery,
  UpdateDoctorDTO,
} from "./doctor.dto";
import assignmentRepository from "../assignment/assignment.repository";
import AppError from "../../utils/AppError";

class DoctorService {
  async createDoctor(data: CreateDoctorDTO) {
    const existingDoctor = await doctorRepository.findByEmail(data.email);

    if (existingDoctor) {
      throw new AppError("A doctor with this email already exists", 409);
    }

    return doctorRepository.create(data);
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

    return doctorRepository.updateById(id, data);
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
