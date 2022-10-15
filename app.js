const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const Decimal128 = require("mongodb").Decimal128;

const { body, validationResult } = require("express-validator");
const methodOverride = require("method-override");

const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const User = require("./model/user");

const app = express();
const port = 3000;

app.use(methodOverride("_method"));

//Setup View Engine
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

//Home Section
app.get("/", async (req, res) => {
  const users = await User.find();
  res.render("user", {
    layout: "layouts/main-layout",
    title: "List of Users",
    users,
    msg: req.flash("msg"),
  });
});

//Add A New User
app.post("/", (req, res) => {
  User.insertMany(req.body, () => {
    req.flash("msg", "A new user has been added.");
    res.redirect("/");
  });
});

//Deposit Section
app.get("/deposit/:_id", async (req, res) => {
  const user = await User.findOne({ _id: req.params._id });

  res.render("deposit", {
    title: "Deposit Form",
    layout: "layouts/main-layout",
    user,
  });
});

app.put(
  "/deposit",
  [
    body("deposit").custom((value) => {
      if (value === "0") {
        throw new Error("Deposit must greater than zero!");
      }
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("deposit", {
        title: "Deposit Form",
        layout: "layouts/main-layout",
        errors: errors.array(),
        user: req.body,
      });
    } else {
      const total = (
        parseFloat(req.body.balance) + parseFloat(req.body.deposit)
      ).toString();

      User.updateOne(
        { _id: req.body._id },
        {
          $set: {
            balance: Decimal128.fromString(total),
          },
        }
      ).then(() => {
        req.flash("msg", "Deposit success");
        res.redirect("/");
      });
    }
  }
);

//Withdraw Section
app.get("/withdraw/:_id", async (req, res) => {
  const user = await User.findOne({ _id: req.params._id });

  res.render("withdraw", {
    title: "Withdraw Form",
    layout: "layouts/main-layout",
    user,
  });
});

app.put(
  "/withdraw",
  [
    body("withdraw").custom((value, { req }) => {
      if (value === "0") {
        throw new Error("Withdrawal must greater than zero!");
      } else if (parseFloat(value) > parseFloat(req.body.balance)) {
        throw new Error("Withdrawal must less than user balance!");
      }
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("withdraw", {
        title: "Withdrawal Form",
        layout: "layouts/main-layout",
        errors: errors.array(),
        user: req.body,
      });
    } else {
      const total = (
        parseFloat(req.body.balance) - parseFloat(req.body.withdraw)
      ).toString();

      User.updateOne(
        { _id: req.body._id },
        {
          $set: {
            balance: Decimal128.fromString(total),
          },
        }
      ).then(() => {
        req.flash("msg", "Withdrawal success");
        res.redirect("/");
      });
    }
  }
);

app.listen(port, () => {
  console.log(`NFI Backend Assessment | listening at http://localhost:${port}`);
});
