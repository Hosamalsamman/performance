import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
// import nodemailer from "nodemailer";
import cors from "cors";
import { differenceInDays } from 'date-fns';
import { and } from "sequelize";

const app = express();
const port = 3000;
// const myPassword = "mcnz nobk sfuo gvcy";
const saltRounds = 5;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "flutter",
  password: "159851",
  port: 5432,
});
db.connect();

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'abackend51@gmail.com',
//     pass: myPassword
//   }
// });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let current_user_id = 2;

app.get("/register", async (req, res) => {
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id,]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }
  // No one can register new users except if he belongs to IT group
  if (current_user_dep_id === 2) {
    try {
      const result = await db.query("select * from departments");
      res.send(result.rows);
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(400).send("You don't want to be here");
  }
});

app.post("/register", async (req, res) => {
  const name = req.body.name.toLowerCase();
  const password = req.body.password;
  const dep_id = req.body.dep_id;
  // console.log("header: " + req.headers.lang);
  // console.log(`body: ${req.body.name}`);
  // const email = req.body.email;
  // const password = req.body.password;
  // const preferedLanguage = req.headers.lang;
  // let veriCode;
  // function verificationCode() {
  //   veriCode = Math.round(Math.random() * 1000000);
  //   return veriCode;
  // }
  // const mailOptions = {
  //   from: 'abackend51@gmail.com',
  //   to: email,
  //   subject: 'Verification Code',
  //   html: `<h1>Thanks for your registration</h1><p>Your verification code is ${verificationCode()}</p>`
  // };
  // making sure that the user is not exist
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE name = $1", [
      name,
    ]);

    if (checkResult.rows.length > 0) {
      // if (preferedLanguage == "EN") {
      //   res.status(400).send("Email already exists. Try logging in.");
      // } else {
      res.status(400).send("اسم مستخدم مكرر");
      // }

    } else {
      // mail verification

      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     console.log("error: " + error);
      //   } else {
      //     console.log('Email sent: ' + info.response);
      //   }
      //   console.log("verification code: " + veriCode);
      //   res.json({ "vCode": veriCode });
      // });
      // console.log("active: " + req.body.Active);
      // if (req.body.Active == "true") {

      // password Hashing
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        // console.log("password: " + req.body.password);
        if (err) {
          console.log("Error hashing password: ", err);
        } else {
          try {
            const result = await db.query(
              "INSERT INTO users (name, password, dep_id) VALUES ($1, $2, $3)",
              [name, hash, dep_id]
            );
            console.log(`insert result: ${result}`);
            res.status(200).send("سجلته يا برنس");
          } catch (error) {
            console.log(error);
          }

        }
      });

    }
  } catch (err) {
    console.log(err);
  }
})

app.get("/login", (req, res) => {

});

app.post("/login", async (req, res) => {
  // console.log(req.lang);
  const name = req.body.name.toLowerCase();
  const loginPassword = req.body.password;
  // const preferedLanguage = req.headers.lang;

  try {
    const result = await db.query("SELECT users.id, users.name, users.password, users.dep_id, departments.name AS dep_name FROM users join departments ON users.name = $1 and users.dep_id = departments.id", [
      name,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;

      bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
        if (err) {
          console.log("Error comparing passwords: ", err);

        } else {
          if (result) {
            current_user_id = user.id;
            let user_dep_data = {
              dep_id: user.dep_id,
              dep_name: user.dep_name
            };
            console.log(user_dep_data);
            res.status(200).send(user_dep_data);
          } else {
            // if (preferedLanguage == "EN") {
            //   res.status(400).send("Incorrect Password");
            // } else {
            res.status(400).send("كلمة السر خاطئة، برجاء المحاولة مرة أخرى");
            // }

          }
        }
      });

    } else {
      // if (preferedLanguage == "EN") {
      //   res.status(400).send("User not found please register first");
      // } else {
      res.status(400).send("إسم المستخدم غير موجود، برجاء التواصل مع الإدارة العامة لتكنولوجيا المعلومات لعمل حساب لهذا الاسم");
      // }

      // res.redirect("/register");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/logout", async (req, res) => {
  current_user_id = 2;
});

app.get("/changepassword", (req, res) => {

});

app.post("/changepassword", async (req, res) => {
  if (current_user_id === 2) {
    res.sendStatus(400).send("get out of here you didn't login yet");
  } else {
    bcrypt.hash(req.body.new_password, saltRounds, async (err, hash) => {
      if (err) {
        console.log("Error hashing password: ", err);
      } else {
        try {
          const update_password_result = await db.query("UPDATE users SET password = $1 WHERE id = $2", [hash, current_user_id]);
          console.log(update_password_result);
          res.status(200).send("تم تغيير كلمة المرور بنجاح")
        } catch (error) {
          console.log(error);
        }
      }
    });
  }
});
let accessed_dep_id;
// getting indexes for specific department by dep_id
app.get("/department/:id", async (req, res) => {
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
    console.log(current_user_dep_id);
  } catch (error) {
    console.log(error);
  }

  accessed_dep_id = parseInt(req.params.id);
  console.log(accessed_dep_id);

  // making sure that the user has the right to see this route by being a member of same department he's trying to access or belonging to IT department
  if (accessed_dep_id === current_user_dep_id || current_user_dep_id === 2) {
    try {
      const result = await db.query("SELECT * from index_names where dep_id = $1", [accessed_dep_id,]);
      console.log("get data: ");
      console.log(result.rows);
      res.json(result.rows);
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(400).send("forbidden user");
  }

});

// adding new index name for certain department
app.post("/department/:id", async (req, res) => {
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }

  const dep_id = parseInt(req.params.id);
  // making sure that the user has the right to see this route by being a member of same department he's trying to access or belonging to IT department
  if (dep_id === current_user_dep_id || current_user_dep_id === 2) {
    console.log("post request data: ");
    const data = req.body;
    console.log(req.body);
    try {
      const result = await db.query("SELECT index_name FROM index_names where dep_id = $1", [dep_id,]);
      // console.log(result.rows);
      if (result.rows.some(row => row.index_name === data.index_name)) {
        res.status(400).send("اسم المعيار موجود بالفعل");
        console.log("no");
      } else {
        try {
          const insertResult = await db.query("INSERT INTO index_names (index_name, dep_id, index_type) VALUES ($1, $2, $3)", [data.index_name, dep_id, data.index_type]);
          res.status(200).send(insertResult);
          console.log(insertResult);
        } catch (error) {
          // console.log(error);
          res.status(400).send(error);
        }
      }
    } catch (error) {
      // console.log(error);
      res.status(400).send(error);
    }
  } else {
    res.status(400).send("forbidden user");
  }
});

