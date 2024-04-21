import { ObjectId } from "../../../../helpers";
import { RequestDocument } from "../../../../models";
import { requestRepo } from "../../../../repositories/request.repository";

export async function generateFakeRequest(
  overrides?: Partial<RequestDocument>
) {
  const requestObject = {
    code: "2345020877",
    dayOfWeek: "الاثنين",
    inspectionDate: "23/10/2023",
    mahaseelEngineer: "عبدالواحد حسن",
    plantQuarantineEngineer: "محمد ياسر",
    visitDetails: "زيارة اولى",
    user: ObjectId("633c1e066cad52d6edf191c8"),
    createdBy: ObjectId("633c1e066cad52d6edf191c8"),
    certificate:
      "https://us-central1-takweed-eg.cloudfunctions.net/client/request/2345020877.pdf",
    cancelled: false,
    status: "accept",
    farm: {
      representative: "احمد حسن محمد حسن",
      representativePhone: "01025050231",
      user: ObjectId("633c1e066cad52d6edf191c8"),
      name: "مزارع الغندور (هند)",
      owner: "هند حسنى حافظ الغندور",
      phone: "01025050231",
      location: {
        governorate: ObjectId("61b23cdd61441c3eb914cf69"),
        center: ObjectId("61b23cdd61441c3eb914d0f5"),
        hamlet: ObjectId("62b6e22b03bb6b5170fefd1a"),
        address: {
          address: "طنبول",
          landmark: "طنبول"
        }
      },
      color: "62645",
      active: true,
      _id: ObjectId("6536ff77987f997640dee2f9"),
      createdAt: new Date("2023-10-24T01:19:19.389+02:00"),
      updatedAt: new Date("2023-10-24T01:19:19.389+02:00"),
      __v: 0
    },
    crop: ObjectId("61a4f2ab629819f3d43027d1"),
    visitsNumber: 1,
    varieties: [
      {
        name: '"بسرة  صيفى"',
        parts: 1,
        area: {
          value: 0,
          unit: "فدان"
        },
        quantity: {
          value: 50,
          unit: "طن"
        },
        picking: {
          from: "2023-7-23",
          to: "2024-1-23"
        }
      }
    ],
    sampleNumber: "605",
    quality: [],
    gpx: [
      {
        name_ar: "A",
        carbonFootprint: "A+",
        variety: "برتقال_صيفى",
        points: [
          {
            lat: 30.290775,
            lng: 30.538287
          },
          {
            lat: 30.291688,
            lng: 30.536974
          },
          {
            lat: 30.292701,
            lng: 30.537974
          },
          {
            lat: 30.291769,
            lng: 30.539287
          },
          {
            lat: 30.290775,
            lng: 30.538287
          }
        ],
        area: 5.71
      },
      {
        name_ar: "B",
        variety: "برتقال_بسرة",
        carbonFootprint: "A",
        points: [
          {
            lat: 30.278938,
            lng: 30.544792
          },
          {
            lat: 30.27687,
            lng: 30.547451
          },
          {
            lat: 30.278059,
            lng: 30.548396
          },
          {
            lat: 30.280084,
            lng: 30.545647
          },
          {
            lat: 30.278938,
            lng: 30.544792
          }
        ],
        area: 12.74
      },
      {
        name_ar: "C",
        variety: "يوسفي",
        points: [
          {
            lat: 30.278119,
            lng: 30.548421
          },
          {
            lat: 30.279211,
            lng: 30.549268
          },
          {
            lat: 30.280172,
            lng: 30.5479
          },
          {
            lat: 30.279107,
            lng: 30.54708
          },
          {
            lat: 30.278119,
            lng: 30.548421
          }
        ],
        area: 5.79
      }
    ],
    gpxTimestamp: new Date("2024-03-03T02:00:00.000+02:00"),
    gpxOriginalDate: new Date("2023-10-23T12:00:07.000+02:00"),
    totalArea: 24.24,
    createdAt: new Date("2023-10-24T01:19:19.623+02:00"),
    updatedAt: new Date("2023-10-24T15:17:45.760+02:00"),
    __v: 0,
    adminUser: ObjectId("633c1eae6cad52d6edf191d2"),
    ...overrides
  };

  const c = await requestRepo.generateCodePattern(
    requestObject.farm.location.governorate.toString(),
    requestObject.crop.toString()
  );
  if (c.err) throw c.err;
  if (c.reqCode) {
    requestObject.code = c.reqCode;
  }
  return requestObject;
}

// export function generateFakeRequest(overrides?: Partial<RequestDocument>) {
//   return {
//     _id: faker.datatype.uuid(),
//     code: faker.datatype.number().toString(),
//     dayOfWeek: faker.date.weekday(),
//     inspectionDate: faker.date.future().toLocaleDateString(),
//     mahaseelEngineer: faker.name.findName(),
//     plantQuarantineEngineer: faker.name.findName(),
//     visitDetails: faker.lorem.words(),
//     user: faker.datatype.uuid(),
//     createdBy: faker.datatype.uuid(),
//     certificate: faker.internet.url(),
//     cancelled: faker.datatype.boolean(),
//     status: faker.random.arrayElement(["accept", "reject"]),
//     farm: {
//       representative: faker.name.findName(),
//       representativePhone: faker.phone.phoneNumber(),
//       user: faker.datatype.uuid(),
//       name: faker.company.companyName(),
//       owner: faker.name.findName(),
//       phone: faker.phone.phoneNumber(),
//       location: {
//         governorate: faker.datatype.uuid(),
//         center: faker.datatype.uuid(),
//         hamlet: faker.datatype.uuid(),
//         address: {
//           address: faker.address.streetAddress(),
//           landmark: faker.address.streetName()
//         }
//       },
//       color: faker.internet.color().substring(1),
//       active: faker.datatype.boolean(),
//       _id: faker.datatype.uuid(),
//       createdAt: faker.date.past().toISOString(),
//       updatedAt: faker.date.recent().toISOString(),
//       __v: 0
//     },
//     crop: faker.datatype.uuid(),
//     visitsNumber: faker.datatype.number(),
//     varieties: [
//       {
//         name: faker.commerce.productName(),
//         parts: faker.datatype.number(),
//         area: {
//           value: faker.datatype.number(),
//           unit: "unit"
//         },
//         quantity: {
//           value: faker.datatype.number(),
//           unit: "unit"
//         },
//         picking: {
//           from: faker.date.future().toLocaleDateString(),
//           to: faker.date.future().toLocaleDateString()
//         }
//       }
//     ],
//     sampleNumber: faker.datatype.number().toString(),
//     quality: [],
//     gpx: [
//       {
//         name_ar: "A",
//         variety: faker.commerce.productName(),
//         points: [
//           {
//             lat: faker.address.latitude(),
//             lng: faker.address.longitude()
//           }
//         ],
//         area: faker.datatype.float({ min: 0, max: 100 })
//       }
//     ],
//     gpxTimestamp: faker.date.future().toISOString(),
//     gpxOriginalDate: faker.date.past().toISOString(),
//     totalArea: faker.datatype.float({ min: 0, max: 100 }),
//     createdAt: faker.date.past().toISOString(),
//     updatedAt: faker.date.recent().toISOString(),
//     __v: 0,
//     adminUser: faker.datatype.uuid()
//   };
// }
