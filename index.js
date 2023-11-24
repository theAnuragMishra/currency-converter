import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import NewsAPI  from "newsapi";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import{getFirestore, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion,arrayRemove, serverTimestamp, orderBy, deleteDoc} from "firebase/firestore";
import session from 'express-session';
import fetch from 'node-fetch';


//constants and variables
const app = express();
const port = 3000;
    const newsAPIKey = process.env.NEWS_API_KEY

//firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  appId: process.env.FIREBASE_APP_ID,


};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

//express session

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));


//set view engine and static folder
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));



//home route
app.get("/", (req, res) => {

  const newsapi = new NewsAPI(newsAPIKey);
newsapi.v2.topHeadlines({
  category: 'business',
  language: 'en',
    country: 'in'
}).then((response)=>{
  let titleArray = [];
  let authorArray = [];
  let descriptionArray = [];
  let urlArray = [];
  let urlToImageArray = [];

for(let i = response.articles.length-1; i>=0; i--){
  if(response.articles[i].title === null || response.articles[i].author === null || response.articles[i].description === null || response.articles[i].url === null || response.articles[i].urltoImage === null){continue;}

  titleArray.push(response.articles[i].title);

authorArray.push(response.articles[i].author);
   descriptionArray.push(response.articles[i].description);

   urlArray.push(response.articles[i].url);
   urlToImageArray.push(response.articles[i].urlToImage);


  }

res.render("home", {titleArray:titleArray,  urlToImageArray:urlToImageArray , urlArray:urlArray, authorArray:authorArray, descriptionArray:descriptionArray, user: req.session.user});
});

});
//home route ends

//convert route
app.get("/convert", async (req,res)=>{
    if (req.session.user) {
        let fromArray = [];
        let toArray = [];
        const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc)=>{
            fromArray = doc.data().from;
            toArray = doc.data().to;

        })
    res.render('convert', {user:req.session.user,fromArray:fromArray, toArray:toArray});
    }
else{
    let fromArray = [];
        let toArray = [];
    res.render("convert", {user:req.session.user,fromArray:fromArray, toArray:toArray})}
})

app.get('/conversion', (req, res) => {
  const amount = req.query.amount;
  const fromCurrency = req.query.from;
  const toCurrency = req.query.to;

  fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_KEY}/pair/${fromCurrency}/${toCurrency}/${amount}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.conversion_result !== undefined) {
          res.json({ convertedAmount: data.conversion_result.toFixed(2)});
      }}).catch((error) => {console.log(error);});

});


//team route
app.get("/team", (req, res) => {
  res.render("team", {user: req.session.user});
});

//team route ends

//auth route
app.get("/auth", (req, res) => { res.render("auth", {user: req.session.user})});

app.post("/login", (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in
        req.session.user = userCredential.user;
        res.redirect('/convert')

    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        res.redirect("/auth");
    });

})

app.post("/signup", (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
        const signUpUser = userCredential.user;
        updateProfile(signUpUser, {displayName: name}).then(() => {
        });
        await addDoc(collection(db, "favorites"), {
            userid : signUpUser.uid,
        });
    }).then(()=>{signInWithEmailAndPassword(auth, email, password).then((userCredential) => {req.session.user=userCredential.user;
    res.redirect("/convert");
    });})
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode,errorMessage);
        res.redirect("/auth");
    });

    }
)

//logout
app.post("/logout", (req,res)=>{
    signOut(auth).then(() => {
        req.session.destroy();
        res.redirect("/auth");
      }).catch((error) => {
        console.log(error);
      });
})

//auth route ends

//profile route
app.get("/profile", async(req, res) => {
    if(req.session.user){
const q = query(collection(db, "history"), where("userid", '==', req.session.user.uid));
const querySnapshot = await getDocs(q);
const historyCount = querySnapshot.size;
res.render("profile", {user: req.session.user, historyCount:historyCount});

    } else{res.redirect('/auth');}

})

