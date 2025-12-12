import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import appConfig from './config/appConfig.js';



import flatsRoute from './routes/flats.js';
import paymentsRoute from './routes/payments.js';
import expensesRoute from './routes/expenses.js';
import reportsRoute from './routes/reports.js';
import docsRoute from './routes/documents.js';
import meetingsRoute from './routes/meetings.js';
import whatsappRoute from './routes/whatsapp.js';
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from "./routes/reports.js";
import userRoutes from "./routes/userRoutes.js";
import { loginUser } from './controllers/authController.js';


dotenv.config();
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ your React dev server
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization", // ✅ this line allows the header to pass
    ],
    exposedHeaders: ["Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


// static uploads folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/invoices", express.static(path.join(process.cwd(), "invoices")));



// routes
app.use('/api/flats', flatsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/expenses', expensesRoute);
app.use('/api/reports', reportsRoute); 
app.use('/api/documents', docsRoute);
app.use('/api/meetings', meetingsRoute);
app.use('/api/whatsapp', whatsappRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.post('/api/login', loginUser); 
//app.use("/api", userRoutes);  



app.get('/', (req, res) => res.send(`${appConfig.societyName} Backend Running ✅`));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));