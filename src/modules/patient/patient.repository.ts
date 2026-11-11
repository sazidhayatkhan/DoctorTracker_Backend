import { QueryFilter, UpdateQuery } from "mongoose";

import Patient, { IPatient } from "./patient.model";
import {
  PaginationOptions,
  buildPaginatedResult,
  escapeRegex,
  getSkip,
} from "../../utils/pagination";
import { buildCreatedAtRange } from "../../utils/dateRange";

/** Internal fields never sent to clients */
const PUBLIC_PROJECTION = "-phoneDigits -isDeleted -__v";

export interface PatientFilters {
  q?: string;
  from?: string;
  to?: string;
}

/**
 * Builds the search filter. Each branch is chosen so it can use an index:
 * - patientCode: exact match on the unique index
 * - phoneDigits / name: "contains" regexes scan index keys rather than whole
 *   documents (only run when the input could actually match that field)
 */
const buildSearchFilter = ({
  q,
  from,
  to,
}: PatientFilters): QueryFilter<IPatient> => {
  const filter: QueryFilter<IPatient> = { isDeleted: false };

  const createdAt = buildCreatedAtRange(from, to);
  if (createdAt) filter.createdAt = createdAt;

  const query = q?.trim();

  if (!query || query.length < 2) return filter;

  const or: QueryFilter<IPatient>[] = [];
  const digits = query.replace(/\D/g, "");
  const isNumeric = /^[\d\s+()-]+$/.test(query);

  if (/^\d{4}$/.test(query)) {
    or.push({ patientCode: Number(query) });
  }

  if (digits.length >= 3) {
    or.push({ phoneDigits: { $regex: escapeRegex(digits) } });
  }

  // Pure numbers / phone-like input never match a name, so skip that scan.
  if (!isNumeric) {
    or.push({ name: { $regex: escapeRegex(query), $options: "i" } });
    // Emails are stored lowercase, so a case-sensitive match is enough.
    or.push({ email: { $regex: escapeRegex(query.toLowerCase()) } });
  }

  if (or.length === 0) return filter;

  filter.$or = or;
  return filter;
};

class PatientRepository {
  async create(data: Partial<IPatient>): Promise<IPatient> {
    return Patient.create(data);
  }

  /** Active patients, newest first, filtered by search text and created date */
  async findPaginated(filters: PatientFilters, pagination: PaginationOptions) {
    const filter = buildSearchFilter(filters);

    // Page and total are fetched in parallel; lean() skips document hydration.
    const [items, total] = await Promise.all([
      Patient.find(filter)
        .select(PUBLIC_PROJECTION)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    return buildPaginatedResult(items, total, pagination);
  }

  async findById(id: string): Promise<IPatient | null> {
    return Patient.findOne({ _id: id, isDeleted: false }).select(
      PUBLIC_PROJECTION
    );
  }

  /** Cheap existence check used for the unique-phone rule */
  async findIdByPhoneDigits(phoneDigits: string) {
    return Patient.findOne({ phoneDigits, isDeleted: false })
      .select("_id")
      .lean();
  }

  async updateById(
    id: string,
    data: UpdateQuery<IPatient>
  ): Promise<IPatient | null> {
    return Patient.findOneAndUpdate({ _id: id, isDeleted: false }, data, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_PROJECTION);
  }

  async softDelete(id: string): Promise<IPatient | null> {
    return Patient.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    ).select(PUBLIC_PROJECTION);
  }
}

export default new PatientRepository();