//history route
app.get('/history', async (req,res)=>{

    if(req.session.user){
        let amountArray = [];
let resultArray = [];
let fromArray = [];
let toArray = [];
let timeArray=[];

    const q = query(collection(db, "history"), where("userid", "==", req.session.user.uid), orderBy("convertedAt", "desc"));

const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
    amountArray.push(doc.data().item.amount);
    resultArray.push(doc.data().item.result);
    fromArray.push(doc.data().item.from);
    toArray.push(doc.data().item.to);
    timeArray.push(doc.data().convertedAt);
});
    res.render('history', {user:req.session.user, amountArray:amountArray, resultArray:resultArray, fromArray:fromArray, toArray:toArray, timeArray:timeArray});
    }
    else{res.redirect('/auth');}

})

//favorites route
app.get('/favorites', async (req,res)=> {
    if (req.session.user) {
        let fromArray=[];
        let toArray=[];
        const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc)=>{
            fromArray = doc.data().from;
            toArray = doc.data().to;

        })
    res.render('favorites', {user:req.session.user,fromArray:fromArray, toArray:toArray});
    }
    else{
        res.redirect('/auth');

    }
})

//add-to-history
app.post('/add-to-history', async (req, res) => {
    try {
        if (req.session.user) {
            const conversionData = req.body;

            await Promise.all([addDoc(collection(db, "history"), {
                userid: req.session.user.uid,
                item: conversionData,
                convertedAt: serverTimestamp()
            })]);

            res.status(200).send("Conversion data added to history successfully");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


//clear-history
app.post('/clear-history', async (req, res) => {
  try {
    if (req.session.user) {
      const q = query(collection(db, "history"), where("userid", "==", req.session.user.uid));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);

      res.status(200).send("History cleared");
    } else {
      res.status(403).send("Unauthorized");
    }
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).send("Internal Server Error");
  }
});

//add-to-favorites
app.post('/add-to-favorites-from', async (req, res) => {
    try {
        if (req.session.user) {
            const currency = req.body.currency;
            const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {

                res.status(404).send("No matching document found");
                return;
            }


            const updatePromises = querySnapshot.docs.map(async (doc) => {
                await updateDoc(doc.ref, {
                    from: arrayUnion(currency)
                });
            });

            await Promise.all(updatePromises);

            res.status(200).send("Currency added to favorites successfully");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/add-to-favorites-to', async (req, res) => {
    try {
        if (req.session.user) {
            const currency = req.body.currency;
            const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {

                res.status(404).send("No matching document found");
                return;
            }


            const updatePromises = querySnapshot.docs.map(async (doc) => {
                await updateDoc(doc.ref, {
                    to: arrayUnion(currency)
                });
            });

            await Promise.all(updatePromises);

            res.status(200).send("Currency added to favorites successfully");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


//delete-from-favorites-from
app.post('/delete-from-favorites-from', async (req, res) => {
    try {
        if (req.session.user) {
            const currency = req.body.currency;
            const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {

                res.status(404).send("No matching document found");
                return;
            }


            const updatePromises = querySnapshot.docs.map(async (doc) => {
                await updateDoc(doc.ref, {
                    from: arrayRemove(currency)
                });
            });

            await Promise.all(updatePromises);

            res.status(200).send("Currency removed successfully");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


//delete-from-favorites-to
app.post('/delete-from-favorites-to', async (req, res) => {
    try {
        if (req.session.user) {
            const currency = req.body.currency;
            const q = query(collection(db, "favorites"), where("userid", "==", req.session.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                res.status(404).send("No matching document found");
                return;
            }

            const updatePromises = querySnapshot.docs.map(async (doc) => {
                await updateDoc(doc.ref, {
                    to: arrayRemove(currency)
                });
            });

            await Promise.all(updatePromises);

            res.status(200).send("Currency removed successfully");
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


//listening
app.listen(port, () => {
  console.log(`server running on ${port}`);
});