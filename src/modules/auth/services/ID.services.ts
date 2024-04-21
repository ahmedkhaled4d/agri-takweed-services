/**
 * Load fetch module to call services
 */
import fetch from "node-fetch";
const baseURL = "https://proxy.elections.eg/election?location=1&nid=";

/**
 * Verify ID
 * @param {string} nid
 */
export const verify = async (nid: string) => {
  try {
    const url = baseURL + nid;
    const options = {
      method: "GET"
    };
    const res = await fetch(url, options);
    /* returns stuff like :  "rejection_reason": {
        "code": "21",
        "description": "هذا الرقم ليس رقم قومي صحيح، برجاء التأكد من الرقم"
      }
    */
    return res.json() as unknown as {
      status: number;
      // eslint-disable-next-line @typescript-eslint/ban-types
      data: {
        api_version: string;
        last_db_update: string;
        status: "SUCCESS" | "NO_VOTER_FOUND" | "INVALID";
        rejection_reason: {
          code: "0" | "21" | "22";
          description: string;
        };
      };
    };
  } catch (error) {
    console.error("error in ID Verification:" + error);
    return error;
  }
};
