import Model from "../models/index";
import axiosRequest from "axios-master";
import { Types, SortOrder, UpdateWriteOpResult, FilterQuery } from "mongoose";
import { DocType, SchemaDoc } from "../models/job-list";
export const service_all = async (
  body: FilterQuery<SchemaDoc>,
  sort:
    | string
    | { [key: string]: SortOrder | { $meta: any } }
    | [string, SortOrder][]
    | undefined
    | null
): Promise<DocType[]> => {
  try {
    const res_find = await Model.jobList.find(body).sort(sort);
    return Promise.resolve(res_find);
  } catch (err) {
    return Promise.reject("Query error");
  }
};
export const service_one = async (
  body: FilterQuery<SchemaDoc>
): Promise<DocType> => {
  try {
    const res_find = await Model.jobList.findOne(body);
    return Promise.resolve(res_find);
  } catch (err) {
    return Promise.reject("Query error");
  }
};
export const service_create = async (body: DocType): Promise<DocType> => {
  try {
    const res_find = await Model.jobList.create(body);
    return Promise.resolve(res_find);
  } catch (err) {
    console.log(err);
    return Promise.reject("Query error");
  }
};
export const service_remove = async (
  find: DocType
): Promise<UpdateWriteOpResult> => {
  try {
    // const res_find = await car_model.findOneAndDelete(id);
    const res_find = await Model.jobList.updateOne(find, {
      $set: { delFlg: true },
    });
    return Promise.resolve(res_find);
  } catch (err) {
    return Promise.reject("Query error");
  }
};
export const service_update = async (
  find: DocType,
  body: DocType
): Promise<UpdateWriteOpResult> => {
  try {
    const res_find = await Model.jobList.updateOne(
      { ...find },
      { $set: { ...body } }
    );
    return Promise.resolve(res_find);
  } catch (err) {
    return Promise.reject("Query error");
  }
};
