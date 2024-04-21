import fetch from "node-fetch";

const url =
  "https://yield-estimation-http-service.blackrock-b6f257e0.germanywestcentral.azurecontainerapps.io";

export const yieldEstimate = async (
  coordinates: Array<Array<number>>,
  requestId: string,
  crop_variety_en: string,
  crop_age: number
): Promise<{
  expected_yield: string;
  plantation_acreage: string;
  total_trees: number;
} | null> => {
  try {
    const body = {
      farmid: requestId,
      crop_name: crop_variety_en,
      crop_age,
      satellite_order_estimate: 2000,
      farm_geometry: coordinates
    };
    console.log("Yield Estimation Payload:", body);
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    console.log("Yield Estimation Response:", data);
    if (!response.ok) {
      console.error("Error in YieldEstimation:", JSON.stringify(data, null, 2));
      throw new Error("Error in YieldEstimation Status:" + response.status);
    }
    return data;
  } catch (err) {
    console.error("Error in YieldEstimation:", err);
    return null;
  }
};
