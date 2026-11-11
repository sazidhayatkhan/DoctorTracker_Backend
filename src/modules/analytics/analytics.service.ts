import analyticsRepository, { CountByKey } from "./analytics.repository";
import { DashboardQuery } from "./analytics.dto";
import { TIMEZONE, ageCutoff, lastMonths } from "./analytics.dates";
import { GENDERS } from "../patient/patient.model";

/** One point of a chart series — matches the frontend's `Datum` */
export interface Datum {
  label: string;
  value: number;
}

const AGE_GROUPS = [
  { label: "0–17", min: 0, max: 17 },
  { label: "18–34", min: 18, max: 34 },
  { label: "35–49", min: 35, max: 49 },
  { label: "50–64", min: 50, max: 64 },
  { label: "65+", min: 65, max: Infinity },
] as const;

/** Earlier than any plausible birth date (validation caps age at 130) */
const OLDEST_BIRTH_DATE = new Date(Date.UTC(1000, 0, 1));

const toCountMap = (rows: CountByKey[]) =>
  new Map(rows.map((r) => [r._id, r.count]));

const percentChange = (current: number, previous: number) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

class AnalyticsService {
  /** Stat tiles for the dashboard and the doctors page */
  async getOverview() {
    const [lastMonth, thisMonth] = lastMonths(2);

    const [totals, patientMonths, doctorMonths] = await Promise.all([
      analyticsRepository.countTotals(),
      analyticsRepository.countPatientsPerMonth(lastMonth.key),
      analyticsRepository.countDoctorsPerMonth(thisMonth.key),
    ]);

    const patientsByMonth = toCountMap(patientMonths);
    const newPatientsThisMonth = patientsByMonth.get(thisMonth.key) ?? 0;
    const newPatientsLastMonth = patientsByMonth.get(lastMonth.key) ?? 0;

    return {
      totalDoctors: totals.doctors,
      totalPatients: totals.patients,
      totalHospitals: totals.hospitals,
      totalSpecializations: totals.specializations,
      totalAssignments: totals.assignments,
      newPatientsThisMonth,
      newPatientsLastMonth,
      /** % change vs last month; null when last month had none */
      newPatientsChangePct: percentChange(
        newPatientsThisMonth,
        newPatientsLastMonth
      ),
      newDoctorsThisMonth: toCountMap(doctorMonths).get(thisMonth.key) ?? 0,
      timezone: TIMEZONE,
    };
  }

  /** New patients per month, oldest first, ending with the current month */
  async getPatientRegistrations(months: number) {
    const buckets = lastMonths(months);
    const counts = toCountMap(
      await analyticsRepository.countPatientsPerMonth(buckets[0].key)
    );

    return buckets.map(({ key, label }) => ({
      month: key,
      label,
      value: counts.get(key) ?? 0,
    }));
  }

  /** Active patients per gender, always in Male / Female / Other order */
  async getGenderSplit(): Promise<Datum[]> {
    const counts = toCountMap(await analyticsRepository.countPatientsByGender());

    return GENDERS.map((gender) => ({
      label: gender,
      value: counts.get(gender) ?? 0,
    }));
  }

  /** Active patients per age group, youngest first */
  async getAgeGroups(): Promise<Datum[]> {
    const now = new Date();

    // Group [min, max] holds birth dates in [cutoff(max + 1), cutoff(min)).
    // Oldest group first, so the boundaries come out ascending.
    const oldestFirst = [...AGE_GROUPS].reverse();
    const boundaries = [
      OLDEST_BIRTH_DATE,
      ...oldestFirst.map((g) => ageCutoff(g.min, now)),
    ];

    const rows = await analyticsRepository.countPatientsByBirthDate(boundaries);
    const countByLowerBound = new Map(
      rows
        .filter((r) => r._id instanceof Date)
        .map((r) => [(r._id as Date).getTime(), r.count])
    );

    return oldestFirst
      .map((group, i) => ({
        label: group.label,
        value: countByLowerBound.get(boundaries[i].getTime()) ?? 0,
      }))
      .reverse();
  }

  /** Doctors ranked by number of assigned patients (zero included) */
  async getPatientsPerDoctor(limit: number) {
    const rows = await analyticsRepository.countPatientsPerDoctor(limit);

    return rows.map((r) => ({
      doctorId: r._id,
      label: r.name,
      specialization: r.specialization,
      value: r.count,
    }));
  }

  /** Everything the dashboard page needs, in one round trip */
  async getDashboard({ months, limit }: DashboardQuery) {
    const [overview, registrations, gender, ageGroups, patientsPerDoctor] =
      await Promise.all([
        this.getOverview(),
        this.getPatientRegistrations(months),
        this.getGenderSplit(),
        this.getAgeGroups(),
        this.getPatientsPerDoctor(limit),
      ]);

    return { overview, registrations, gender, ageGroups, patientsPerDoctor };
  }
}

export default new AnalyticsService();
