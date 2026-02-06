import { HttpError } from "@calcom/lib/http-error";
import { defaultResponder } from "@calcom/lib/server/defaultResponder";
import type { NextApiRequest, NextApiResponse } from "next";

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  throw new HttpError({
    statusCode: 501,
    message: "Team publish endpoint has been removed in OSS version",
  });
}

export default defaultResponder(postHandler);
