// Driver import script for bulk uploading driver data
// Usage: node scripts/import-drivers.js

const driverData = [
  {
    fullName: "P.ARTHANARESWARAN",
    dateOfJoining: "06/01/2005",
    vehicle: "BUS",
    routeNumber: "22",
    phoneNumber: "9942488343",
    emailAddress: "arthanareswaran22@jkkn.ac.in"
  },
  {
    fullName: "A.RAJESH",
    dateOfJoining: "10/05/2006",
    vehicle: "BUS",
    routeNumber: "18",
    phoneNumber: "9865434429",
    emailAddress: "rajesh18@jkkn.ac.in"
  },
  {
    fullName: "C.SARAVANAN",
    dateOfJoining: "01/11/2010",
    vehicle: "BUS",
    routeNumber: "6",
    phoneNumber: "6344846772",
    emailAddress: "saravanan6@jkkn.ac.in"
  },
  {
    fullName: "P.THIRUMOORTHY",
    dateOfJoining: "10/11/2011",
    vehicle: "BUS",
    routeNumber: "11",
    phoneNumber: "9916829080",
    emailAddress: "thirumoorthy11@jkkn.ac.in"
  },
  {
    fullName: "G.KANNAN",
    dateOfJoining: "03/04/2013",
    vehicle: "BUS",
    routeNumber: "14",
    phoneNumber: "8144436020",
    emailAddress: "kannan14@jkkn.ac.in"
  },
  {
    fullName: "C.RAMACHJANDRAN",
    dateOfJoining: "07/12/2015",
    vehicle: "BUS",
    routeNumber: "16",
    phoneNumber: "9566340999",
    emailAddress: "ramachjandran16@jkkn.ac.in"
  },
  {
    fullName: "C.SAKTHIVEL",
    dateOfJoining: "19/06/2015",
    vehicle: "BUS",
    routeNumber: "32",
    phoneNumber: "9944273037",
    emailAddress: "sakthivel32@jkkn.ac.in"
  },
  {
    fullName: "N.SIVAKUMAR",
    dateOfJoining: "01/01/2018",
    vehicle: "BUS",
    routeNumber: "36",
    phoneNumber: "9965033307",
    emailAddress: "sivakumar36@jkkn.ac.in"
  },
  {
    fullName: "N.KATHIRVEL",
    dateOfJoining: "17/07/2019",
    vehicle: "BUS",
    routeNumber: "5",
    phoneNumber: "9942808863",
    emailAddress: "kathirvel5@jkkn.ac.in"
  },
  {
    fullName: "M.MANOJKUMAR",
    dateOfJoining: "24/02/2019",
    vehicle: "BUS",
    routeNumber: "12",
    phoneNumber: "9965171516",
    emailAddress: "manojkumar12@jkkn.ac.in"
  },
  {
    fullName: "P.SATHIYAMOORTHY",
    dateOfJoining: "01/12/2022",
    vehicle: "DENTAL",
    routeNumber: "7",
    phoneNumber: "6297930190",
    emailAddress: "sathiyamoorthy7@jkkn.ac.in"
  },
  {
    fullName: "D.SUTHAGAR",
    dateOfJoining: "01/12/2022",
    vehicle: "BUS",
    routeNumber: "29",
    phoneNumber: "9952483580",
    emailAddress: "suthagar29@jkkn.ac.in"
  },
  {
    fullName: "R.DEVENDRAN",
    dateOfJoining: "01/12/2023",
    vehicle: "BUS",
    routeNumber: "31",
    phoneNumber: "9578962886",
    emailAddress: "devendran31@jkkn.ac.in"
  },
  {
    fullName: "V.GOKUL",
    dateOfJoining: "01/08/2024",
    vehicle: "BUS",
    routeNumber: "19",
    phoneNumber: "7373241431",
    emailAddress: "gokul19@jkkn.ac.in"
  },
  {
    fullName: "P.MUTHUKUMAR",
    dateOfJoining: "13/02/2025",
    vehicle: "BUS",
    routeNumber: "37",
    phoneNumber: "9585485891",
    emailAddress: "muthukumar37@jkkn.ac.in"
  },
  {
    fullName: "T.ARUN",
    dateOfJoining: "12/02/2025",
    vehicle: "BUS",
    routeNumber: "24",
    phoneNumber: "9994501280",
    emailAddress: "arun24@jkkn.ac.in"
  },
  {
    fullName: "G.SIVA",
    dateOfJoining: "01/02/2025",
    vehicle: "BUS",
    routeNumber: "23",
    phoneNumber: "9360908052",
    emailAddress: "siva23@jkkn.ac.in"
  },
  {
    fullName: "SELVARAJ",
    dateOfJoining: "02/07/2025",
    vehicle: "BUS",
    routeNumber: "15",
    phoneNumber: "9486190727",
    emailAddress: "selvaraj15@jkkn.ac.in"
  },
  {
    fullName: "R.RAVI",
    dateOfJoining: "25/06/2025",
    vehicle: "BUS",
    routeNumber: "10",
    phoneNumber: "9944674296",
    emailAddress: "ravi10@jkkn.ac.in"
  },
  {
    fullName: "THAVASIAYAPPAN",
    dateOfJoining: "19/01/2015",
    vehicle: "BUS",
    routeNumber: "20",
    phoneNumber: "9791900193",
    emailAddress: "thavasiayappan20@jkkn.ac.in"
  }
];

async function importDrivers() {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
  const apiUrl = `${baseUrl}/api/admin/drivers/bulk-import`;

  try {
    console.log(`👨‍💼 Starting import of ${driverData.length} drivers...`);
    console.log(`📡 API endpoint: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drivers: driverData
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`📊 Results:`, result);
      console.log(`🎯 Imported: ${result.inserted_count} drivers`);
      
      if (result.route_mapping_info) {
        console.log(`📍 Route Mapping:`);
        console.log(`   - Total routes available: ${result.route_mapping_info.total_routes_available}`);
        console.log(`   - Drivers with routes: ${result.route_mapping_info.drivers_with_routes}`);
        console.log(`   - Drivers without routes: ${result.route_mapping_info.drivers_without_routes}`);
      }
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
  console.log('👨‍💼 Driver Import Script');
  console.log('========================');
  importDrivers();
}

module.exports = { driverData, importDrivers };







