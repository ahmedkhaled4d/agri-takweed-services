let OtpCode = "";
let CheckCode = "";

export const checkOTP = async (otpPasscode: string, checkCode: string) => {
  return new Promise(function (resolve, reject) {
    if (otpPasscode === OtpCode && checkCode === CheckCode) {
      return resolve({ data: { otpPasscodeStatus: 1 } });
    }
    return reject(Error("otp code is not equal."));
  });
};

// eslint-disable-next-line no-unused-vars
export const sendOTP = async (number: string) => {
  return new Promise(function (resolve, reject) {
    try {
      OtpCode = (Math.random() + 1).toString(36).substring(7);
      CheckCode = (Math.random() + 1).toString(36).substring(7);
      return resolve({
        data: { checkCode: { CheckCode, otpCode: OtpCode } }
      });
    } catch (err) {
      reject(err);
    }
  });
};
