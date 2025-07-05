import connectToDb from "@/lib/mongodb";
import Restaurant from '@/models/Restaurant';

export default async function handler(req, res) {
  await connectToDb();
  
  const { restaurantSlug } = req.query;
  if (!restaurantSlug) {
    return res.status(400).json({ error: "Restaurant slug is required." });
  }

  const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found." });
  }

  res.status(200).json(restaurant);
}
