const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyB4p0c7vipVAMvsiXkpNUG28FKnDgwiBoE",
    authDomain: "epiph-test-bot.firebaseapp.com",
    projectId: "epiph-test-bot",
    storageBucket: "epiph-test-bot.firebasestorage.app",
    messagingSenderId: "254213169747",
    appId: "1:254213169747:web:db0be499bf6c8602921ca6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const { doc, query, where } = require("firebase/firestore");

async function verify() {
    console.log("Verifying Firestore Client Access...");
    try {
        // 1. Get Movie Ref
        const movieId = "0010";
        const movieRef = doc(db, 'movies', `movie_${movieId}`);
        console.log(`Querying articles for movie: ${movieRef.path}`);

        // 2. Query Articles
        const q = query(collection(db, 'articles'), where('movieId', '==', movieRef));
        const snapshot = await getDocs(q);

        console.log(`Fetched ${snapshot.size} articles.`);
        snapshot.forEach((doc) => {
            console.log(`Article: ${doc.id} | Cat: ${doc.data().categoryName}`);
        });

    } catch (error) {
        console.error("Error fetching articles:", error);
    }
}

verify();
