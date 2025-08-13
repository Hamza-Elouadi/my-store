// /app/api/orders/route.js
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Create a global client to reuse connection
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

// POST - Create new order
export async function POST(req) {
  try {
    console.log("📝 POST /api/orders - Creating new order...");
    
    const body = await req.json();
    console.log("📦 Order data received:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ 
        success: false, 
        error: "الاسم والبريد الإلكتروني والهاتف مطلوبين" 
      }, { status: 400 });
    }

    // التأكد من وجود المنتجات
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "يجب أن يحتوي الطلب على منتج واحد على الأقل" 
      }, { status: 400 });
    }

    // حساب المجموع من جديد للتأكد
    const calculatedTotal = body.products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    const client = await clientPromise;
    const db = client.db("ecommerce");

    console.log("🚀 Starting inventory management...");
    console.log("📦 Products in order:", body.products);

    // تحديث المخزون لكل منتج
    for (let i = 0; i < body.products.length; i++) {
      const product = body.products[i];
      console.log(`\n--- Processing Product ${i + 1}/${body.products.length} ---`);
      console.log("🔍 Product data:", product);
      
      // تخطي المنتجات بدون productId
      if (!product.productId) {
        console.log("⚠️ No productId found, skipping this product");
        continue;
      }

      // التحقق من صحة ObjectId
      let productObjectId;
      try {
        productObjectId = new ObjectId(product.productId);
        console.log("✅ Valid ObjectId created:", productObjectId.toString());
      } catch (error) {
        console.error("❌ Invalid ObjectId:", product.productId, error);
        continue;
      }

      // البحث عن المنتج في قاعدة البيانات
      console.log("🔍 Searching for product in database...");
      const existingProduct = await db.collection("products").findOne({
        _id: productObjectId
      });

      console.log("📋 Found product:", existingProduct);

      if (!existingProduct) {
        console.log("❌ Product not found in database");
        continue;
      }

      // تحديد الكمية الحالية (التعامل مع string و number)
      let currentQuantity = 0;
      
      console.log("🔍 Raw product fields:", {
        quantity: existingProduct.quantity,
        qty: existingProduct.qty,
        stock: existingProduct.stock
      });
      
      // جرب كل الحقول وحولها لرقم
      if (existingProduct.qty !== undefined) {
        currentQuantity = parseInt(existingProduct.qty) || 0;
        console.log("📊 Using qty field, converted to:", currentQuantity);
      } else if (existingProduct.quantity !== undefined) {
        currentQuantity = parseInt(existingProduct.quantity) || 0;
        console.log("📊 Using quantity field, converted to:", currentQuantity);
      } else if (existingProduct.stock !== undefined) {
        currentQuantity = parseInt(existingProduct.stock) || 0;
        console.log("📊 Using stock field, converted to:", currentQuantity);
      } else {
        console.log("❌ No quantity field found!");
        currentQuantity = 0;
      }

      const requestedQuantity = parseInt(product.quantity) || 1;
      console.log(`📊 Current: ${currentQuantity}, Requested: ${requestedQuantity}`);

      // التحقق من توفر الكمية
      if (currentQuantity < requestedQuantity) {
        console.log("❌ Not enough quantity available");
        return NextResponse.json({ 
          success: false, 
          error: `الكمية المتاحة غير كافية للمنتج: ${product.productName || product.name}. متاح: ${currentQuantity}, مطلوب: ${requestedQuantity}` 
        }, { status: 400 });
      }

      // حساب الكمية الجديدة
      const newQuantity = currentQuantity - requestedQuantity;
      console.log(`📊 New quantity will be: ${newQuantity}`);

      if (newQuantity <= 0) {
        // حذف المنتج إذا أصبحت الكمية 0 أو أقل
        console.log("🗑️ Quantity is 0 or less, deleting product...");
        
        const deleteResult = await db.collection("products").deleteOne({
          _id: productObjectId
        });
        
        console.log("🗑️ Delete result:", deleteResult);
        
        if (deleteResult.deletedCount === 1) {
          console.log("✅ Product deleted successfully!");
        } else {
          console.log("❌ Failed to delete product");
        }
      } else {
        // تحديث الكمية
        console.log("🔄 Updating product quantity...");
        
        // تحديد أي حقل نستخدم للتحديث (تأكد من النوع الصحيح)
        let updateField = {};
        
        console.log("🔍 Determining which field to update...");
        
        if (existingProduct.qty !== undefined) {
          // إذا كان الحقل الأصلي string، خليه string
          if (typeof existingProduct.qty === 'string') {
            updateField.qty = newQuantity.toString();
            console.log("📝 Updating qty as string:", updateField.qty);
          } else {
            updateField.qty = newQuantity;
            console.log("📝 Updating qty as number:", updateField.qty);
          }
        } else if (existingProduct.quantity !== undefined) {
          if (typeof existingProduct.quantity === 'string') {
            updateField.quantity = newQuantity.toString();
            console.log("📝 Updating quantity as string:", updateField.quantity);
          } else {
            updateField.quantity = newQuantity;
            console.log("📝 Updating quantity as number:", updateField.quantity);
          }
        } else if (existingProduct.stock !== undefined) {
          if (typeof existingProduct.stock === 'string') {
            updateField.stock = newQuantity.toString();
            console.log("📝 Updating stock as string:", updateField.stock);
          } else {
            updateField.stock = newQuantity;
            console.log("📝 Updating stock as number:", updateField.stock);
          }
        } else {
          // افتراضي - استخدم qty كـ string لأن هذا هو المعيار عندك
          updateField.qty = newQuantity.toString();
          console.log("📝 Using default qty as string:", updateField.qty);
        }
        
        updateField.updatedAt = new Date();
        
        console.log("📝 Update fields:", updateField);
        
        const updateResult = await db.collection("products").updateOne(
          { _id: productObjectId },
          { $set: updateField }
        );
        
        console.log("🔄 Update result:", updateResult);
        
        if (updateResult.modifiedCount === 1) {
          console.log("✅ Product quantity updated successfully!");
        } else {
          console.log("❌ Failed to update product quantity");
        }
      }
    }

    console.log("🎯 Inventory management completed, now creating order...");

    const newOrder = {
      // بيانات العميل
      customerName: body.name.trim(),
      customerEmail: body.email.trim().toLowerCase(),
      customerPhone: body.phone.trim(),
      
      // عنوان التسليم
      address: body.address?.trim() || '',
      city: body.city?.trim() || '',
      postalCode: body.postalCode?.trim() || '',
      
      // بيانات المنتجات مع التفاصيل الكاملة
      products: body.products.map(product => ({
        productId: product.productId || null,
        productName: product.productName || product.name || 'منتج غير محدد',
        price: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 1,
        itemTotal: parseFloat(product.itemTotal) || (parseFloat(product.price) * parseInt(product.quantity)),
        image: product.image || null
      })),
      
      // المجموع (استخدم المرسل أو المحسوب)
      totalPrice: parseFloat(body.totalPrice) || calculatedTotal,
      itemCount: parseInt(body.itemCount) || body.products.length,
      
      // معلومات إضافية
      notes: body.notes?.trim() || '',
      orderSource: body.orderSource || 'website',
      
      // حالة ومواريخ الطلب
      status: "قيد المعالجة",
      createdAt: new Date(),
      updatedAt: new Date(),
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    };

    console.log("📋 Creating order:", newOrder);

    const orderResult = await db.collection("orders").insertOne(newOrder);
    console.log("✅ Order created with ID:", orderResult.insertedId);

    return NextResponse.json({ 
      success: true, 
      orderId: orderResult.insertedId,
      orderNumber: newOrder.orderNumber,
      totalPrice: newOrder.totalPrice,
      message: "تم إنشاء الطلب بنجاح وتحديث المخزون"
    });
  } catch (err) {
    console.error("🚨 Error in POST /api/orders:", err);
    return NextResponse.json({ 
      success: false, 
      error: "فشل حفظ الطلب",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

// GET - Fetch all orders
export async function GET(req) {
  try {
    console.log("🔍 GET /api/orders - Starting...");
    
    const client = await clientPromise;
    const db = client.db("ecommerce");
    
    // Get all orders, sorted by newest first
    const orders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📦 Found ${orders.length} orders`);
    
    return NextResponse.json({ 
      success: true, 
      orders: orders,
      count: orders.length
    });
  } catch (err) {
    console.error("🚨 Error in GET /api/orders:", err);
    return NextResponse.json({ 
      success: false, 
      error: "فشل في تحميل الطلبات",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

// PUT - Update order status
export async function PUT(req) {
  try {
    console.log("🔄 PUT /api/orders - Updating order...");
    
    const body = await req.json();
    const { id, status } = body;

    console.log("📝 Update request:", { id, status });

    if (!id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف الطلب والحالة مطلوبان" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف الطلب غير صحيح" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ecommerce");
    
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      }
    );

    console.log("📊 Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "الطلب غير موجود" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "تم تحديث حالة الطلب",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("🚨 Error in PUT /api/orders:", err);
    return NextResponse.json({ 
      success: false, 
      error: "فشل في تحديث الطلب",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete order
export async function DELETE(req) {
  try {
    console.log("🗑️ DELETE /api/orders - Deleting order...");
    
    const body = await req.json();
    const { id } = body;

    console.log("🎯 Deleting order ID:", id);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف الطلب مطلوب" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "معرف الطلب غير صحيح" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ecommerce");
    
    const result = await db.collection("orders").deleteOne({ 
      _id: new ObjectId(id) 
    });

    console.log("📊 Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "الطلب غير موجود" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "تم حذف الطلب بنجاح",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("🚨 Error in DELETE /api/orders:", err);
    return NextResponse.json({ 
      success: false, 
      error: "فشل في حذف الطلب",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}