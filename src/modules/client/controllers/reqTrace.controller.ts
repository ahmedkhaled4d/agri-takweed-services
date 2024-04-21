import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { ObjectId } from "../../../helpers";
import reqTraceRepo from "../../../repositories/requestTraceability.repository";
import { ExpressFunc } from "../../../types";

export const getHistoryItem: ExpressFunc = async (req, res, next) => {
  try {
    const result = await reqTraceRepo.aggregateHistoryPdf(
      req.params.code,
      ObjectId(req.params.id)
    );

    if (result && result.length > 0)
      return res.status(HttpStatus.OK).json({ data: result[0] });

    return res
      .status(HttpStatus.NOT_FOUND)
      .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });
  } catch (err) {
    next(err);
  }
};
