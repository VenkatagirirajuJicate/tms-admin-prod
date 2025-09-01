// New route import script with driver and vehicle assignments
// Usage: node scripts/import-new-routes.js

const routeData = [
  {
    routeNumber: "5",
    routeName: "ATHANI",
    startLocation: "JKKN CAMPUS",
    endLocation: "KONDAYAM PALAYAM",
    morningDeparture: "07:20",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:30",
    distance: "40",
    duration: "1 HOUR 45 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "27 STOPS",
    assignedDriver: "KATHIRVEL",
    assignedVehicle: "TN - 28- P 7710"
  },
  {
    routeNumber: "6",
    routeName: "GURUVAREDDIYUR",
    startLocation: "JKKN CAMPUS",
    endLocation: "PUTHUR",
    morningDeparture: "07:20",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:40",
    distance: "47",
    duration: "1 HOUR 55 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "27 STOPS",
    assignedDriver: "SARAVANAN",
    assignedVehicle: "TN - 24 -V 5609"
  },
  {
    routeNumber: "7",
    routeName: "POOLAMPATTI",
    startLocation: "JKKN CAMPUS",
    endLocation: "PILLU KURICHI",
    morningDeparture: "07:20",
    morningArrival: "08:57",
    eveningDeparture: "16:45",
    eveningArrival: "18:40",
    distance: "48",
    duration: "1 HOUR 55 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "20 STOPS",
    assignedDriver: "SATHIYAMOORTHI",
    assignedVehicle: "TN - 28 - M 3337"
  },
  {
    routeNumber: "10",
    routeName: "EDAPPADI",
    startLocation: "JKKN CAMPUS",
    endLocation: "NESAVALAR COLONY",
    morningDeparture: "07:35",
    morningArrival: "08:52",
    eveningDeparture: "16:45",
    eveningArrival: "18:10",
    distance: "43",
    duration: "1 HOUR 25 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "24 STOPS",
    assignedDriver: "RAVI",
    assignedVehicle: "TN - 33 - AC 1199"
  },
  {
    routeNumber: "11",
    routeName: "ANTHIYUR",
    startLocation: "JKKN CAMPUS",
    endLocation: "ANTHIYUR(COLONY)",
    morningDeparture: "07:35",
    morningArrival: "08:50",
    eveningDeparture: "16:45",
    eveningArrival: "18:05",
    distance: "48",
    duration: "1 HOUR 20 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "28 STOPS",
    assignedDriver: "Thirumoorthi",
    assignedVehicle: "TN - 47 - L 6900"
  },
  {
    routeNumber: "12",
    routeName: "KONGANAPURAM",
    startLocation: "JKKN CAMPUS",
    endLocation: "RANGAM PALAYAM",
    morningDeparture: "07:57",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "17:48",
    distance: "36",
    duration: "1 HOUR 03 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "19 STOPS",
    assignedDriver: "Manoj",
    assignedVehicle: "YN - 54 - Y 5666"
  },
  {
    routeNumber: "14",
    routeName: "KOLATHUR",
    startLocation: "JKKN CAMPUS",
    endLocation: "IYAN PIRIVU",
    morningDeparture: "06:50",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:10",
    distance: "63",
    duration: "1 HOUR 35 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "20 STOPS",
    assignedDriver: "KANNAN",
    assignedVehicle: "TN - 34 - MB 5922"
  },
  {
    routeNumber: "15",
    routeName: "SALEM",
    startLocation: "JKKN CAMPUS",
    endLocation: "THIRUVA GOWANDANUR BYPASS",
    morningDeparture: "07:10",
    morningArrival: "08:45",
    eveningDeparture: "16:45",
    eveningArrival: "18:20",
    distance: "52",
    duration: "1 HOUR 45 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "14 STOPS",
    assignedDriver: "SELVARAJ",
    assignedVehicle: "TN - 34 - MB 5936"
  },
  {
    routeNumber: "16",
    routeName: "GOBI",
    startLocation: "JKKN CAMPUS",
    endLocation: "NADUPALAYAM",
    morningDeparture: "07:15",
    morningArrival: "08:50",
    eveningDeparture: "16:45",
    eveningArrival: "18:35",
    distance: "47",
    duration: "1 HOUR 50 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "30 STOPS",
    assignedDriver: "RAMACHANDRAN",
    assignedVehicle: "TN - 28 - AA 9762"
  },
  {
    routeNumber: "18",
    routeName: "GANAPATHIPALAYAM",
    startLocation: "JKKN CAMPUS",
    endLocation: "GANAPATHIPALAYAM",
    morningDeparture: "07:15",
    morningArrival: "08:52",
    eveningDeparture: "16:45",
    eveningArrival: "18:30",
    distance: "74",
    duration: "1 HOUR 35 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "21 STOPS",
    assignedDriver: "RAJESH",
    assignedVehicle: "TN - 34 - MB 5986"
  },
  {
    routeNumber: "19",
    routeName: "OMALUR",
    startLocation: "JKKN CAMPUS",
    endLocation: "OMALUR",
    morningDeparture: "07:00",
    morningArrival: "08:45",
    eveningDeparture: "16:45",
    eveningArrival: "19:00",
    distance: "63",
    duration: "2 HOURS 15 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "13 STOPS",
    assignedDriver: "GOKUL",
    assignedVehicle: "TN - 63 - T 4599"
  },
  {
    routeNumber: "20",
    routeName: "CHENNAMPATTI",
    startLocation: "JKKN CAMPUS",
    endLocation: "KOMARAYANOUR",
    morningDeparture: "07:15",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:25",
    distance: "56",
    duration: "1 HOUR 45 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "26 STOPS",
    assignedDriver: "THAVASIYAPPAN",
    assignedVehicle: "TN - 46 - E 5679"
  },
  {
    routeNumber: "22",
    routeName: "CHITHODE",
    startLocation: "JKKN CAMPUS",
    endLocation: "VELLARI VELLI",
    morningDeparture: "07:10",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:55",
    distance: "40",
    duration: "2 HOURS 5 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "23 STOPS",
    assignedDriver: "ESWARAN",
    assignedVehicle: "TN - 33 - AL 0237"
  },
  {
    routeNumber: "24",
    routeName: "NANGAVALLI",
    startLocation: "JKKN CAMPUS",
    endLocation: "NANGAVALLI",
    morningDeparture: "07:20",
    morningArrival: "08:55",
    eveningDeparture: "16:45",
    eveningArrival: "18:40",
    distance: "55",
    duration: "1 HOUR 55 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "19 STOPS",
    assignedDriver: "ARUN",
    assignedVehicle: "TN - 34 - MB 5991"
  },
  {
    routeNumber: "29",
    routeName: "TIRUPPUR",
    startLocation: "JKKN CAMPUS",
    endLocation: "THIRUPPUR NEW BUS STAND",
    morningDeparture: "07:03",
    morningArrival: "08:52",
    eveningDeparture: "16:45",
    eveningArrival: "18:33",
    distance: "65",
    duration: "1 HOUR 48 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "21 STOPS",
    assignedDriver: "SUDAKAR",
    assignedVehicle: "TN - 59 - BZ 2728"
  },
  {
    routeNumber: "31",
    routeName: "TIRUCHENGODE",
    startLocation: "JKKN CAMPUS",
    endLocation: "THIMARATHAMPATTI",
    morningDeparture: "07:10",
    morningArrival: "08:52",
    eveningDeparture: "16:45",
    eveningArrival: "18:40",
    distance: "33",
    duration: "1 HOUR 55 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "32 STOPS",
    assignedDriver: "DEVENDRAN",
    assignedVehicle: "TN - 59 - BX 7286"
  },
  {
    routeNumber: "36",
    routeName: "ERODE",
    startLocation: "JKKN CAMPUS",
    endLocation: "ERODE BUS STSND",
    morningDeparture: "08:05",
    morningArrival: "08:37",
    eveningDeparture: "16:45",
    eveningArrival: "17:35",
    distance: "22",
    duration: "1 HOUR 50 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "15 STOPS",
    assignedDriver: "SIVAKUMAR",
    assignedVehicle: "TN - 59 - BX 7288"
  },
  {
    routeNumber: "23",
    routeName: "ELAMPILLAI",
    startLocation: "JKKN CAMPUS",
    endLocation: "K R THOPPUR",
    morningDeparture: "06:50",
    morningArrival: "08:52",
    eveningDeparture: "16:45",
    eveningArrival: "19:10",
    distance: "57",
    duration: "2 HOURS 25 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "19 STOPS",
    assignedDriver: "SIVA",
    assignedVehicle: "TN - 28 - P 4959"
  },
  {
    routeNumber: "32",
    routeName: "PAALMADAI",
    startLocation: "JKKN CAMPUS",
    endLocation: "R S",
    morningDeparture: "07:40",
    morningArrival: "08:50",
    eveningDeparture: "16:45",
    eveningArrival: "18:04",
    distance: "42",
    duration: "1 HOUR 19 MINUTES",
    totalCapacity: "",
    fare: "5000",
    startLatitude: "11.4452",
    startLongitude: "77.7307",
    endLatitude: "",
    endLongitude: "",
    routeStops: "21 STOPS",
    assignedDriver: "C.SAKTHIVEL",
    assignedVehicle: "TN - 63 -  V 7299"
  }
];

