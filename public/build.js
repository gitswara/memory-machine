import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC2XMqfBo94Gc3u-bwhWM9SuRiqaNkN21I",
  authDomain: "memorymachine-4b6b6.firebaseapp.com",
  projectId: "memorymachine-4b6b6",
  storageBucket: "memorymachine-4b6b6.appspot.com",
  messagingSenderId: "469437378480",
  appId: "1:469437378480:web:3ddb7f6ec99cbedc3f7075"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const MAX_BATCH_WRITES = 450;
const IMAGE_CHUNK_SIZE = 800000;

const form = document.getElementById("memoryForm");
const memoryList = [];
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = form.date.value;
  const story = form.story.value.trim();
  const imageFile = form.image.files[0];

  if (!date || !story || !imageFile) {
    alert("Please fill all fields.");
    return;
  }

  const wordCount = story.split(/\s+/).filter(w => w.length > 0).length;
  const maxWords = 150;

  if (wordCount > maxWords) {
    alert(`Story is too long! Limit is ${maxWords} words. You have ${wordCount}.`);
    return;
  }

  try {
    const base64 = await toBase64(imageFile);
    const imageChunks = splitBase64(base64, IMAGE_CHUNK_SIZE); // larger chunks => fewer Firestore writes
    console.log("Split images into chunks");
    memoryList.push({
      date,
      story,
      imageChunks // store chunks for later upload in separate documents
    });
    console.log("Pushed to memory");

    form.reset();
    document.getElementById("finishMachine").style.display = "block";
  } catch (error) {
    console.error("Error encoding image:", error);
    alert("There was a problem processing your image.");
  }
});


document.getElementById("finishMachine").addEventListener("click", async () => {
  if (memoryList.length === 0) {
    alert("Add at least one memory before finishing.");
    return;
  }

  const code = generateCode();
  document.getElementById("form-screen").style.display = "none";
  document.getElementById("loading-screen").style.display = "flex";
  
  try {
    const machineRef = doc(collection(db, "machines"));
    const writes = [
      {
        ref: machineRef,
        data: {
          code,
          createdAt: new Date()
        }
      }
    ];

    for (const mem of memoryList) {
      const memoryRef = doc(collection(db, `machines/${machineRef.id}/memories`));
      writes.push({
        ref: memoryRef,
        data: {
          date: String(mem.date),
          story: String(mem.story),
          chunkCount: mem.imageChunks.length
        }
      });

      console.log("Stored memory metadata in db");

      for (let i = 0; i < mem.imageChunks.length; i++) {
        writes.push({
          ref: doc(collection(db, `machines/${machineRef.id}/memories/${memoryRef.id}/chunks`)),
          data: {
            index: i,
            data: mem.imageChunks[i]
          }
        });
      }
    }

    await commitBatchedWrites(writes);
    window.location.href = `/code.html?code=${code}`;
  } catch (err) {
    console.error("Error saving to Firestore:", err);
    alert("There was a problem saving your machine.");
    document.getElementById("form-screen").style.display = "none";

  }
});



function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function splitBase64(base64String, chunkSize = 300000) {
  const chunks = [];
  for (let i = 0; i < base64String.length; i += chunkSize) {
    chunks.push(base64String.slice(i, i + chunkSize));
  }
  return chunks;
}

async function commitBatchedWrites(writes) {
  for (let i = 0; i < writes.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    const chunk = writes.slice(i, i + MAX_BATCH_WRITES);
    for (const write of chunk) {
      batch.set(write.ref, write.data);
    }
    await batch.commit();
  }
}


//work on better encryption of code
function generateCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
