import "dotenv/config"
import app from "./app.js"
import { connectDB } from "./config/db.js"

const PORT = process.env.PORT || 3000;

await connectDB();

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error);
    process.exit(1);
});