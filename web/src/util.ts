import { prisma } from "./prisma";
import { Request, Response } from "express";

export async function validateAuthToken(
  req: Request,
  res: Response,
  next: any
) {
  const token = req.headers.authorization;
  console.log("token: ", token);
  if (typeof token !== "string") {
    console.error("token not found: ", req.headers);
    return res.status(401).send("token not found");
  }

  const apiToken = await prisma.apiToken.findFirst({
    where: {
      token: {
        equals: token,
      },
    },
  });

  if (apiToken === null) {
    console.error("token not found");
    return res.status(401).send("token not found");
  }

  next();
}
