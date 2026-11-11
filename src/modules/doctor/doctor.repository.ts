
import { QueryFilter } from "mongoose";

import Doctor, { IDoctor } from "./doctor.model";
import { ListDoctorsQuery } from "./doctor.dto";
import {
  PaginationOptions,
  buildPaginatedResult,
  escapeRegex,
  getSkip,
} from "../../utils/pagination";

type DoctorFilters = Omit<ListDoctorsQuery, "page" | "limit">;

const buildFilter = ({
  q,
  specialization,
  from,
  to,
}: DoctorFilters): QueryFilter<IDoctor> => {
  const filter: QueryFilter<IDoctor> = { isDeleted: false };

  if (specialization) {
    filter.specialization = specialization;
  }

  if (from || to) {
    const createdAt: { $gte?: Date; $lt?: Date } = {};
    if (from) createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) {
      // `to` is inclusive: everything before the start of the next day.
      const end = new Date(`${to}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      createdAt.$lt = end;
    }
    filter.createdAt = createdAt;
  }

  const query = q?.trim();
  if (query && query.length >= 2) {
    const regex = { $regex: escapeRegex(query), $options: "i" };
    filter.$or = [{ name: regex }, { email: regex }, { hospital: regex }];
  }

  return filter;
};

class DoctorRepository {
  async create(data: Partial<IDoctor>): Promise<IDoctor> {
    return Doctor.create(data);
  }

  /** Active doctors, newest first, filtered and paginated */
  async findPaginated(filters: DoctorFilters, pagination: PaginationOptions) {
    const filter = buildFilter(filters);

    // Page and total are fetched in parallel; lean() skips document hydration.
    const [items, total] = await Promise.all([
      Doctor.find(filter)
        .select("-isDeleted -__v")
        .sort({ createdAt: -1, _id: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, pagination);
  }

  async findById(id: string): Promise<IDoctor | null> {
    return Doctor.findOne({
      _id: id,
      isDeleted: false,
    });
  }

  async findByEmail(email: string): Promise<IDoctor | null> {
    return Doctor.findOne({
      email,
      isDeleted: false,
    });
  }

  async updateById(
    id: string,
    data: Partial<IDoctor>
  ): Promise<IDoctor | null> {
    return Doctor.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    );
  }

  async softDelete(id: string): Promise<IDoctor | null> {
    return Doctor.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
  }
}

export default new DoctorRepository();
