import sequelize from '../config/database.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import DemandData from '../models/DemandData.js';
import { CompetitorPrice } from '../models/CompetitorPrice.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        // 1. Create Default User
        const hashedPassword = await bcrypt.hash('password', 10);
        const [user] = await User.findOrCreate({
            where: { email: 'admin@example.com' },
            defaults: {
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword
            }
        });
        console.log(`👤 User created/found: ${user.email}`);

        // 2. Dummy Products Data
        const productsData = [
            {
                name: 'Wireless Noise Cancelling Headphones',
                sku: 'ELEC-001',
                category: 'Electronics',
                currentPrice: 9999.00,
                costPrice: 6000.00,
                stockQuantity: 150,
                minPrice: 8000.00,
                maxPrice: 12000.00,
                seasonality_index: 0.9,
                description: 'Premium over-ear headphones with active noise cancellation.'
            },
            {
                name: 'Smartphone 5G 128GB',
                sku: 'ELEC-002',
                category: 'Electronics',
                currentPrice: 24999.00,
                costPrice: 18000.00,
                stockQuantity: 80,
                minPrice: 22000.00,
                maxPrice: 28000.00,
                seasonality_index: 1.1,
                description: 'Latest 5G smartphone with 128GB storage and dual camera.'
            },
            {
                name: 'Running Shoes - Men',
                sku: 'FASH-001',
                category: 'Fashion',
                currentPrice: 3499.00,
                costPrice: 1500.00,
                stockQuantity: 300,
                minPrice: 2500.00,
                maxPrice: 4500.00,
                seasonality_index: 1.2,
                description: 'Lightweight running shoes for daily training.'
            },
            {
                name: 'Mechanical Gaming Keyboard',
                sku: 'COMP-001',
                category: 'Electronics',
                currentPrice: 4500.00,
                costPrice: 2500.00,
                stockQuantity: 120,
                minPrice: 3800.00,
                maxPrice: 5500.00,
                seasonality_index: 1.0,
                description: 'RGB mechanical keyboard with blue switches.'
            },
            {
                name: 'Designer Sunglasses',
                sku: 'FASH-002',
                category: 'Fashion',
                currentPrice: 5999.00,
                costPrice: 2000.00,
                stockQuantity: 200,
                minPrice: 4500.00,
                maxPrice: 7500.00,
                seasonality_index: 1.5,
                description: 'UV protection aviator sunglasses.'
            },
            {
                name: 'Cotton T-Shirt Pack (3pcs)',
                sku: 'FASH-003',
                category: 'Fashion',
                currentPrice: 999.00,
                costPrice: 400.00,
                stockQuantity: 500,
                minPrice: 800.00,
                maxPrice: 1200.00,
                seasonality_index: 1.0,
                description: 'Soft cotton crew neck t-shirts.'
            },
            {
                name: 'Smart Watch Series 5',
                sku: 'ELEC-003',
                category: 'Electronics',
                currentPrice: 15999.00,
                costPrice: 10000.00,
                stockQuantity: 60,
                minPrice: 14000.00,
                maxPrice: 18000.00,
                seasonality_index: 1.2,
                description: 'Fitness tracker and smartwatch with heart rate monitor.'
            },
            {
                name: 'Leather Wallet',
                sku: 'ACC-001',
                category: 'Accessories',
                currentPrice: 1499.00,
                costPrice: 500.00,
                stockQuantity: 250,
                minPrice: 1200.00,
                maxPrice: 2000.00,
                seasonality_index: 0.8,
                description: 'Genuine leather bi-fold wallet.'
            },
            {
                name: '4K Action Camera',
                sku: 'CAM-001',
                category: 'Electronics',
                currentPrice: 8999.00,
                costPrice: 5000.00,
                stockQuantity: 90,
                minPrice: 7500.00,
                maxPrice: 10500.00,
                seasonality_index: 1.3,
                description: 'Waterproof 4K action camera with wifi.'
            },
            {
                name: 'Yoga Mat',
                sku: 'FIT-001',
                category: 'Fitness',
                currentPrice: 1299.00,
                costPrice: 400.00,
                stockQuantity: 400,
                minPrice: 999.00,
                maxPrice: 1600.00,
                seasonality_index: 1.1,
                description: 'Non-slip exercise yoga mat.'
            }
        ];

        console.log('📦 Seeding Products...');

        for (const pData of productsData) {
            const [product, created] = await Product.findOrCreate({
                where: { sku: pData.sku },
                defaults: { ...pData, userId: user.id }
            });

            console.log(`- Created/Found product: ${product.name}`);

            // 3. Clear old data and match ML model requirement (Need > 60 days for 30 day forecast)
            await DemandData.destroy({ where: { productId: product.id } });

            // 4. Generate Historical Demand Data (Last 90 days)
            const demandEntries = [];
            const today = new Date();

            for (let i = 0; i < 90; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                // Random demand based on stock and seasonality
                const baseDemand = Math.floor(Math.random() * 50) + 10;
                const demand = Math.floor(baseDemand * (pData.seasonality_index || 1));

                demandEntries.push({
                    productId: product.id,
                    date: date,
                    quantity_sold: demand,
                    revenue: demand * pData.currentPrice
                });
            }

            await DemandData.bulkCreate(demandEntries);
            console.log(`  - Added 90 days of sales history`);

            // 5. Add Competitor Prices
            // Clear old competitor prices first
            await CompetitorPrice.destroy({ where: { productId: product.id } });
            const competitorPrices = [
                { name: 'Amazon', price: pData.currentPrice * (0.9 + Math.random() * 0.2) }, // Random +/- 10%
                { name: 'Flipkart', price: pData.currentPrice * (0.9 + Math.random() * 0.2) },
                { name: 'Croma', price: pData.currentPrice * (0.95 + Math.random() * 0.15) }
            ];

            for (const comp of competitorPrices) {
                await CompetitorPrice.create({
                    productId: product.id,
                    competitorName: comp.name,
                    price: parseFloat(comp.price.toFixed(2))
                });
            }
            console.log(`  - Added competitor prices`);
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