// Driver name mappings (handle variations in names)
const driverMappings = {
  "KATHIRVEL": "N.KATHIRVEL",
  "SARAVANAN": "C.SARAVANAN", 
  "SATHIYAMOORTHI": "P.SATHIYAMOORTHY",
  "RAVI": "R.RAVI",
  "Thirumoorthi": "P.THIRUMOORTHY",
  "Manoj": "M.MANOJKUMAR",
  "KANNAN": "G.KANNAN",
  "SELVARAJ": "SELVARAJ",
  "RAMACHANDRAN": "C.RAMACHJANDRAN",
  "RAJESH": "A.RAJESH",
  "GOKUL": "V.GOKUL",
  "THAVASIYAPPAN": "THAVASIAYAPPAN",
  "ESWARAN": "P.ARTHANARESWARAN",
  "ARUN": "T.ARUN",
  "SUDAKAR": "D.SUTHAGAR",
  "DEVENDRAN": "R.DEVENDRAN",
  "SIVAKUMAR": "N.SIVAKUMAR",
  "SIVA": "G.SIVA",
  "C.SAKTHIVEL": "C.SAKTHIVEL"
};

// Vehicle registration number mappings (normalize spacing and format)
const vehicleMappings = {
  "TN - 28- P 7710": "TN 28 P 7710",
  "TN - 24 -V 5609": "TN 24 V 5609",
  "TN - 28 - M 3337": "TN 28 M 3337",
  "TN - 33 - AC 1199": "TN 33 AC 1199",
  "TN - 47 - L 6900": "TN 47 L 6900",
  "YN - 54 - Y 5666": "YN 54 Y 5666", // This one doesn't exist in our database
  "TN - 34 - MB 5922": "TN 34 MB 5922",
  "TN - 34 - MB 5936": "TN 34 MB 5936",
  "TN - 28 - AA 9762": "TN 28 AA 9762",
  "TN - 34 - MB 5986": "TN 34 MB 5985", // Close match (5986 vs 5985)
  "TN - 63 - T 4599": "TN 34 T 4599", // Close match (63 vs 34)
  "TN - 46 - E 5679": "TN 46 E 5679",
  "TN - 33 - AL 0237": "TN 34 AL 0237", // Close match (33 vs 34)
  "TN - 34 - MB 5991": "TN 34 MB 5991",
  "TN - 59 - BZ 2728": "TN 59 BX 2728", // Close match (BZ vs BX)
  "TN - 59 - BX 7286": "TN 59 BX 7286",
  "TN - 59 - BX 7288": "TN 59 BX 7286", // Close match (7288 vs 7286)
  "TN - 28 - P 4959": "TN 28 P 4959",
  "TN - 63 -  V 7299": "TN 63 V 7299"
};

