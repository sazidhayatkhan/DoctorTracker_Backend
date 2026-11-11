
import Doctor, { IDoctor } from "./doctor.model";

class DoctorRepository {
  async create(data: Partial<IDoctor>): Promise<IDoctor> {
    return Doctor.create(data);
  }

  async findAll(): Promise<IDoctor[]> {
    return Doctor.find({ isDeleted: false }).sort({ createdAt: -1 });
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
