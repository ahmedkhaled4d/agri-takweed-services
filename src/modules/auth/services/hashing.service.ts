import bcrypt from "bcryptjs";

export const hashPassword = function (password: string) {
  return bcrypt.hash(password, 10);
};

export const validatePassword = function (
  plainPassword: string,
  hashedPassword: string
) {
  return bcrypt.compare(plainPassword, hashedPassword);
};