// Editing index name or type
app.patch("/department/:id", async (req, res) => {
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }

  const dep_id = parseInt(req.params.id);
  // making sure that the user has the right to see this route by being a member of same department he's trying to access or belonging to IT department
  if (dep_id === current_user_dep_id || current_user_dep_id === 2) {
    console.log("patch request data: ");
    const data = req.body;
    console.log(req.body);
    try {
      const result = await db.query("SELECT * FROM index_names where dep_id = $1", [dep_id,]);
      // console.log(result.rows);
      if (result.rows.some(row => row.index_name === data.index_name && row.index_id != data.index_id)) {
        res.status(400).send("اسم المعيار موجود بالفعل");
        console.log("no");
      } else {
        try {
          const updateResult = await db.query("UPDATE index_names SET index_name = $1, index_type = $2 WHERE index_id = $3", [data.index_name, data.index_type, data.index_id]);
          res.status(200).send(updateResult);
          console.log(updateResult);
        } catch (error) {
          console.log(error);
          res.status(400).send(error);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  } else {
    res.status(400).send("forbidden user");
  }
});

// Delete an existing index name
app.delete("/department/:id", async (req, res) => {
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }

  const dep_id = parseInt(req.params.id);
  // making sure that the user has the right to see this route by being a member of same department he's trying to access or belonging to IT department
  if (dep_id === current_user_dep_id || current_user_dep_id === 2) {
    console.log("delete request data: ");
    const data = req.body;
    console.log(req.body);
    try {
      // making sure that htere is no data related to this index_name befoe deleting it
      const result = await db.query("SELECT * FROM index_values where index_id = $1", [data.index_id,]);
      // console.log(result.rows);
      if (result.rows.length > 0) {
        res.status(400).send("لا يمكن مسح المعيار لوجود قيم مسجلة له");
        console.log("no");
      } else {
        try {
          const deleteResult = await db.query("DELETE FROM index_names WHERE index_id = $1", [data.index_id]);
          res.status(200).send(deleteResult);
          console.log(deleteResult);
        } catch (error) {
          console.log(error);
          res.status(400).send(error);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  } else {
    res.status(400).send("forbidden user");
  }
});

// getting values for existing index_name
app.get("/index/:id", async (req, res) => {
  let index_result;
  const index_id = parseInt(req.params.id);
  console.log(index_id);
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }
  const data = req.body;
  console.log(data);

  try {
    index_result = await db.query("select index_values.dep_id, index_values.index_id, index_values.index_value, index_values.date, index_values.user_id, index_values.index_period, index_values.index_estimated_value, index_values.observations, index_names.index_name, index_names.index_type from index_values inner join index_names on index_names.index_id = $1 and index_values.index_id = $2", [index_id, index_id]);
    // console.log(index_result.rows);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
  // checking if the index has no values yet
  if (index_result.rows[0] == null) {
    res.status(400).send("لا يوجد قيم مسجلة لهذا المعيار");
  } else {
    // making sure that the user has the right to see the indexes before sending them by being a member of same department he's trying to access or belonging to IT department
    if (index_result.rows[0].dep_id === current_user_dep_id || current_user_dep_id === 2) {

      let structured_data = {
        dep_id: index_result.rows[0].dep_id,
        index_id: index_result.rows[0].index_id,
        values: [],
        index_name: index_result.rows[0].index_name,
        index_type: index_result.rows[0].index_type
      };
      index_result.rows.forEach(row => {
        structured_data.values.push(
          {
            index_value: row.index_value,
            estimated_value: row.index_estimated_value,
            date: row.date,
            user_id: row.user_id,
            index_period: row.index_period,
            observations: row.observations
          }
        );
      });
      console.log(structured_data);
      res.status(200).send(structured_data);
    } else {
      res.status(400).send("forbidden user");
    }

  }


});

// adding new value for an existing index_id
app.post("/index/:id", async (req, res) => {
  const index_id = parseInt(req.params.id);
  console.log(index_id);
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }
  const data = req.body;
  console.log(data);

  // making sure that the user has the right to see this route by being a member of same department he's trying to access or belonging to IT department
  if (current_user_dep_id === data.dep_id || current_user_dep_id === 2) {
    try {
      const insertResult = await db.query("INSERT INTO index_values (dep_id, index_id, index_value, date, user_id, index_period, index_estimated_value, observations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [accessed_dep_id, index_id, data.index_value, data.date, current_user_id, parseInt(data.index_period), data.estimated_value, data.observations]);
      console.log(insertResult);
      res.status(200).send(insertResult);
    } catch (error) {
      console.log(error);
      if (error.code === '23505') {
        res.status(400).send("يوجد تقييم في نفس الفترة لنفس المؤشر");
      } else {
        res.status(400).send(error);
      }
    }
  } else {
    res.status(400).send("forbidden user");
  }
});

// editing an existing value for index_id
app.patch("/index/:id", async (req, res) => {
  const index_id = parseInt(req.params.id);
  console.log(index_id);
  let current_user_dep_id;
  try {
    const result = await db.query("select dep_id from users where id = $1", [current_user_id]);
    current_user_dep_id = result.rows[0].dep_id;
  } catch (error) {
    console.log(error);
  }
  const data = req.body;
  console.log(data);

  // enable editing only for admins
  if (current_user_dep_id === 2) {
//     // get current date
//     const today = new Date();

//     // Get individual components
//     const year = today.getFullYear();
//     const month = today.getMonth() + 1; // Months are 0-indexed
//     const day = today.getDate();

//     // Format the date as "YYYY-MM-DD"
//     const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
//     // get entry date
//     const selectResult = await db.query("select * from index_values where index_id = $1 and date = $2", [data.index_id, data.old_date,]);

//     // check if the row is inserted recently "less than a week" then modification is allowed otherwise it's considered a historical data
//     const differenceInDays = differenceInDays(formattedDate, selectResult.rows[0].entry_date);
//     if (differenceInDays > 7) {
//       res.status(400).send("لا يمكن تعديل القيم بعد مرور سبعة أيام من تاريخ الإدخال");
//     } else {
      try {
        const updateResult = await db.query("UPDATE index_values SET index_value = $1, date = $2, index_period = $3, index_estimated_value = $4, observations = $5 Where index_id = $6 and date = $7",
          [data.index_value, data.date, parseInt(data.index_period), data.estimated_value, data.observations, index_id, data.old_date]);
        console.log(updateResult);
        res.status(200).send(updateResult);
      } catch (error) {
        console.log(error);
        res.status(400).send(error);
      }
//     }
    
  } else {
    res.status(400).send("forbidden user");
  }
});

app.get("/home", async (req, res) => {
  if (current_user_id != 2) {
    try {
      const allDepResult = await db.query("SELECT * FROM departments");
      let all_dep_data_structured = [];
      let sector = {
        parent_id: 0,
        parent_name: "",
        dep_data: []
      };
      allDepResult.rows.forEach(row => {
        if (row.parent_dep_id == null) {
          sector.parent_id = row.id;
          sector.parent_name = row.name;
          all_dep_data_structured.push(sector);
          sector = {
            parent_id: 0,
            parent_name: "",
            dep_data: []
          };
        } else {
          const index = all_dep_data_structured.findIndex(big_row => big_row.parent_id === row.parent_dep_id);
          all_dep_data_structured[index].dep_data.push({
            dep_id: row.id,
            dep_name: row.name
          });
        }
      });
      console.log(all_dep_data_structured);
      res.send(all_dep_data_structured);
      
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }

    
  } else {
    res.status(400).send("برجاء تسجيل الدخول أولا")
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
