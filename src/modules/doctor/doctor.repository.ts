
import { QueryFilter } from "mongoose";

import Doctor, { IDoctor } from "./doctor.model";
import { ListDoctorsQuery } from "./doctor.dto";
import hospitalRepository from "../hospital/hospital.repository";
import {
  PaginationOptions,
  buildPaginatedResult,
  escapeRegex,
  getSkip,
} from "../../utils/pagination";
import { buildCreatedAtRange } from "../../utils/dateRange";

type DoctorFilters = Omit<ListDoctorsQuery, "page" | "limit">;

/** Internal fields never sent to clients */
const PUBLIC_PROJECTION = "-isDeleted -__v";

/** Replace hospital/specialization IDs with {_id, name} */
const POPULATE = [
  { path: "hospital", select: "_id name" },
  { path: "specialization", select: "_id name" },
];

const buildFilter = async ({
  q,
  specializationId,
  hospitalId,
  from,
  to,
}: DoctorFilters): Promise<QueryFilter<IDoctor>> => {
  const filter: QueryFilter<IDoctor> = { isDeleted: false };

  if (specializationId) filter.specialization = specializationId;
  if (hospitalId) filter.hospital = hospitalId;

  const createdAt = buildCreatedAtRange(from, to);
  if (createdAt) filter.createdAt = createdAt;

  const query = q?.trim();
  if (query && query.length >= 2) {
    const regex = { $regex: escapeRegex(query), $options: "i" };
    const or: QueryFilter<IDoctor>[] = [{ name: regex }, { email: regex }];

    // Hospital is a reference now: resolve matching hospitals to IDs first.
    const hospitalIds = await hospitalRepository.findIdsByName(query);
    if (hospitalIds.length > 0) or.push({ hospital: { $in: hospitalIds } });

    filter.$or = or;
  }

  return filter;
};

class DoctorRepository {
  async create(data: Partial<IDoctor>): Promise<IDoctor> {
    return Doctor.create(data);
  }

  /** Active doctors, newest first, filtered and paginated */
  async findPaginated(filters: DoctorFilters, pagination: PaginationOptions) {
    const filter = await buildFilter(filters);

    // Page and total are fetched in parallel; lean() skips document hydration.
    const [items, total] = await Promise.all([
      Doctor.find(filter)
        .select(PUBLIC_PROJECTION)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .populate(POPULATE)
        .lean(),
      Doctor.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, pagination);
  }

  async findById(id: string): Promise<IDoctor | null> {
    return Doctor.findOne({ _id: id, isDeleted: false })
      .select(PUBLIC_PROJECTION)
      .populate(POPULATE);
  }

  async existsById(id: string): Promise<boolean> {
    return (await Doctor.exists({ _id: id, isDeleted: false })) !== null;
  }

  async findByEmail(email: string): Promise<IDoctor | null> {
    return Doctor.findOne({
      email,
      isDeleted: false,
    });
  }

  async countByHospital(hospitalId: string): Promise<number> {
    return Doctor.countDocuments({ isDeleted: false, hospital: hospitalId });
  }

  async countBySpecialization(specializationId: string): Promise<number> {
    return Doctor.countDocuments({
      isDeleted: false,
      specialization: specializationId,
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
    )
      .select(PUBLIC_PROJECTION)
      .populate(POPULATE);
  }

  async softDelete(id: string): Promise<IDoctor | null> {
    return Doctor.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    ).select(PUBLIC_PROJECTION);
  }
}

export default new DoctorRepository();
