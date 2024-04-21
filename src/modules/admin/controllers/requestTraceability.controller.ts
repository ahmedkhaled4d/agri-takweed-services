import type { NextFunction, Request, Response } from "express";
import { ErrorMessage } from "../../../assets/errors";
import { HttpStatus } from "../../../assets/httpCodes";
import { ExpressFunc } from "../../../types";
import { HttpError } from "../../../utils";
import * as reqTraceService from "../services/domain/traceability.service";

export const List = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reqTraceService.findPaginated(
      reqTraceService.filterSearch(req.query),
      req.limit,
      req.skip
    );

    if (!data)
      return res
        .status(HttpStatus.NO_CONTENT)
        .json({ message: ErrorMessage.NO_CONTENT });

    return res.send({ data, length: data.length });
  } catch (error) {
    next(error);
  }
};

export const One = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reqTraceService.getOneByCode(req.params.code);

    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_CONTENT });

    return res.send({ data });
  } catch (error) {
    next(error);
  }
};

// Update DATA Details
export const Update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Update Disabled." });
    const data = await reqTraceService.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });

    return res.status(HttpStatus.OK).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const Create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await reqTraceService.Create(req.body);
    if (!data)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    return res.status(HttpStatus.OK).json({ data });
  } catch (error) {
    next(error);
  }
};

