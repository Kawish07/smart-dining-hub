import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db('smart_hub');
  const menus = await db.collection('menus').find({}).toArray();
  return new Response(JSON.stringify(menus));
}

export async function POST(request) {
  const client = await clientPromise;
  const db = client.db('smart_hub');
  const body = await request.json();
  const { restaurantId, category, items } = body;

  const result = await db.collection('menus').updateOne(
    { restaurantId, category },
    { $push: { items: { $each: items } } },
    { upsert: true }
  );

  return new Response(JSON.stringify(result));
}

export async function DELETE(request) {
  const client = await clientPromise;
  const db = client.db('smart_hub');
  const body = await request.json();
  const { restaurantId, category, itemId } = body;

  const result = await db.collection('menus').updateOne(
    { restaurantId, category },
    { $pull: { items: { id: itemId } } }
  );

  return new Response(JSON.stringify(result));
}