// /app/api/orders/get/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req) {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db("ecommerce");
    console.log("📂 Using database: ecommerce");
    
    // Get all orders, sorted by newest first
    const orders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📦 Found ${orders.length} orders`);
    console.log("📋 Orders data:", orders);

    return NextResponse.json(orders);
  } catch (err) {
    console.error("🚨 Error in GET /api/orders/get:", err);
    return NextResponse.json({ 
      error: "حدث خطأ في استرجاع الطلبات",
      details: err.message 
    }, { status: 500 });
  } finally {
    try {
      await client.close();
      console.log("🔌 MongoDB connection closed");
    } catch (closeErr) {
      console.error("Error closing connection:", closeErr);
    }
  }
}