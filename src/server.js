import app from "./app.js"
import "dotenv/config"

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error);
    process.exit(1);
});