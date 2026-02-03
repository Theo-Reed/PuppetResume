const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('miniprogram_db');
    
    await db.collection('member_schemes').deleteMany({});
    await db.collection('member_schemes').insertMany([
      {
        scheme_id: 1,
        name_chinese: "体验会员",
        name_english: "Trial Member",
        type: "trial",
        price: 500,
        original_price: 500,
        days: 3,
        points: 5,
        description_chinese: "新用户赠送 | 基础体验",
        description_english: "New user gift | Basic trial",
        level: 1,
        isHidden: true
      },
      {
        scheme_id: 2,
        name_chinese: "周卡会员",
        name_english: "Sprint Pass",
        type: "sprint",
        price: 990,
        original_price: 1990,
        days: 7,
        points: 10,
        description_chinese: "短期加速 | 七天冲刺",
        description_english: "Short-term boost | 7-day sprint",
        level: 2,
      },
      {
        scheme_id: 3,
        name_chinese: "标准会员",
        name_english: "Standard Member",
        type: "standard",
        price: 1990,
        original_price: 2990,
        days: 30,
        points: 25,
        description_chinese: "职场必备 | 月度稳进",
        description_english: "Career essential | Monthly steady",
        level: 3,
      },
      {
        scheme_id: 4,
        name_chinese: "高级会员",
        name_english: "Premium Member",
        type: "ultimate",
        price: 4990,
        original_price: 9990,
        days: 30,
        points: 120,
        description_chinese: "火力全开 | 尊享特权",
        description_english: "Full speed ahead | Premium perks",
        level: 4,
      },
      {
        scheme_id: 5,
        name_chinese: "算力加油包",
        name_english: "Points Top-up",
        type: "topup",
        price: 490,
        original_price: 990,
        days: 0,
        points: 10,
        description_chinese: "灵活补给 | 永久有效",
        description_english: "Flexible top-up | Forever valid",
        level: 0,
      }
    ]);
    
    // Also clear users to test new initUser
    await db.collection('users').deleteMany({});
    await db.collection('users').createIndex({ openid: 1 }, { unique: true });
    
    await db.collection('resumes').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('search_conditions').deleteMany({});
    await db.collection('saved_jobs').deleteMany({});
    
    console.log('Successfully initialized member_schemes and cleared users.');
  } finally {
    await client.close();
  }
}

main().catch(console.error);
