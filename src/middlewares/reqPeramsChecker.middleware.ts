import { ErrorMessage } from "../assets/errors";
import { HttpStatus } from "../assets/httpCodes";
import { ExpressFunc } from "../types";
import { HttpError } from "../utils/error";

/**
 * @description Checks request Params and validates them according to functions.
 * @param {string[]} params Array of params that we want to check
 * @param {function(item: string): boolean} checks Array of functions that check the param type.
 * @return {void}
 */
export const verifyParams =
  (
    params: Array<string>,
    // eslint-disable-next-line no-unused-vars
    ...checks: Array<(item: string) => boolean>
  ): ExpressFunc =>
  (req, _, next) => {
    try {
      params.map(param => {
        if (!req.params[param])
          throw new HttpError(
            ErrorMessage.INVALID_PARAMS,
            HttpStatus.BAD_REQUEST
          );
        checks.length > 0 &&
          checks.map(check => {
            if (!check(req.params[param]))
              throw new HttpError(
                "Invalid Param Type!",
                HttpStatus.BAD_REQUEST
              );
          });
      });
      next();
    } catch (err) {
      next(err);
    }
  };
