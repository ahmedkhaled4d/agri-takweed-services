import { HubDocument } from "../../../../models";
import reqTraceRepo from "../../../../repositories/requestTraceability.repository";

function updateTraceabilityHubInfo(hub: HubDocument) {
  return reqTraceRepo.updateManyWithNewHubInfo(hub);
}

function isUsed(hub: HubDocument) {
  // check if hub is used in request traceability
  let name = "";
  if (hub.type === "STORE") {
    name = "hubStore";
  } else if (hub.type === "DISTRIBUTER") {
    name = "hubDistributer";
  } else {
    name = "hubExport";
  }

  return reqTraceRepo.find({
    [`${name}`]: {
      $elemMatch: { hubId: hub._id }
    }
  });
}

export default {
  updateTraceabilityHubInfo,
  isUsed
};
