

const db = db.getSiblingDB("hospital_management");

// Drop existing collections to start fresh
print("\n========================================");
print("Dropping existing collections...");
print("========================================\n");

db.users.drop();
db.doctors.drop();
db.patients.drop();
db.appointments.drop();
db.wallets.drop();

// Create collections
print("Creating collections..."); 
db.createCollection('users');
db.createCollection('doctors');
db.createCollection('patients');
db.createCollection('appointments');
db.createCollection('wallets');

// Create indexes for better performance
print("Creating indexes...");
db.users.createIndex({ "email": 1 }, { unique: true });
db.doctors.createIndex({ "userId": 1 });
db.patients.createIndex({ "userId": 1 });
db.appointments.createIndex({ "patientUserId": 1 });
db.appointments.createIndex({ "doctorUserId": 1 });
db.appointments.createIndex({ "date": 1 });
db.wallets.createIndex({ "userId": 1 }, { unique: true });

// Insert sample admin user
// Password: admin123
// SHA256 hash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
print("\nInserting admin user...");
const adminResult = db.users.insertOne({
    email: "admin@hospital.com",
    password: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    role: "admin",
    name: "System Administrator",
    createdAt: new Date() 
});

// Create admin wallet
db.wallets.insertOne({
    userId: adminResult.insertedId.toString(),
    balance: 0.0,
    transactions: []
});

// Insert sample doctors with Pakistani names
print("Inserting sample doctors...");
const sampleDoctors = [
    {
        name: "Dr. Ahmed Hassan",
        email: "ahmed.hassan@hospital.com",
        department: "Cardiology",
        specialization: "Heart Surgery",
        experience: 15,
        schedule: [
            { day: "weekday", hours: "9:00 AM - 5:00 PM" },
            { day: "saturday", hours: "9:00 AM - 1:00 PM" },
            { day: "sunday", hours: "Closed" }
        ]
    },
    {
        name: "Dr. Fatima Khan",
        email: "fatima.khan@hospital.com",
        department: "Pediatrics",
        specialization: "Child Care",
        experience: 10,
        schedule: [
            { day: "weekday", hours: "8:00 AM - 4:00 PM" },
            { day: "saturday", hours: "Closed" },
            { day: "sunday", hours: "Closed" }
        ]
    },
    {
        name: "Dr. Ali Raza",
        email: "ali.raza@hospital.com",
        department: "Orthopedics",
        specialization: "Bone Surgery",
        experience: 12,
        schedule: [
            { day: "weekday", hours: "10:00 AM - 6:00 PM" },
            { day: "saturday", hours: "10:00 AM - 2:00 PM" },
            { day: "sunday", hours: "Closed" }
        ]
    },
    {
        name: "Dr. Ayesha Malik",
        email: "ayesha.malik@hospital.com",
        department: "Neurology",
        specialization: "Brain & Nervous System",
        experience: 8,
        schedule: [
            { day: "weekday", hours: "9:00 AM - 5:00 PM" },
            { day: "saturday", hours: "9:00 AM - 1:00 PM" },
            { day: "sunday", hours: "Closed" }
        ]
    },
    {
        name: "Dr. Imran Siddiqui",
        email: "imran.siddiqui@hospital.com",
        department: "General Medicine",
        specialization: "Family Medicine",
        experience: 18,
        schedule: [
            { day: "weekday", hours: "8:00 AM - 6:00 PM" },
            { day: "saturday", hours: "9:00 AM - 2:00 PM" },
            { day: "sunday", hours: "Closed" }
        ]
    },
    {
        name: "Dr. Zainab Ahmed",
        email: "zainab.ahmed@hospital.com",
        department: "Dermatology",
        specialization: "Skin Care",
        experience: 7,
        schedule: [
            { day: "weekday", hours: "10:00 AM - 5:00 PM" },
            { day: "saturday", hours: "10:00 AM - 1:00 PM" },
            { day: "sunday", hours: "Closed" }
        ]
    }
];

// Insert each doctor with user account and wallet
sampleDoctors.forEach(doctor => {
    // Create user account (Password: doctor123)
    const userResult = db.users.insertOne({
        email: doctor.email,
        password: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
        role: "doctor",
        name: doctor.name,
        createdAt: new Date()
    });
    
    const userId = userResult.insertedId.toString();
    
    // Create doctor profile with schedule
    db.doctors.insertOne({
        userId: userId,
        name: doctor.name,
        email: doctor.email,
        department: doctor.department,
        specialization: doctor.specialization,
        experience: doctor.experience,
        schedule: doctor.schedule
    });
    
    // Create wallet
    db.wallets.insertOne({
        userId: userId,
        balance: 0.0,
        transactions: []
    });
    
    print("✓ Created doctor: " + doctor.name);
});