async function importRoutes() {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
  const apiUrl = `${baseUrl}/api/admin/routes/bulk-import`;

  try {
    console.log(`🛣️ Starting import of ${routeData.length} routes...`);
    console.log(`📡 API endpoint: ${apiUrl}`);

    // Process the route data
    const processedRoutes = routeData.map(route => ({
      ...route,
      assignedDriverMapped: driverMappings[route.assignedDriver] || route.assignedDriver,
      assignedVehicleMapped: vehicleMappings[route.assignedVehicle] || route.assignedVehicle
    }));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routes: processedRoutes
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`📊 Results:`, result);
      console.log(`🎯 Imported: ${result.inserted_count} routes`);
      
      if (result.assignment_info) {
        console.log(`👥 Driver Assignments:`);
        console.log(`   - Successful: ${result.assignment_info.successful_driver_assignments}`);
        console.log(`   - Failed: ${result.assignment_info.failed_driver_assignments}`);
        console.log(`🚗 Vehicle Assignments:`);
        console.log(`   - Successful: ${result.assignment_info.successful_vehicle_assignments}`);
        console.log(`   - Failed: ${result.assignment_info.failed_vehicle_assignments}`);
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
  console.log('🛣️ New Routes Import Script');
  console.log('============================');
  importRoutes();
}

module.exports = { routeData, driverMappings, vehicleMappings, importRoutes };







