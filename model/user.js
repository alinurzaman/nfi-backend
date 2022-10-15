const mongoose = require("mongoose");

const User = mongoose.model("User", {
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
});

module.exports = User;
