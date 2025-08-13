// /app/api/products/route.js
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

// Create a global client to reuse connection (same as orders)
let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// ✅ GET - Get all products
export async function GET() {
  try {
    console.log("🔍 GET /api/products - Loading products...");
    
    const client = await clientPromise;
    const db = client.db("ecommerce"); // ✅ نفس اسم قاعدة البيانات في orders
    
    const products = await db.collection("products")
      .find({})
      .sort({ _id: -1 })
      .toArray();

    console.log(`📦 Found ${products.length} products`);

    // تحويل _id إلى id للتوافق مع الفرونت إند
    const productsWithId = products.map(product => ({
      ...product,
      id: product._id.toString()
    }));

    return NextResponse.json({ 
      success: true, 
      products: productsWithId 
    });
  } catch (error) {
    console.error("🚨 Error in GET /api/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// ✅ POST - Add product
export async function POST(req) {
  try {
    console.log("📝 POST /api/products - Adding new product...");
    
    const body = await req.json();
    console.log("📦 Product data received:", body);

    // Validate required fields
    if (!body.type || !body.price) {
      return NextResponse.json({ 
        success: false, 
        error: "النوع والسعر مطلوبان" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ecommerce");

    const newProduct = {
      type: body.type,
      price: body.price,
      description: body.description || '',
      size: body.size || '',
      qty: body.qty || '0', // ✅ تأكد من وجود qty كـ string
      images: body.images || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("📋 Prepared product:", newProduct);

    const result = await db.collection("products").insertOne(newProduct);
    
    console.log("✅ Product created with ID:", result.insertedId);

    // إرجاع المنتج مع id للتوافق مع الفرونت إند
    const createdProduct = {
      ...newProduct,
      id: result.insertedId.toString(),
      _id: result.insertedId
    };

    return NextResponse.json({
      success: true,
      product: createdProduct,
      message: "تم إضافة المنتج بنجاح"
    });
  } catch (error) {
    console.error("🚨 Error in POST /api/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// ✅ PUT - Update product
export async function PUT(req) {
  try {
    console.log("🔄 PUT /api/products - Updating product...");
    
    const body = await req.json();
    console.log("📝 Update data:", body);

    const { id, _id, ...updateData } = body;
    const productId = id || _id;

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف المنتج مطلوب" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف المنتج غير صحيح" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ecommerce");

    // إضافة updatedAt للبيانات المحدثة
    updateData.updatedAt = new Date();

    console.log("📝 Final update data:", updateData);

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );

    console.log("📊 Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "المنتج غير موجود" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "تم تحديث المنتج بنجاح",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("🚨 Error in PUT /api/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete product
export async function DELETE(req) {
  try {
    console.log("🗑️ DELETE /api/products - Deleting product...");
    
    const body = await req.json();
    const { id } = body;

    console.log("🎯 Deleting product ID:", id);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف المنتج مطلوب" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف المنتج غير صحيح" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ecommerce");

    const result = await db.collection("products").deleteOne({ 
      _id: new ObjectId(id) 
    });

    console.log("📊 Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "المنتج غير موجود" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "تم حذف المنتج بنجاح",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("🚨 Error in DELETE /api/products:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}