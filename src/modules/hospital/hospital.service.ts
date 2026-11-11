import { UpdateQuery } from "mongoose";

import hospitalRepository from "./hospital.repository";
import {
  CreateHospitalDTO,
  ListHospitalsQuery,
  UpdateHospitalDTO,
} from "./hospital.dto";
import { IHospital } from "./hospital.model";
import doctorRepository from "../doctor/doctor.repository";
import AppError from "../../utils/AppError";
import { isDuplicateKeyError, toNameKey } from "../../utils/naming";

const DUPLICATE_MESSAGE = "A hospital with this name already exists";

/** Turns a race on the unique name index into a 409 instead of a 500 */
const withUniqueName = async <T>(write: () => Promise<T>): Promise<T> => {
  try {
    return await write();
  } catch (err) {
    if (isDuplicateKeyError(err, "nameKey")) {
      throw new AppError(DUPLICATE_MESSAGE, 409);
    }
    throw err;
  }
};

class HospitalService {
  private async ensureNameAvailable(nameKey: string, excludeId?: string) {
    const existing = await hospitalRepository.findIdByNameKey(nameKey);

    if (existing && existing._id.toString() !== excludeId) {
      throw new AppError(DUPLICATE_MESSAGE, 409);
    }
  }

  async createHospital(data: CreateHospitalDTO) {
    const nameKey = toNameKey(data.name);
    await this.ensureNameAvailable(nameKey);

    const hospital = await withUniqueName(() =>
      hospitalRepository.create({ ...data, nameKey })
    );

    return hospitalRepository.findById(hospital._id.toString());
  }

  /** A page of hospitals, each with its number of active doctors */
  async getAllHospitals({ q, page, limit }: ListHospitalsQuery) {
    const result = await hospitalRepository.findPaginated(q, { page, limit });
    const counts = await doctorRepository.countByRef(
      "hospital",
      result.items.map((h) => h._id)
    );

    return {
      ...result,
      items: result.items.map((h) => ({
        ...h,
        doctorCount: counts.get(h._id.toString()) ?? 0,
      })),
    };
  }

  async getHospitalOptions() {
    return hospitalRepository.findOptions();
  }

  async getHospitalById(id: string) {
    const hospital = await hospitalRepository.findById(id);

    if (!hospital) {
      throw new AppError("Hospital not found", 404);
    }

    return hospital;
  }

  async updateHospital(id: string, data: UpdateHospitalDTO) {
    await this.getHospitalById(id);

    const { address, ...rest } = data;
    const update: UpdateQuery<IHospital> = { ...rest };

    if (address !== undefined) {
      if (address) update.address = address;
      else update.$unset = { address: 1 };
    }

    if (data.name) {
      update.nameKey = toNameKey(data.name);
      await this.ensureNameAvailable(update.nameKey, id);
    }

    return withUniqueName(() => hospitalRepository.updateById(id, update));
  }

  async deleteHospital(id: string) {
    await this.getHospitalById(id);

    const doctorCount = await doctorRepository.countByHospital(id);

    if (doctorCount > 0) {
      throw new AppError(
        `Cannot delete: ${doctorCount} doctor(s) are assigned to this hospital`,
        409
      );
    }

    const hospital = await hospitalRepository.softDelete(id);

    if (!hospital) {
      throw new AppError("Hospital not found", 404);
    }

    return hospital;
  }
}

export default new HospitalService();
