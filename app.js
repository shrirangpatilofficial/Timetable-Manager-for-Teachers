const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const { MongoClient, ServerApiVersion } = require('mongodb');
const _ = require('lodash');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const Timetable = require('./models/TimeTable')

//mongoose.connect("mongodb+srv://adi:2001@cluster0.ozlgteg.mongodb.net/todolist?retryWrites=true&w=majority")
mongoose.connect("mongodb+srv://spatil8637:8jJZykVhlAESAYzD@cluster0.mnpr2go.mongodb.net/TimetableManager").then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});


const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"))
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
const authRoutes = require('./routes/auth');
app.use(authRoutes);
app.use(express.json());



app.get("/", function(req, res){
    // const item = [];
    
    res.render('home');
    //res.render('list', {listTitle: "Today", newListItem: results});
})

app.get('/admindash', async (req, res) => {
  try {
    const { user, dept } = req.query;

    // Fetch users from MongoDB
    const users = await User.find({ department: dept });
    
    console.log(users)

    // Render the dashboard again, passing user info and user list
    res.render('admindashs', {
      user,
      dept,
      users
    });

  } catch (error) {
    res.status(500).send('Server error: ' + error.message);
  }
});

// app.get('/admin/dashboard', (req, res) => {
//     //res.send('Welcome to Admin Dashboard');
//     const { user, dept } = req.query;

//     // Fetch users from MongoDB
//     const users = User.find({ department: dept });

//     console.log(users)
//     res.render('adminDash', {user : req.query.user, dept: req.query.dept, users: users});
//   });

app.get('/admin/dashboard', async (req, res) => {
  try {
    const { user, dept } = req.query;

    // Await the result of the query
    const users = await User.find({ department: dept });
    const allTimetables = await Timetable.find({}).sort({ semester: 1 });


    //console.log(users);
    res.render('adminDash', { user, dept, users, timetables : allTimetables });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

  
  app.get('/professor/dashboard', (req, res) => {
    
    //console.log(req.query)
    res.render('profdashboard', {user : req.query.user, dept: req.query.dept});
  });
  
  app.get('/student/dashboard', (req, res) => {
    res.send('Welcome to Student Dashboard');
  });

  app.get('/timetable', async (req, res) => {
    try {
      const timetable = await Timetable.find({});
      res.status(200).json(timetable);
    } catch (err) {
      console.error("❌ Error fetching timetable:", err);
      res.status(500).json({ message: 'Failed to fetch timetable' });
    }
  });
  
  app.post('/timetable', async (req, res) => {
    console.log("Received data:", req.body);  // 👈 Add this for debugging
    try {
      const data = req.body;
    
      // Ensure the data is an array of timetable objects
      if (!Array.isArray(data)) {
        return res.status(400).json({ success: false, message: "Invalid data format. Expected an array of timetable objects." });
      }
  
      // Validate the structure of each timetable object
      for (const item of data) {
        // Check if 'semester' and 'entries' are provided
        if (!item.semester || !Array.isArray(item.entries)) {
          return res.status(400).json({ success: false, message: "Each timetable object must have a semester and an array of entries." });
        }
  
        // Validate each entry inside 'entries'
        for (const entry of item.entries) {
          if (!entry.day || !entry.slot || !entry.subject) {
            return res.status(400).json({ success: false, message: "Each timetable entry must have day, slot, and subject." });
          }
        }
      }
    
      // Insert the timetable data into the database
      const savedTimetable = await Timetable.insertMany(data);
      res.status(201).json({ success: true, message: "Timetable saved successfully!", savedTimetable });
    } catch (err) {
      console.error('Error saving timetable:', err);
      res.status(500).json({ success: false, message: "Error saving timetable to the database." });
    }
  });


  app.get('/existing-semesters', async(req, res)=>{
    try{
      const semesters = await Timetable.find({}, 'semester');
      res.status(200).json({semesters});
    }catch(err){
      console.error("Error fetching semesters: ", err);
      res.status(500).json({message:'Server error'});
    }
  });

  // 📌 Get timetable for a specific semester
app.get('/timetable/:semester', async (req, res) => {
  const { semester } = req.params;

  try {
    const timetable = await Timetable.findOne({ semester: Number(semester) });
    
    if (!timetable) {
      return res.status(404).json({ message: `No timetable found for semester ${semester}` });
    }

    res.status(200).json(timetable);
  } catch (err) {
    console.error(`❌ Error fetching timetable for semester ${semester}:`, err);
    res.status(500).json({ message: 'Failed to fetch timetable' });
  }
});

app.get('/timetable-all', async (req, res) => {
  try {
    const allTimetables = await Timetable.find({}).sort({ semester: 1 });
    console.log("Fetched Semesters:", allTimetables.map(t => t.semester));
    res.render('allSemestersTimetable', { timetables: allTimetables });
  } catch (err) {
    console.error("Error fetching all timetables:", err);
    res.status(500).send("Server error");
  }
});

  
app.listen(3000, function(){
    console.log("server started on port 3000");
})