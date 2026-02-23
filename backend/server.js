require("dotenv").config();
require("./src/cron/resetMarkets");

const app = require("./src/app");

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
