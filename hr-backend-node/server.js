const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const DB_FILE = './mock_database.json';
let mockDatabase = [];

if (fs.existsSync(DB_FILE)) {
    try {
        mockDatabase = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        mockDatabase = [];
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1️⃣ ENDPOINT: Submit Data Entry Loop (POST)
app.post('/api/leave/submit', upload.single('certificate'), (req, res) => {
    console.log("\n📡 [Incoming Leave Application Intercepted]");
    console.log(`👤 Employee Name : ${req.body.employeeName}`);

    if (!req.file) {
        return res.status(400).json({ status: "Error", message: "No document attached." });
    }

    const newRecord = {
        requestId: `${Date.now()}`,
        employeeName: req.body.employeeName,
        leaveReason: req.body.reason,
        attachedDocumentUrl: `http://localhost:3000/uploads/${req.file.filename}`,
        originalFileName: req.file.originalname,
        submissionTimestamp: new Date().toLocaleTimeString()
    };

    mockDatabase.push(newRecord);
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDatabase, null, 2));

    console.log("\n📊 [Simulated AWS DynamoDB Table State] Active Sync Matrix:");
    console.table(mockDatabase.map(r => ({ ID: r.requestId, Name: r.employeeName, Time: r.submissionTimestamp })));

    res.status(200).json({ status: "Success", message: "Data structured completely!", records: mockDatabase });
});

// 2️⃣ ENDPOINT: Retrieve Active Ledger (GET)
app.get('/api/leave/records', (req, res) => {
    res.status(200).json(mockDatabase);
});

// 3️⃣ ENDPOINT: Purge Data Entry (DELETE)
app.delete('/api/leave/delete/:id', (req, res) => {
    const targetId = req.params.id;
    console.log(`\n🗑️ [Delete Request Received] Target Record ID: ${targetId}`);

    const recordToDelete = mockDatabase.find(r => r.requestId === targetId);
    if (recordToDelete) {
        const fileName = recordToDelete.attachedDocumentUrl.split('/').pop();
        const filePath = path.join(__dirname, 'uploads', fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    mockDatabase = mockDatabase.filter(record => record.requestId !== targetId);
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDatabase, null, 2));

    console.log("📊 [Updated Ledger State] Records Grid Post-Deletion:");
    console.table(mockDatabase);

    res.status(200).json({ status: "Success", message: "Record removed completely." });
});

const PORT = 3000;
app.listen(PORT, () => console.log("🚀 Resilient Local Cloud-Simulation Server running on Port 3000"));
