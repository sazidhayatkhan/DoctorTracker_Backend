import { UpdateQuery } from "mongoose";

import specializationRepository from "./specialization.repository";
import {
  CreateSpecializationDTO,
  ListSpecializationsQuery,
  UpdateSpecializationDTO,
} from "./specialization.dto";
import { ISpecialization } from "./specialization.model";
import doctorRepository from "../doctor/doctor.repository";
import AppError from "../../utils/AppError";
import { isDuplicateKeyError, toNameKey } from "../../utils/naming";

const DUPLICATE_MESSAGE = "A specialization with this name already exists";

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

class SpecializationService {
  private async ensureNameAvailable(nameKey: string, excludeId?: string) {
    const existing = await specializationRepository.findIdByNameKey(nameKey);

    if (existing && existing._id.toString() !== excludeId) {
      throw new AppError(DUPLICATE_MESSAGE, 409);
    }
  }

  async createSpecialization(data: CreateSpecializationDTO) {
    const nameKey = toNameKey(data.name);
    await this.ensureNameAvailable(nameKey);

    const specialization = await withUniqueName(() =>
      specializationRepository.create({ ...data, nameKey })
    );

    return specializationRepository.findById(specialization._id.toString());
  }

  /** A page of specializations, each with its number of active doctors */
  async getAllSpecializations({ q, page, limit }: ListSpecializationsQuery) {
    const result = await specializationRepository.findPaginated(q, {
      page,
      limit,
    });
    const counts = await doctorRepository.countByRef(
      "specialization",
      result.items.map((s) => s._id)
    );

    return {
      ...result,
      items: result.items.map((s) => ({
        ...s,
        doctorCount: counts.get(s._id.toString()) ?? 0,
      })),
    };
  }

  async getSpecializationOptions() {
    return specializationRepository.findOptions();
  }

  async getSpecializationById(id: string) {
    const specialization = await specializationRepository.findById(id);

    if (!specialization) {
      throw new AppError("Specialization not found", 404);
    }

    return specialization;
  }

  async updateSpecialization(id: string, data: UpdateSpecializationDTO) {
    await this.getSpecializationById(id);

    const { description, ...rest } = data;
    const update: UpdateQuery<ISpecialization> = { ...rest };

    if (description !== undefined) {
      if (description) update.description = description;
      else update.$unset = { description: 1 };
    }

    if (data.name) {
      update.nameKey = toNameKey(data.name);
      await this.ensureNameAvailable(update.nameKey, id);
    }

    return withUniqueName(() => specializationRepository.updateById(id, update));
  }

  async deleteSpecialization(id: string) {
    await this.getSpecializationById(id);

    const doctorCount = await doctorRepository.countBySpecialization(id);

    if (doctorCount > 0) {
      throw new AppError(
        `Cannot delete: ${doctorCount} doctor(s) have this specialization`,
        409
      );
    }

    const specialization = await specializationRepository.softDelete(id);

    if (!specialization) {
      throw new AppError("Specialization not found", 404);
    }

    return specialization;
  }
}

export default new SpecializationService();