export const Delete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Delete Disabled." });

    if (!req.params.id)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });

    const data = await reqTraceService.deleteOne(req.params.id);
    if (!data) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND });
    }

    return res
      .status(HttpStatus.OK)
      .send({ message: ErrorMessage.SUCCESS_ACTION });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Responsible for Getting charge from requestTraceability Entity,
 * Generates one if not found.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const getCharge: ExpressFunc = async (req, res, next) => {
  try {
    const requestTraceabilityEntity = await reqTraceService.getChargeOrCreateIt(
      req.params.code
    );

    return res.status(HttpStatus.OK).json({
      data: requestTraceabilityEntity.charge,
      code: requestTraceabilityEntity.code
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Responsible for adding item to store.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const commitItemsToStoreHubFromReq: ExpressFunc = async (
  req,
  res,
  next
) => {
  try {
    const reqCode = req.params.code;
    const storeId = req.params.storeId;

    // Also Search for hub to ensure it exists.
    const [trace, store] = await reqTraceService.getRequestTraceabilityWithHub(
      reqCode,
      storeId
    );
    if (!store || !trace || !trace.charge)
      throw new HttpError(
        "Request/hub not found! or Request has no charge",
        HttpStatus.NOT_FOUND
      );

    // leave validation to the service.
    const requestTrace = await reqTraceService.moveChargeFromReqToStore(
      trace,
      store,
      res.locals.user.userId,
      req.body as Array<{
        amountToAdd: string | null;
        variety: string | null;
      }>
    );

    return res.status(HttpStatus.OK).json({
      data: {
        hubStore: requestTrace.hubStore,
        request: requestTrace.charge,
        hubDisreputor: requestTrace.hubDistributer
      },
      error: false
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Responsible for starting the initialAmount and other things.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const postCharge: ExpressFunc = async (req, res, next) => {
  try {
    if (!req.body)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: ErrorMessage.INVALID_PARAMS });

    const result = await reqTraceService.putChargeInRequest(
      req.params.code,
      res.locals.user.userId,
      req.body
    );
    return res.status(HttpStatus.OK).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Responsible for moving items from store to distrebuter
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const commitItemsToDisrebution: ExpressFunc = async (req, res, next) => {
  try {
    const { code, storeId, distrebuteId } = req.params;

    // Also Search for hub to ensure it exists.
    const [trace, store, distrebuter] =
      await reqTraceService.getRequestTraceabilityWithStoreAndDistrebuter(
        code,
        storeId,
        distrebuteId
      );
    if (!store || !distrebuter || !trace || !trace.charge)
      throw new HttpError(
        "Request/hub not found! or Request has no charge",
        HttpStatus.NOT_FOUND
      );

    if (distrebuter.type !== "DISTRIBUTER" || store.type !== "STORE")
      throw new HttpError("Hub is wrong type", HttpStatus.BAD_REQUEST);

    await reqTraceService.moveItemsToDistFromStore(
      trace,
      store,
      distrebuter,
      res.locals.user.userId,
      req.body
    );
    return res.status(HttpStatus.OK).json({ data: trace, code: trace.code });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Moves items from distrebutor to plane.
 * @param {Request} req request
 * @param {Response} res response
 * @param {NextFunction} next NextFunction
 */
export const commitItemsToExport: ExpressFunc = async (req, res, next) => {
  try {
    const { code, exportId, distrebuteId } = req.params;

    // Also Search for hub to ensure it exists.
    const [trace, distrebutor, exportEntity] =
      await reqTraceService.getRequestTraceabilityWithDistrebutorAndExport(
        code,
        distrebuteId,
        exportId
      );

    if (!distrebutor || !exportEntity || !trace || !trace.charge)
      throw new HttpError(
        "Request/hub not found! or Request has no charge",
        HttpStatus.NOT_FOUND
      );

    if (distrebutor.type !== "DISTRIBUTER" || exportEntity.type !== "EXPORT")
      throw new HttpError("Hub is wrong type", HttpStatus.BAD_REQUEST);

    const data = await reqTraceService.moveItemsFromDistributorToExport(
      trace,
      distrebutor,
      exportEntity,
      res.locals.user.userId,
      req.body
    );

    return res
      .status(HttpStatus.OK)
      .json({ message: "Success", code: code, data: data.hubExport });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Gets ONE store items.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const getStoreItems: ExpressFunc = async (req, res, next) => {
  try {
    const { code, storeId } = req.params;

    const reqTrace = await reqTraceService.getStoreAvaliability(code, storeId);

    if (!reqTrace)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });
    return res.status(HttpStatus.OK).json({ data: reqTrace.hubStore });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Gets LIST stores items.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const getAllStoreItems: ExpressFunc = async (req, res, next) => {
  try {
    const { code } = req.params;

    const reqTrace = await reqTraceService.getAllStoresAvaliability(code);

    if (!reqTrace)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });
    return res.status(HttpStatus.OK).json({ data: reqTrace.hubStore });
  } catch (err) {
    next(err);
  }
};

export const getReqTraceByCode: ExpressFunc = async (req, res, next) => {
  try {
    const { code } = req.params;
    const data = await reqTraceService.getRequestTraceWithCode(code);
    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

export const getReqTraceTreeByCode: ExpressFunc = async (req, res, next) => {
  try {
    const { code } = req.params;
    const data = await reqTraceService.getRequestTraceWithCodeForTree(code);
    return res.status(HttpStatus.OK).json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Gets ONE store items.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const getDistItems: ExpressFunc = async (req, res, next) => {
  try {
    const { code, distId } = req.params;

    const reqTrace = await reqTraceService.getDistAvaliability(code, distId);

    if (!reqTrace)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });
    return res.status(HttpStatus.OK).json({ data: reqTrace.hubDistributer });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Gets LIST stores items.
 * @param {Request} req - Request
 * @param {Response} res - Response
 * @param {NextFunction} next - NextFunction
 */
export const getAllDistsItems: ExpressFunc = async (req, res, next) => {
  try {
    const { code } = req.params;

    const reqTrace = await reqTraceService.getAllDistsAvaliability(code);

    if (!reqTrace)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });
    return res.status(HttpStatus.OK).json({ data: reqTrace.hubDistributer });
  } catch (err) {
    next(err);
  }
};

export const getHistoryItem: ExpressFunc = async (req, res, next) => {
  try {
    const result = await reqTraceService.getHistoryCertificateData(
      req.params.id,
      req.params.code
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

export const getHistoryItemCertificate: ExpressFunc = async (
  req,
  res,
  next
) => {
  try {
    const data = await reqTraceService.getHistoryById(
      req.params.code,
      req.params.id
    );
    const fileName = "_history_certificate";

    if (!data || !data._id)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: ErrorMessage.NO_RESOURCE_FOUND, error: false });

    const { result, err } = await reqTraceService.getHistoryCertificate(
      data._id,
      req.params.code
    );

    if (err || !result) {
      throw new HttpError("Issue with ceritifacte", HttpStatus.NOT_FOUND);
    }

    // send the buffer file with a custom filename and content type
    res.set(
      "Content-disposition",
      `attachment; filename=${data._id}${fileName}.pdf`
    );
    // set mimetype (Content-Type) to "application/pdf"
    res.type("pdf");

    // send result buffer, wrapped in a Promise due to firefunctions
    return new Promise<void>(resolve => {
      res.writeHead(HttpStatus.OK);
      res.end(result, () => {
        resolve();
      });
    });
  } catch (err) {
    next(err);
  }
};
