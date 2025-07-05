import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@lib/mongodb"; // Your database connection

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === "GET") {
    try {
      const orderHistory = await connectToDb
        .collection("OrderHistory")
        .find({ userId })
        .toArray();

      res.status(200).json(orderHistory);
    } catch (error) {
      console.error("Error fetching order history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}