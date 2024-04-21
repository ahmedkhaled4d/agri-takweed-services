import csv
from pymongo import MongoClient
import requests

client = MongoClient("mongodb://localhost:27017")
db = client["takweed"]
collection = db["requests"]

pipeline = [
    {"$match": {"gpx": {"$exists": True}}},
    {"$unwind": "$gpx"},
    {
        "$match": {
            # match area above 24.088452380952 (25 acres)
            "gpx.area": {"$gt": 24.1},
        }
    },
    {
        "$project": {
            "farmid": {"$toString": "$gpx._id"},
            "crop_name": "$gpx.variety",
            "crop_age": "10",
            "satellite_order_estimate": 2000,
            "createdAt": 1,
            "area": "$gpx.area",
            "farm_geometry": {
                "$map": {
                    "input": "$gpx.points",
                    "as": "pts",
                    "in": {
                        "$map": {
                            "input": ["$$pts.lng", "$$pts.lat"],
                            "as": "coord",
                            "in": {"$toDouble": "$$coord"},
                        }
                    },
                }
            },
        }
    },
    {"$limit": 10},
]

results = list(collection.aggregate(pipeline))

csv_file = "yieldEstimation.csv"


with open(csv_file, "w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=results[0]["data"][0].keys())
    writer.writeheader()
    for result in results:
        try:
            res = requests.post(
                "https://yield-estimation-http-service.blackrock-b6f257e0.germanywestcentral.azurecontainerapps.io",
                json=result,
            )
            print(res.status_code, res.json())
            if res.status_code == 200:
                result.update({"works": True})
            else:
                result.update({"works": False})
        except Exception as e:
            print(e)
            result.update({"works": False})
        writer.writerow(result)

print(f"Results have been written to {csv_file}")
