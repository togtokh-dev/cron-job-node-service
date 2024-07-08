import { Request, Response } from "express";
import cron from "node-cron";
import axiosRequest from "axios-master";
import {
  service_all,
  service_create,
  service_one,
  service_update,
} from "./service";
import date from "date-and-time";
import Joi from "joi";

const listSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    config: Joi.any().required(),
    job_time: Joi.string().required(),
    status: Joi.boolean().required(),
    type_name: Joi.string().valid("prod", "staging", "dev").required(),
  })
);

const jobSchema = Joi.object({
  id: Joi.string().required(),
  config: Joi.any().required(),
  job_time: Joi.string().required(),
  status: Joi.boolean().required(),
  type_name: Joi.string().valid("prod", "staging", "dev").required(),
});
export const list_create = async (req: Request, res: Response) => {
  console.log("list");
  const { error, value } = listSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const list: {
    id: string;
    config: any;
    job_time: string;
    status: boolean;
    type_name: "prod" | "staging" | "dev";
  }[] = value;

  try {
    for (let index = 0; index < list.length; index++) {
      const { id, config, job_time, status, type_name } = list[index];
      try {
        const checkJob = await service_one({ id: id });

        if (checkJob) {
          await service_update(
            { _id: checkJob._id },
            {
              config: config,
              status: status,
              job_time: job_time,
              type_name: type_name,
            }
          );
          if (!status) {
            removeJob(id);
          }
        } else {
          cron.schedule(
            job_time,
            (options) => {
              executeJob(config, id);
            },
            { name: id }
          );
          await service_create({
            id: id,
            job_time: job_time,
            config: config,
            status: status || true,
            type_name: type_name,
          });
        }
      } catch (error) {}
    }
    res.status(200).json({
      success: true,
      message: "success",
    });
    await sync();
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `${error}`,
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const { error, value } = jobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { id, config, job_time, status, type_name } = value;

  try {
    const checkJob = await service_one({ id: id });

    if (checkJob) {
      await service_update(
        { _id: checkJob._id },
        {
          config: config,
          status: status,
          job_time: job_time,
          type_name: type_name,
        }
      );
      if (!status) {
        removeJob(id);
      }
      const results = await service_one({ id: id });
      res.status(200).json({
        success: true,
        message: "success",
        data: results,
      });
    } else {
      cron.schedule(
        job_time,
        (options) => {
          executeJob(config, id);
        },
        { name: id }
      );
      const results = await service_create({
        id: id,
        job_time: job_time,
        config: config,
        status: status || true,
        type_name: type_name,
      });
      res.status(200).json({
        success: true,
        message: "success",
        data: results,
      });
    }
    sync();
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `${error}`,
    });
  }
};
export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    config,
    job_time,
    status,
    type_name,
  }: {
    config: any;
    job_time: string;
    status: boolean;
    type_name: "prod" | "staging" | "dev";
  } = req.body;
  try {
    const checkJob = await service_one({ id: id });
    if (checkJob) {
      await service_update(
        { _id: checkJob._id },
        {
          config: config,
          status: status,
          job_time: job_time,
          type_name: type_name,
        }
      );
      if (!status) {
        removeJob(id);
      }
      sync();
      const results = await service_one({ id: id });
      return res.status(200).json({
        success: true,
        message: "success",
        data: results,
      });
    } else {
      throw new Error("not found");
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
    });
  }
};
export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  try {
    const results = await service_one({ id: id, status: true });
    if (!results) {
      return res.status(200).json({
        success: false,
        message: "not found",
      });
    }
    await cron.getTasks().forEach(async (task, index) => {
      const taskD: any = task;
      if (taskD.options.name == results.id.toString()) {
        task.stop();
        const result = await service_update(
          { id: results.id },
          {
            status: false,
          }
        );
        return res.status(200).json({
          success: true,
          message: "Success",
          data: result,
        });
      }
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
    });
  }
};
export const getall = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  try {
    const results = await service_all({}, { createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Success",
      data: results,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
    });
  }
};
export const getone = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const results: any = await service_one({ id: id });
    return res.status(200).json({
      success: true,
      message: "Success",
      data: results,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
    });
  }
};
async function executeJob(config: any, id: string) {
  try {
    try {
      const result = await axiosRequest(
        date.format(new Date(), "YYYY/MM/DD HH:mm:ss") + " => JOB =>" + id,
        false,
        config
      );
      if (result.success) {
        return Promise.resolve(result.data);
      } else {
        return Promise.resolve(result.message);
      }
    } catch (error) {
      return Promise.resolve(error);
    }
  } catch (error) {}
}

export const sync = async () => {
  try {
    const results = await service_all({}, {});
    const tasks = cron.getTasks();

    for (const el of results) {
      try {
        const task = tasks.get(el.id.toString());

        if (el.status) {
          // If the job is active and not scheduled, schedule it
          if (!task) {
            cron.schedule(
              el.job_time,
              () => executeJob(el.config, el.id.toString()),
              { name: el.id.toString() }
            );
            console.log(`Scheduled job ${el.id}`);
          } else {
            // If the job is already scheduled, update the schedule
            task.stop(); // Stop the existing task
            tasks.delete(el.id.toString()); // Remove the existing task from the list

            // Schedule the new task
            cron.schedule(
              el.job_time,
              () => executeJob(el.config, el.id.toString()),
              { name: el.id.toString() }
            );
            console.log(`Updated schedule for job ${el.id}`);
          }
        } else {
          // If the job is not active and is scheduled, stop it
          if (task) {
            task.stop();
            console.log(`Stopped job ${el.id}`);
          } else {
            console.log(`Job ${el.id} is not currently scheduled`);
          }
        }
      } catch (error) {
        console.error(`Error processing job ${el.id}:`, error);
      }
    }

    console.log(
      `Sync success: ${results.filter((el) => el.status).length} jobs active`
    );
  } catch (error) {
    console.error("Sync failed:", error);
  }
};

export const removeJob = async (id: string) => {
  try {
    const tasks = cron.getTasks();
    const task = tasks.get(id.toString());
    task.stop();
    tasks.delete(id.toString());
  } catch (error) {}
};
