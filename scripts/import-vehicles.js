// Vehicle import script for bulk uploading vehicle data
// Usage: node scripts/import-vehicles.js

const vehicleData = [
  {
    registrationNumber: "TN 63 V 7299",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "WDE5466461",
    engineNumber: "WDH295995",
    regYear: "2/2005",
    insuranceExpiryDate: "03.04.2026",
    permit: "22.06.2030",
    fitnessExpiry: "24.11.2025"
  },
  {
    registrationNumber: "TN 47 L 6900",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "LWE536021",
    engineNumber: "LWH282368",
    regYear: "8/2004",
    insuranceExpiryDate: "23.12.2025",
    permit: "27.09.2025",
    fitnessExpiry: "23.04.2026"
  },
  {
    registrationNumber: "TN 30 R 1199",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "DPE610174",
    engineNumber: "DPH440993",
    regYear: "2/2007",
    insuranceExpiryDate: "03.04.2026",
    permit: "06.07.2026",
    fitnessExpiry: "05.03.2026"
  },
  {
    registrationNumber: "TN 28 AA 9762",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "DPE600919",
    engineNumber: "FPH438062",
    regYear: "2/2007",
    insuranceExpiryDate: "05.11.2025",
    permit: "06.07.2026",
    fitnessExpiry: "13.03.2026"
  },
  {
    registrationNumber: "TN 33 AC 1199",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "VWE521455",
    engineNumber: "VWH254690",
    regYear: "1/2004",
    insuranceExpiryDate: "11.11.2025",
    permit: "02.12.2025",
    fitnessExpiry: "05.05.2026"
  },
  {
    registrationNumber: "TN 28 P 4959",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "DFE572748",
    engineNumber: "DFE358050",
    regYear: "1/2006",
    insuranceExpiryDate: "03.04.2026",
    permit: "26.07.2026",
    fitnessExpiry: "22.04.2026"
  },
  {
    registrationNumber: "TN 24 V 5609",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "XPE627325",
    engineNumber: "XPH473590",
    regYear: "2007",
    insuranceExpiryDate: "05.11.2025",
    permit: "13.09.2026",
    fitnessExpiry: "25.02.2026"
  },
  {
    registrationNumber: "TN 34 M 1613",
    vehicleModel: "MAZDA",
    seatingCapacity: "42",
    fuelType: "DIESEL",
    chassisNumber: "MBUZT54XJBO150216",
    engineNumber: "SLT3JB143709",
    regYear: "10/2010",
    insuranceExpiryDate: "23.12.2025",
    permit: "20.02.2026",
    fitnessExpiry: "23.02.2026"
  },
  {
    registrationNumber: "TN 34 T 4599",
    vehicleModel: "BUS",
    seatingCapacity: "61",
    fuelType: "DIESEL",
    chassisNumber: "XPE62670",
    engineNumber: "XPH477288",
    regYear: "7/2007",
    insuranceExpiryDate: "26.12.2025",
    permit: "25.09.2027",
    fitnessExpiry: "08.01.2026"
  },
  {
    registrationNumber: "TN 28 P 7710",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "YFE582740",
    engineNumber: "ZGH381245",
    regYear: "5/2006",
    insuranceExpiryDate: "08.11.2025",
    permit: "28.11.2026",
    fitnessExpiry: "23.12.2025"
  },
  {
    registrationNumber: "TN 34 AL 0237",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "LEE650275",
    engineNumber: "LNH530832",
    regYear: "3/2008",
    insuranceExpiryDate: "05.11.2025",
    permit: "19.01.2027",
    fitnessExpiry: "06.11.2025"
  },
  {
    registrationNumber: "TN 46 E 5679",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "FPE606093",
    engineNumber: "PFH429862",
    regYear: "1/2007",
    insuranceExpiryDate: "05.11.2025",
    permit: "21.08.2027",
    fitnessExpiry: "20.01.2026"
  },
  {
    registrationNumber: "TN 46 F 2644",
    vehicleModel: "BUS",
    seatingCapacity: "61",
    fuelType: "DIESEL",
    chassisNumber: "YPE624662",
    engineNumber: "YPH470304",
    regYear: "7/2007",
    insuranceExpiryDate: "21.06.2026",
    permit: "21.08.2028",
    fitnessExpiry: "11.02.2026"
  },
  {
    registrationNumber: "", // This was "24.11.2025" - clearly a data entry error
    vehicleModel: "BUS",
    seatingCapacity: "61",
    fuelType: "DIESEL",
    chassisNumber: "MPIPE11CX9EJA04236",
    engineNumber: "JXE1068172",
    regYear: "4/2009",
    insuranceExpiryDate: "09.11.2025",
    permit: "09.09.2026",
    fitnessExpiry: "03.02.2026"
  },
  {
    registrationNumber: "TN 28 M 3337",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "97897",
    engineNumber: "NA",
    regYear: "2/2003",
    insuranceExpiryDate: "03.04.2026",
    permit: "22.06.2030",
    fitnessExpiry: "24.10.2025"
  },
  {
    registrationNumber: "TN 33 AM 6374",
    vehicleModel: "BUS",
    seatingCapacity: "61",
    fuelType: "DIESEL",
    chassisNumber: "67016",
    engineNumber: "NXE667016",
    regYear: "3/2009",
    insuranceExpiryDate: "05.11.2025",
    permit: "25.08.2026",
    fitnessExpiry: "11.11.2025"
  },
  {
    registrationNumber: "TN 34 L 6309",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "B4634",
    engineNumber: "NAH644240",
    regYear: "7/2010",
    insuranceExpiryDate: "21.02.2026",
    permit: "09.02.2026",
    fitnessExpiry: "23.01.2026"
  },
  {
    registrationNumber: "TN 28 AS 7997",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "N1278",
    engineNumber: "EYEZ408794",
    regYear: "5/2014",
    insuranceExpiryDate: "02.04.2026",
    permit: "24.03.2027",
    fitnessExpiry: "29.06.2026"
  },
  {
    registrationNumber: "TN 34 W 4280",
    vehicleModel: "MAZDA",
    seatingCapacity: "42",
    fuelType: "DIESEL",
    chassisNumber: "4842",
    engineNumber: "SLTHT3CW198460",
    regYear: "3/2015",
    insuranceExpiryDate: "05.11.2025",
    permit: "23.08.2025",
    fitnessExpiry: "06.11.2025"
  },
  {
    registrationNumber: "TN 59 BX 7286",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBYC3DEAK7458",
    engineNumber: "DAEZ404046",
    regYear: "03/2013",
    insuranceExpiryDate: "12.03.2026",
    permit: "11.05.2027",
    fitnessExpiry: "08.06.2026"
  },
  {
    registrationNumber: "TN 59 BX 7293",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBYC1DEAK7233",
    engineNumber: "DAEZ404027",
    regYear: "03/2013",
    insuranceExpiryDate: "12.03.2026",
    permit: "11.05.2027",
    fitnessExpiry: "08.06.2026"
  },
  {
    registrationNumber: "TN 59 BX 7277",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBEYC3DEAK6908",
    engineNumber: "DAEZ403780",
    regYear: "03/2013",
    insuranceExpiryDate: "12.03.2026",
    permit: "04.05.2027",
    fitnessExpiry: "22.05.2025"
  },
  {
    registrationNumber: "TN 59 BX 7281",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBEYC0DEAK7014",
    engineNumber: "DEAZ403864",
    regYear: "03/2013",
    insuranceExpiryDate: "12.03.2026",
    permit: "11.05.2027",
    fitnessExpiry: "04.06.2025"
  },
  {
    registrationNumber: "TN 59 BZ 0789",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBRYOSCHYD4568",
    engineNumber: "CYHZ105517",
    regYear: "03/2012",
    insuranceExpiryDate: "12.03.2026",
    permit: "11.05.2027",
    fitnessExpiry: "17.06.2025"
  },
  {
    registrationNumber: "TN 59 BX 2728",
    vehicleModel: "BUS",
    seatingCapacity: "59",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBEYCICHYD4924",
    engineNumber: "CYH105836",
    regYear: "03/2012",
    insuranceExpiryDate: "12.03.2026",
    permit: "04.05.2027",
    fitnessExpiry: "21.05.2026"
  },
  {
    registrationNumber: "TN 34 MB 5936",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "MC2R7NRT0RB232194",
    engineNumber: "E426CDRB468720",
    regYear: "Aug-24",
    insuranceExpiryDate: "03.04.2026",
    permit: "08.08.2029",
    fitnessExpiry: "no"
  },
  {
    registrationNumber: "TN 34 MB 5991",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "MC2R7NRT0RB232191",
    engineNumber: "E426CDRB468723",
    regYear: "Aug24",
    insuranceExpiryDate: "03.04.2026",
    permit: "08.08.2029",
    fitnessExpiry: "no"
  },
  {
    registrationNumber: "TN 34 MB 5922",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "MC2R7NRT0RB232192",
    engineNumber: "E426CDRB468738",
    regYear: "Aug-24",
    insuranceExpiryDate: "03.04.2026",
    permit: "08.08.2029",
    fitnessExpiry: "no"
  },
  {
    registrationNumber: "TN 34 MB 5985",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "MC2R7NRT0RB232193",
    engineNumber: "E426CDRB468725",
    regYear: "Aug-24",
    insuranceExpiryDate: "03.04.2026",
    permit: "08.08.2029",
    fitnessExpiry: "no"
  },
  {
    registrationNumber: "TN 37 CY 7212",
    vehicleModel: "BUS",
    seatingCapacity: "60",
    fuelType: "DIESEL",
    chassisNumber: "MBIPBEFC5EEXN4604",
    engineNumber: "EXEZ411815",
    regYear: "Aug-24",
    insuranceExpiryDate: "28.01.2026",
    permit: "06.08.2030",
    fitnessExpiry: "09.02.2026"
  }
];

async function importVehicles() {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
  const apiUrl = `${baseUrl}/api/admin/vehicles/bulk-import`;

  try {
    console.log(`🚀 Starting import of ${vehicleData.length} vehicles...`);
    console.log(`📡 API endpoint: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vehicles: vehicleData
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`📊 Results:`, result);
      console.log(`🎯 Imported: ${result.inserted_count} vehicles`);
    } else {
      console.error('❌ Import failed:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error during import:', error);
    console.error('Make sure the admin server is running on the correct port');
  }
}

// Run the import
if (require.main === module) {
  console.log('🚗 Vehicle Import Script');
  console.log('========================');
  importVehicles();
}

module.exports = { vehicleData, importVehicles };