// Insert sample patients with Pakistani names
print("\nInserting sample patients...");
const samplePatients = [
    {
        name: "Muhammad Bilal",
        email: "bilal.khan@email.com",
        age: 35,
        gender: "male",
        phone: "+92-300-1234567",
        address: "House 123, Block A, Gulshan-e-Iqbal, Karachi"
    },
    {
        name: "Sana Iqbal",
        email: "sana.iqbal@email.com",
        age: 28,
        gender: "female",
        phone: "+92-321-2345678",
        address: "Flat 45, Clifton, Karachi"
    },
    {
        name: "Hassan Ali",
        email: "hassan.ali@email.com",
        age: 42,
        gender: "male",
        phone: "+92-333-3456789",
        address: "House 67, DHA Phase 5, Karachi"
    },
    {
        name: "Maryam Shahid",
        email: "maryam.shahid@email.com",
        age: 31,
        gender: "female",
        phone: "+92-345-4567890",
        address: "Apartment 12, Nazimabad, Karachi"
    },
    {
        name: "Usman Tariq",
        email: "usman.tariq@email.com",
        age: 39,
        gender: "male",
        phone: "+92-312-5678901",
        address: "House 89, North Nazimabad, Karachi"
    },
    {
        name: "Hira Aslam",
        email: "hira.aslam@email.com",
        age: 25,
        gender: "female",
        phone: "+92-334-6789012",
        address: "Flat 23, PECHS, Karachi"
    }
];

// Insert each patient with user account and wallet
samplePatients.forEach(patient => {
    // Create user account (Password: patient123)
    const userResult = db.users.insertOne({
        email: patient.email,
        password: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
        role: "patient",
        name: patient.name,
        createdAt: new Date()
    });
    
    const userId = userResult.insertedId.toString();
    
    // Create patient profile
    db.patients.insertOne({
        userId: userId,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address
    });
    
    // Create wallet with initial balance
    db.wallets.insertOne({
        userId: userId,
        balance: 100.0,
        transactions: [
            {
                amount: 100.0,
                type: "credit",
                description: "Initial balance",
                timestamp: new Date().toISOString()
            }
        ]
    });
    
    print("✓ Created patient: " + patient.name);
});

// Create some sample appointments
print("\nCreating sample appointments...");
const allDoctors = db.doctors.find().toArray();
const allPatients = db.patients.find().toArray();

if (allDoctors.length > 0 && allPatients.length > 0) {
    // Create appointment 1: Today, pending
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    db.appointments.insertOne({
        patientUserId: allPatients[0].userId,
        doctorUserId: allDoctors[0].userId,
        date: todayStr,
        time: "10:00",
        reason: "General checkup - chest pain",
        status: "pending",
        rejectionReason: ""
    });
    print("✓ Created appointment 1");
    
    // Create appointment 2: Tomorrow, approved
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    db.appointments.insertOne({
        patientUserId: allPatients[1].userId,
        doctorUserId: allDoctors[1].userId,
        date: tomorrowStr,
        time: "14:00",
        reason: "Child vaccination",
        status: "approved",
        rejectionReason: ""
    });
    print("✓ Created appointment 2");
    
    // Create appointment 3: Next week, approved
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    db.appointments.insertOne({
        patientUserId: allPatients[2].userId,
        doctorUserId: allDoctors[2].userId,
        date: nextWeekStr,
        time: "11:00",
        reason: "Knee pain consultation",
        status: "approved",
        rejectionReason: ""
    });
    print("✓ Created appointment 3");
    
    // Create appointment 4: Yesterday, rejected
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    db.appointments.insertOne({
        patientUserId: allPatients[3].userId,
        doctorUserId: allDoctors[3].userId,
        date: yesterdayStr,
        time: "15:30",
        reason: "Headache and dizziness",
        status: "rejected",
        rejectionReason: "Doctor not available at requested time"
    });
    print("✓ Created appointment 4");
}

print("\n========================================");
print("MongoDB Initialization Complete!");
print("========================================");
print("\n📋 Sample Accounts Created:");
print("\n👤 Admin:");
print("   Email: admin@hospital.com");
print("   Password: admin123");
print("\n👨‍⚕️ Doctors (6 accounts):");
print("   Password for all: doctor123");
sampleDoctors.forEach(doc => {
    print("   - " + doc.name + " (" + doc.email + ")");
});
print("\n🏥 Patients (6 accounts):");
print("   Password for all: patient123");
samplePatients.forEach(pat => {
    print("   - " + pat.name + " (" + pat.email + ")");
});
print("\n========================================");
print("📊 Database Statistics:");
print("========================================");
print("   Users: " + db.users.countDocuments());
print("   Doctors: " + db.doctors.countDocuments());
print("   Patients: " + db.patients.countDocuments());
print("   Appointments: " + db.appointments.countDocuments());
print("   Wallets: " + db.wallets.countDocuments());
print("========================================");
print("\n✅ All done! You can now start your application.");
print("========================================\n");