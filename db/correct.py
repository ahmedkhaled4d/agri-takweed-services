"""
Author: Mina Sameh Wadie
Description: This script is used to correct the wrong requests codes, replaces the wrong code with the correct one
To make it easier, we deleted the wrong documents and inserted them again with the correct code
"""
# Need to correct the code of the requests, but the code is unique
code = {
 "2345040101" :"2345040086" ,
 "2348040065" :"2348040058" ,
 "2348040066" :"2348040059" ,
 "2348040067" :"2348040060" ,
 "2348040068" :"2348040061" ,
 "2348040069" :"2348040062" ,
 "2348040070" :"2348040063" ,
 "2345040086" :"2345040087" ,
 "2345040087" :"2345040088" ,
 "2345040088" :"2345040089" ,
 "2345040089" :"2345040090" ,
 "2345040090" :"2345040091" ,
 "2345040091" :"2345040092" ,
 "2345040092" :"2345040093" ,
 "2345040093" :"2345040094" ,
 "2345040094" :"2345040095" ,
 "2345040095" :"2345040096" ,
 "2345040096" :"2345040097" ,
 "2345040097" :"2345040098" ,
 "2348040058" :"2348040064" ,
 "2348040059" :"2348040065" ,
 "2348040060" :"2348040066" ,
 "2345040098" :"2345040099" ,
 "2348040061" :"2348040067" ,
 "2348040062" :"2348040068" ,
 "2345040099" :"2345040100" ,
 "2302040026" :"2302040026" ,
 "2302040027" :"2302040027" ,
 "2302040028" :"2302040028" ,
 "2345040100" :"2345040101" ,
 "2348040063" :"2348040069" ,
 "2348040064" :"2348040070" ,
}

# import mongo client
from pymongo import MongoClient
# import dotenv
from dotenv import load_dotenv
# load env variables
load_dotenv()
# import os
import os
# import logger
import logging

# set logger, save to file
logging.basicConfig(filename='correct.log', level=logging.DEBUG)

# connect to mongo using uri
client = MongoClient(os.getenv("MONGO_DB"))

# get requests collection
requests = client.takweed.requests

if __name__ == "__main__":
# Start transaction
    with client.start_session() as session:
        # Start transaction
        session.start_transaction()
        # Get the documents with the wrong code
        wrong = requests.find({"code": {"$in": list(code.keys())}}, session=session)
        # Consume the cursor, save docs in memory
        # As we will delete them
        wrong = list(wrong)
        print(
            "Found wrong docs: " + str(
                list(wrong)
            )
              )
        # Delete the wrong documents
        requests.delete_many({"code": {"$in": list(code.keys())}}, session=session)
        # Update the documents with the correct code
        for doc in wrong:
            logging.info("Updating doc code: " + str(doc["code"]) + " to " + str(code[doc["code"]]))
            doc["code"] = code[doc["code"]]
            ### THE LINES BELOW ARE NOT TESTED TILL THE INSERT
            # find the doc that has the same code as the wrong doc
            # old_doc = wrong[wrong.index(lambda x: x["code"] == doc["code"] and x["_id"] != doc["_id"])]
            # # switch out the createdAt and updatedAt
            # createdAt = doc["createdAt"]
            # updatedAt = doc["updatedAt"]
            # doc["createdAt"] = old_doc["createdAt"]
            # doc["updatedAt"] = old_doc["updatedAt"]
            # old_doc["createdAt"] = createdAt
            # old_doc["updatedAt"] = updatedAt
            requests.insert_one(doc, session=session)
            print("Updated doc: {}".format(doc))
            logging.info("Updated doc: {}".format(doc))
        # # Commit the transaction
        session.commit_transaction()
        # # Reverse the transaction
        # session.abort_transaction()
        # End the session
        session.end_session()


# Close the client
client.close()
