/**
 * Load fetch module to call services
 */
import fetch from "node-fetch";
const baseURL = "https://apis.cequens.com";

/**
 * Signing In
 * To sign-in using the TOKEN API, first submit an HTTP Request with your Service Username and API Key,
 * then receive a Response that includes your JWT access-token
 * @param {string} apiKey
 * @param {string} userName
 */
export const signingIn = async (apiKey: string, userName: string) => {
  try {
    const url = baseURL + "/auth/v1/tokens/";
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ apiKey: apiKey, userName: userName })
    };
    const res = await fetch(url, options);
    return res.json();
  } catch (error) {
    console.error("error:" + error);
  }
};

/**
 * Signing Out
 * Using your access token to logout,
 * adding current access token to blacklist and can no more access api services.
 */
export const signingOut = async () => {
  try {
    const url = baseURL + "/auth/v1/tokens/";
    const options = {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    };
    const res = await fetch(url, options);
    return res.json();
  } catch (error) {
    console.error("error:" + error);
  }
};

export const sendingSMS = async (
  messageText: string,
  recipients: Array<string>
) => {
  try {
    const url = baseURL + "/sms/v1/messages";
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer "
      },
      body: JSON.stringify({
        senderName: "Cequens",
        messageType: "text",
        acknowledgement: 0,
        flashing: 0,
        recipients: recipients,
        messageText: messageText
      })
    };
    const res = await fetch(url, options);
    return res.json();
  } catch (error) {
    console.error("error:" + error);
  }
};

// Send an OTP code to
// your user’s phone number or email address to verify the user identity
export const sendOTP = async (number: string) => {
  try {
    const url = baseURL + "/mfa/v2/verifications";
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: process.env.SMS_KEY ?? ""
      },
      body: JSON.stringify({
        channel: "SMS",
        recipientIdentifier: number,
        otpCodeLength: 6,
        otpCodeExpiry: 9
      })
    };
    const res = await fetch(url, options);
    return res.json() as unknown as {
      status: number;
      data: Record<string, unknown>;
    };
  } catch (error) {
    console.error("error:" + error);
  }
};

/**
 * Check OTP code
 * @param {*} otpPasscode
 * @param {*} checkCode
 *  */
export const checkOTP = async (otpPasscode: string, checkCode: string) => {
  try {
    const url = baseURL + "/mfa/v2/verifications";
    const options = {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: process.env.SMS_KEY ?? ""
      },
      body: JSON.stringify({ otpPasscode: otpPasscode, checkCode: checkCode })
    };
    const res = await fetch(url, options);
    return res.json() as unknown as {
      status: number;
      data: Record<string, unknown>;
    };
  } catch (error) {
    console.error("error:" + error);
  }
};

/**
 * Track OTP code
 * After your user’s phone number or email address is verified, you can check on the OTP
 * you have received from the user to know its status, whether it is expired, validated, or invalid.
 * Track OTP API takes the check code returned from the Verification : Send OTP API, and returns all checks with OTP status done using Check OTP code API.
 * @param {string} checkCode
 *  */
// export const trackOTP = async (checkCode: string) => {};
