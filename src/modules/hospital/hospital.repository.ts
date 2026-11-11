import { QueryFilter, UpdateQuery } from "mongoose";

import Hospital, { IHospital } from "./hospital.model";
import {
  PaginationOptions,
  buildPaginatedResult,
  escapeRegex,
  getSkip,
} from "../../utils/pagination";

/** Internal fields never sent to clients */
const PUBLIC_PROJECTION = "-nameKey -isDeleted -__v";

const buildFilter = (q?: string): QueryFilter<IHospital> => {
  const filter: QueryFilter<IHospital> = { isDeleted: false };
  const query = q?.trim();

  if (query && query.length >= 2) {
    filter.name = { $regex: escapeRegex(query), $options: "i" };
  }

  return filter;
};

class HospitalRepository {
  async create(data: Partial<IHospital>): Promise<IHospital> {
    return Hospital.create(data);
  }

  /** Active hospitals A–Z, optionally filtered by name, paginated */
  async findPaginated(q: string | undefined, pagination: PaginationOptions) {
    const filter = buildFilter(q);

    const [items, total] = await Promise.all([
      Hospital.find(filter)
        .select(PUBLIC_PROJECTION)
        .sort({ nameKey: 1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      Hospital.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, pagination);
  }

  /** Every active hospital as {_id, name}, A–Z — for dropdowns */
  async findOptions() {
    return Hospital.find({ isDeleted: false })
      .select("_id name")
      .sort({ nameKey: 1 })
      .lean();
  }

  /** IDs of active hospitals whose name contains `q` (used by doctor search) */
  async findIdsByName(q: string) {
    const hospitals = await Hospital.find(buildFilter(q)).select("_id").lean();
    return hospitals.map((h) => h._id);
  }

  async findById(id: string): Promise<IHospital | null> {
    return Hospital.findOne({ _id: id, isDeleted: false }).select(
      PUBLIC_PROJECTION
    );
  }

  async existsById(id: string): Promise<boolean> {
    return (await Hospital.exists({ _id: id, isDeleted: false })) !== null;
  }

  async findIdByNameKey(nameKey: string) {
    return Hospital.findOne({ nameKey, isDeleted: false }).select("_id").lean();
  }

  async updateById(
    id: string,
    data: UpdateQuery<IHospital>
  ): Promise<IHospital | null> {
    return Hospital.findOneAndUpdate({ _id: id, isDeleted: false }, data, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_PROJECTION);
  }

  async softDelete(id: string): Promise<IHospital | null> {
    return Hospital.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    ).select(PUBLIC_PROJECTION);
  }
}

export default new HospitalRepository();
