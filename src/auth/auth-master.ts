import authMaster from "auth-master";
export default async () => {
  authMaster.config.keys = {
    reportToken: process.env.JWT_REPORT_USER,
  };
  console.log("authMaster run");
};
