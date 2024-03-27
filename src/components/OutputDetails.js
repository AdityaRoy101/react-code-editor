import React from "react";

const OutputDetails = ({ outputDetails }) => {
  return (
    <div className="metrics-container  flex flex-col space-y-3">
      <p className="text-sm text-slate-300 text-4xs">
        Status:{" "}
        {outputDetails.status.description === "Accepted"?<span className=" ml-5 font-semibold px-2 py-1 rounded-md bg-green-500 text-slate-100">
          {outputDetails?.status?.description}
        </span>:<span className=" ml-5 font-semibold px-2 py-1 rounded-md  bg-red-500 text-slate-100">
          {outputDetails?.status?.description}
        </span>}
      </p>
      <p className="text-sm text-slate-300 text-4xs">
        Memory:{" "}
        <span className="font-semibold px-2 py-1 rounded-md bg-slate-800 text-slate-200 ml-2">
          {outputDetails?.memory}
        </span>
      </p>
      <p className="text-sm text-slate-300 text-4xs">
        Time:{" "}
        <span className="font-semibold px-2 py-1 rounded-md bg-slate-800 text-slate-200 ml-7">
          {outputDetails?.time}
        </span>
      </p>
    </div>
  );
};

export default OutputDetails;
