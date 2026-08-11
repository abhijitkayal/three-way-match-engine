require('dotenv').config();
const mongoose = require('mongoose');
const { SkuMaster } = require('./models');

// Seed data based on the supplied PO/GRN/Invoice documents
// PO Number: CI4PO05788
// Source: PO is the primary source for item details
// Cross-referenced with GRN and Invoice where available
const SKU_DATA = [
  {
  skuErpCode: '18003',
  name: 'Meatigo Chicken Curry Cut Skinless Frozen 450g',
  eanCode: 'FG-M-F-0620',
  hsnCode: '02071300',
  uom: 'PKT',
  agreedRate: 141.143,
  mrp: 195,
  priceTolerance: 0.05,
},
{
  skuErpCode: '18004',
  name: 'Meatigo Chicken Boneless Breast Frozen 450g',
  eanCode: 'FG-M-F-0619',
  hsnCode: '02071300',
  uom: 'PKT',
  agreedRate: 199.048,
  mrp: 275,
  priceTolerance: 0.05,
},
{
  skuErpCode: '205950',
  name: 'Pork Pepperoni Salami 100g',
  eanCode: 'FG-P-F-0237',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 133.905,
  mrp: 185,
  priceTolerance: 0.05,
},
{
  skuErpCode: '253430',
  name: 'Salami 200g',
  eanCode: 'FG-P-F-0249',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 188.190,
  mrp: 260,
  priceTolerance: 0.05,
},
{
  skuErpCode: '33387',
  name: 'Chicken Chilli Salami 200g',
  eanCode: 'FG-P-F-0234',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 126.667,
  mrp: 175,
  priceTolerance: 0.05,
},
{
  skuErpCode: '33390',
  name: 'Seekh Kebab 500g',
  eanCode: 'FG-P-F-0413',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 228.000,
  mrp: 315,
  priceTolerance: 0.05,
},
{
  skuErpCode: '398656',
  name: 'Meatigo Chicken Drumsticks 450g',
  eanCode: 'FG-M-F-0602',
  hsnCode: '02071400',
  uom: 'PKT',
  agreedRate: 188.190,
  mrp: 260,
  priceTolerance: 0.05,
},
{
  skuErpCode: '414867',
  name: 'Veg Spring Rolls 240g',
  eanCode: 'FG-P-F-1707',
  hsnCode: '20049000',
  uom: 'PKT',
  agreedRate: 119.429,
  mrp: 165,
  priceTolerance: 0.05,
},
{
  skuErpCode: '432518',
  name: 'Meatigo Chicken Kheema 450g',
  eanCode: 'FG-M-F-0622',
  hsnCode: '02071400',
  uom: 'PKT',
  agreedRate: 199.048,
  mrp: 275,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4459',
  name: 'Original Chicken Momos 24 Pieces',
  eanCode: 'FG-P-F-0505',
  hsnCode: '21069099',
  uom: 'PKT',
  agreedRate: 220.762,
  mrp: 305,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4460',
  name: 'Spicy Chicken Momos 24 Pieces',
  eanCode: 'FG-P-F-0512',
  hsnCode: '21069099',
  uom: 'PKT',
  agreedRate: 220.762,
  mrp: 305,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4461',
  name: 'Veg & Paneer Momos 24 Pieces',
  eanCode: 'FG-P-F-0514',
  hsnCode: '21069099',
  uom: 'PKT',
  agreedRate: 202.667,
  mrp: 280,
  priceTolerance: 0.05,
},
{
  skuErpCode: '453259',
  name: 'Chicken Cheese & Onion Sausage 250g',
  eanCode: 'FG-P-F-0335',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 144.762,
  mrp: 200,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4694',
  name: 'Original Chicken Momos 10 Pieces',
  eanCode: 'FG-P-F-0504',
  hsnCode: '21069099',
  uom: 'PKT',
  agreedRate: 133.905,
  mrp: 185,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4697',
  name: 'Veg & Paneer Momos 10 Pieces',
  eanCode: 'FG-P-F-0513',
  hsnCode: '21069099',
  uom: 'PKT',
  agreedRate: 112.190,
  mrp: 155,
  priceTolerance: 0.05,
},
{
  skuErpCode: '469735',
  name: 'Meatigo Everyday Chicken Breast Frozen 150g',
  eanCode: 'FG-M-F-1728',
  hsnCode: '16021000',
  uom: 'PKT',
  agreedRate: 119.429,
  mrp: 165,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4699',
  name: 'Pork Sausage 250g',
  eanCode: 'FG-P-F-0323',
  hsnCode: '16010000',
  uom: 'PKT',
  agreedRate: 170.095,
  mrp: 235,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4700',
  name: 'Pork Ham 200g',
  eanCode: 'FG-P-F-0236',
  hsnCode: '16024900',
  uom: 'PKT',
  agreedRate: 177.333,
  mrp: 245,
  priceTolerance: 0.05,
},
{
  skuErpCode: '4701',
  name: 'Pork Breakfast Bacon 300g',
  eanCode: null,
  hsnCode: '16024900',
  uom: 'PKT',
  agreedRate: 267.810,
  mrp: 370,
  priceTolerance: 0.05,
},
{
  skuErpCode: '470663',
  name: 'Whole Wheat Momos - Veg & Paneer 330g',
  eanCode: 'FG-P-F-0580',
  hsnCode: '19022010',
  uom: 'PKT',
  agreedRate: 162.857,
  mrp: 225,
  priceTolerance: 0.05,
},
{
  skuErpCode: '790919',
  name: 'Meatigo Everyday Fish Fillet 200g',
  eanCode: 'FG-M-F-1729',
  hsnCode: '16042000',
  uom: 'PKT',
  agreedRate: 188.190,
  mrp: 260,
  priceTolerance: 0.05,
},
{
  skuErpCode: '750414',
  name: 'Super Saver Chicken Momo Pack (Chef Momos) 1kg',
  eanCode: 'FG-P-F-0501',
  hsnCode: '19022010',
  uom: 'KG',
  agreedRate: 247.619,
  mrp: 650,
  priceTolerance: 0.05,
},
{
  skuErpCode: '755774',
  name: 'Chicken & Cheese Momos 540g',
  eanCode: 'FG-P-F-0564',
  hsnCode: '16021000',
  uom: 'PKT',
  agreedRate: 238.857,
  mrp: 330,
  priceTolerance: 0.05,
},
{
  skuErpCode: '81521',
  name: 'Chicken Momos 250g',
  eanCode: 'FG-P-F-0542',
  hsnCode: '19022010',
  uom: 'PKT',
  agreedRate: 72.019,
  mrp: 199,
  priceTolerance: 0.05,
}
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let inserted = 0;
    let skipped = 0;

    for (const data of SKU_DATA) {
      const existing = await SkuMaster.findOne({ skuErpCode: data.skuErpCode });
      if (existing) {
        skipped++;
        continue;
      }
      await SkuMaster.create(data);
      inserted++;
    }

    console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped (already exist)`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
