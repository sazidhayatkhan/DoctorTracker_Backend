import { QueryFilter, UpdateQuery } from "mongoose";

import Specialization, { ISpecialization } from "./specialization.model";
import {
  PaginationOptions,
  buildPaginatedResult,
  escapeRegex,
  getSkip,
} from "../../utils/pagination";

/** Internal fields never sent to clients */
const PUBLIC_PROJECTION = "-nameKey -isDeleted -__v";

const buildFilter = (q?: string): QueryFilter<ISpecialization> => {
  const filter: QueryFilter<ISpecialization> = { isDeleted: false };
  const query = q?.trim();

  if (query && query.length >= 2) {
    filter.name = { $regex: escapeRegex(query), $options: "i" };
  }

  return filter;
};

class SpecializationRepository {
  async create(data: Partial<ISpecialization>): Promise<ISpecialization> {
    return Specialization.create(data);
  }

  /** Active specializations A–Z, optionally filtered by name, paginated */
  async findPaginated(q: string | undefined, pagination: PaginationOptions) {
    const filter = buildFilter(q);

    const [items, total] = await Promise.all([
      Specialization.find(filter)
        .select(PUBLIC_PROJECTION)
        .sort({ nameKey: 1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      Specialization.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, pagination);
  }

  /** Every active specialization as {_id, name}, A–Z — for dropdowns */
  async findOptions() {
    return Specialization.find({ isDeleted: false })
      .select("_id name")
      .sort({ nameKey: 1 })
      .lean();
  }

  async findById(id: string): Promise<ISpecialization | null> {
    return Specialization.findOne({ _id: id, isDeleted: false }).select(
      PUBLIC_PROJECTION
    );
  }

  async existsById(id: string): Promise<boolean> {
    return (await Specialization.exists({ _id: id, isDeleted: false })) !== null;
  }

  async findIdByNameKey(nameKey: string) {
    return Specialization.findOne({ nameKey, isDeleted: false }).select("_id").lean();
  }

  async updateById(
    id: string,
    data: UpdateQuery<ISpecialization>
  ): Promise<ISpecialization | null> {
    return Specialization.findOneAndUpdate({ _id: id, isDeleted: false }, data, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_PROJECTION);
  }

  async softDelete(id: string): Promise<ISpecialization | null> {
    return Specialization.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    ).select(PUBLIC_PROJECTION);
  }
}

export default new SpecializationRepository();
